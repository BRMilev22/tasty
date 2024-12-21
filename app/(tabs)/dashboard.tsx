import React, { useState, useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { styled } from 'nativewind';
import GoalsScreen from './goals';
import InventoryScreen from './inventory';
import RecipesScreen from './recipes';
import ScanScreen from './scan';
import { Text, TouchableOpacity, ImageBackground, FlatList } from 'react-native';

const auth = getAuth();
const db = getFirestore();
const Tab = createBottomTabNavigator();

const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImageBackground = styled(ImageBackground);

interface DashboardProps {
  onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardProps> = ({ onLogout }) => {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [bmi, setBmi] = useState<number | null>(null);
  const [water, setWaterConsumption] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
  
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data fetched:', userData);
  
          setProfileImage(userData?.profileImage || '');
  
          const weightString = userData?.weight || null;
          const heightString = userData?.height || null;
  
          // Convert strings to numbers
          const weight = weightString ? parseFloat(weightString) : null;
          const height = heightString ? parseFloat(heightString) : null;
  
          if (weight && height) {
            // Validate values before calculation
            if (!isNaN(weight) && !isNaN(height) && height > 0) {
              const calculatedBmi = weight / ((height / 100) * (height / 100));
              setBmi(calculatedBmi);
            } else {
              console.error('Invalid weight or height values:', { weight, height });
              setBmi(null);
            }
          } else {
            setBmi(null); // Handle missing weight or height
          }

          if (weight) {
            if (!isNaN(weight)) {
              const calculatedWaterConsumption = weight * 0.035;
              setWaterConsumption(calculatedWaterConsumption);
            } else {
              console.error('Invalid weight value:', { weight });
              setWaterConsumption(null);
            }
          } else {
            setWaterConsumption(null);
          }
  
          if (!userData?.goal) {
            console.log('No goal found for user, redirecting to GoalsSelect.');
            navigation.replace('goalsSelect');
          }
        } else {
          console.log('User document does not exist in the "users" collection.');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [user, navigation]);  

  useEffect(() => {
    setDashboardData([
      { id: '1', title: 'Вашият индекс на телесна маса', description: 'Изчисляване на ИТМ...' },
      { id: '2', title: 'Вашият дневен прием на вода', description: 'Изчисляване на дневен прием на вода...' },
    ]);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    if (item.id === '1') {
      return (
        <View style={[styles.cardContainer, styles.bmiCard]}>
          <Text style={styles.cardTitle}>Вашият индекс на телесна маса</Text>
          {loading ? (
            <Text style={styles.bmiValue}>Зареждане...</Text>
          ) : bmi !== null ? (
            <>
              <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
              <Text style={styles.bmiDescription}>
                {bmi < 18.5
                  ? 'Поднормено тегло'
                  : bmi >= 18.5 && bmi <= 24.9
                  ? 'Нормално тегло'
                  : bmi >= 25 && bmi <= 29.9
                  ? 'Наднормено тегло'
                  : 'Затлъстяване'}
              </Text>
            </>
          ) : (
            <Text style={styles.bmiValue}>Невалидни или липсващи данни относно масата и/или височината.</Text>
          )}
        </View>
      );
    }

    if (item.id === '2') {
      return (
        <View style={[styles.cardContainer, styles.waterCard]}>
          <Text style={styles.cardTitle}>Вашият дневен прием на вода</Text>
          {loading ? (
            <Text style={styles.waterValue}>Зареждане...</Text>
          ) : water !== null ? (
            <>
              <Text style={styles.waterValue}>{water.toFixed(2) + " L"}</Text>
            </>
          ) : (
            <Text style={styles.waterValue}>Невалидни или липсващи данни относно масата.</Text>
          )}
        </View>
      );
    }
  
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
    );
  };  

  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-[#f4f7fa]">
        <ActivityIndicator size="large" color="#00aaff" />
      </StyledView>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          size = focused ? 36 : 24;
          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Goals') {
            iconName = 'flag';
          } else if (route.name === 'Inventory') {
            iconName = 'cart';
          } else if (route.name === 'Recipes') {
            iconName = 'restaurant';
          } else if (route.name === 'Scan') {
            iconName = 'scan';
          }

          return <Ionicons name={iconName || 'home'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00aaff',
        tabBarInactiveTintColor: '#b0bec5',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 65,
          paddingBottom: 14,
          paddingTop: 6,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
        },
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>
        {() => (
          <StyledView style={styles.container}>
            <StyledImageBackground
              source={{
                uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
              }}
              style={styles.imageBackground}
              blurRadius={20}
            >
              <StyledView style={styles.headerContainer}>
                <StyledText style={styles.welcomeText}>
                  Добре дошли, {user?.email || 'User'}!
                </StyledText>
                <TouchableOpacity onPress={() => navigation.navigate('editProfile')}>
                  <Image
                    source={{
                      uri:
                        profileImage ||
                        'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg',
                    }}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </StyledView>
              <FlatList
                data={dashboardData}
                renderItem={renderCard}
                keyExtractor={(item) => item.id}
                style={styles.cardList}
              />
              <StyledView style={styles.logoutContainer}>
                <StyledTouchableOpacity
                  onPress={handleLogout}
                  style={styles.logoutButton}
                >
                  <StyledText style={styles.logoutText}>Отпишете се</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </StyledImageBackground>
          </StyledView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardList: {
    marginTop: 20,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bmiCard: {
    backgroundColor: '#e3f2fd',
  },
  waterCard: {
    backgroundColor: '#e3f2fd',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  bmiDescription: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  waterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  waterDescription: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  logoutContainer: {
    alignItems: 'center',
    marginBottom: 20,
    flex: 1,
    justifyContent: 'flex-end',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DashboardScreen;

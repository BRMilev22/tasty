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
import EditProfileScreen from '../editProfile';
import { Text, TouchableOpacity, ImageBackground } from 'react-native';

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

  useEffect(() => {
    const checkUserGoal = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileImage(userData.profileImage || ''); // Set profile image URL if exists
          if (!userData.goal) {
            console.log('No goal found for user, redirecting to GoalsSelect.');
            navigation.replace('goalsSelect');
          }
        }
      } catch (err) {
        console.error('Error checking goal:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserGoal();
  }, [user, navigation]);
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setProfileImage(userData.profileImage || '');
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
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
                  Welcome, {user?.email || 'User'}!
                </StyledText>
                <TouchableOpacity onPress={() => navigation.navigate('editProfile')}>
                  <Image
                    source={{
                      uri:
                        profileImage ||
                        'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg',
                    }} // Use profile pic URL
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </StyledView>

              <StyledView style={styles.logoutContainer}>
                <StyledTouchableOpacity
                  onPress={handleLogout}
                  style={styles.logoutButton}
                >
                  <StyledText style={styles.logoutText}>Logout</StyledText>
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
    flexDirection: 'column',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
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

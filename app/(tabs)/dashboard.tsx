import React, { useState, useEffect } from 'react';
import { ScrollView, View, Alert, ActivityIndicator, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
  const [profileImage, setProfileImage] = useState<string | null>(null); // State for profile image

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
      <StyledView className="flex-1 justify-center items-center bg-[#141e30]">
        <ActivityIndicator size="large" color="#1e90ff" />
      </StyledView>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

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
        tabBarActiveTintColor: '#1e90ff',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: 'rgba(34, 36, 40, 1)' },
      })}
    >
      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>
        {() => (
          <StyledView className="flex-1">
            <StyledImageBackground
              source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
              className="flex-1 justify-center items-center bg-[#141e30]"
              blurRadius={20}
            >
              <StyledScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-5 top-10">
                {/* Header Section */}
                <StyledView className="flex-row justify-between items-center w-full mb-5">
                  <StyledText className="text-3xl font-bold text-black">
                    Welcome, {user?.email || 'User'}!
                  </StyledText>
                  <TouchableOpacity onPress={() => navigation.navigate('editProfile')}>
                    <Image
                      source={{ uri: profileImage || 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg' }} // Use profile pic URL
                      style={{ width: 60, height: 60, borderRadius: 40 }}
                    />
                  </TouchableOpacity>
                </StyledView>

                {/* Logout Button */}
                <StyledView className="items-center mb-10">
                  <StyledTouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-500 rounded-full px-6 py-3 shadow-lg"
                  >
                    <StyledText className="text-white text-lg">Logout</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>

                {/* Rest of your Dashboard UI */}
                {/* ... */}
              </StyledScrollView>
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

export default DashboardScreen;
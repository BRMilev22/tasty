import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from './(tabs)/dashboard';
import AuthScreen from './auth/AuthScreen';
import WelcomeScreen from './welcomeScreen'; // Import the WelcomeScreen
import RegisterScreen from './auth/RegisterScreen'; // Import the RegisterScreen
import GenderSelectionScreen from './genderSelect';
import GoalSelectionScreen from './goalsSelect';
import HeightSelectionScreen from './heightSelect';
import WeightSelectionScreen from './weightSelect';
import EditProfileScreen from './editProfile';
import AddMealScreen from './(tabs)/addMeal';
import ExpoCamera from './(tabs)/scan'
import { ExternalLink } from '@/components/ExternalLink';

const Stack = createNativeStackNavigator();

const _layout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    console.log('Login successful');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    console.log('Logout successful');
  };

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        setIsFirstLaunch(false);
      }
    };

    const checkLoginState = async () => {
      const storedUser = await AsyncStorage.getItem('userToken');
  
      const unsubscribe = getAuth().onAuthStateChanged((user) => {
        if (user || storedUser) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      });
  
      return () => unsubscribe(); // Cleanup the listener when component unmounts
    };
   
    /*
    const clearStorage = async () => {
      await AsyncStorage.removeItem('hasLaunched');
    }
      */
    //clearStorage();
    checkFirstLaunch();
    checkLoginState();
  }, []);

  return (
<Stack.Navigator>
  {isFirstLaunch && !isLoggedIn ? (
    // If it's the first launch and the user is not logged in, show the WelcomeScreen
    <Stack.Screen
      name="welcomeScreen"
      options={{ headerShown: false }}
      children={({ navigation, route }) => (<WelcomeScreen navigation={navigation} route={route} onLogin={handleLogin} />
    )}
/>
  ) : !isFirstLaunch && !isLoggedIn ? (
    // If it's not the first launch and the user is not logged in, show the AuthScreen
    <Stack.Screen
      name="auth/AuthScreen"
      options={{ headerShown: false }}
      children={() => <AuthScreen onLogin={handleLogin} />}
    />
  ) : (
    // If it's not the first launch and the user is logged in, show the Dashboard
    <Stack.Screen
      name="(tabs)/dashboard"
      options={{ headerShown: false }}
      children={() => <Dashboard onLogout={handleLogout} />}
    />
  )}
  <Stack.Screen
    name="auth/RegisterScreen"
    options={{ headerShown: false }}
    component={RegisterScreen}
  />
  <Stack.Screen name="editProfile" component={EditProfileScreen} options={{ headerShown: false }} />
  <Stack.Screen name="goalsSelect" component={GoalSelectionScreen} options={{ headerShown: false }} />
  <Stack.Screen name="heightSelect" component={HeightSelectionScreen} options={{ headerShown: false }} />
  <Stack.Screen name="weightSelect" component={WeightSelectionScreen} options={{ headerShown: false }} />
  <Stack.Screen name="genderSelect" component={GenderSelectionScreen} options={{ headerShown: false }} />
  <Stack.Screen name="addMeal" component={AddMealScreen} options={{ headerShown: false }} />
  <Stack.Screen name="scan" component={ExpoCamera} options={{ headerShown: false }} />
</Stack.Navigator>
  );
};

export default _layout;
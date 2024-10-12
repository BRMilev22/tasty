import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from './(tabs)/dashboard';
import AuthScreen from './auth/AuthScreen';
import WelcomeScreen from './welcomeScreen'; // Import the WelcomeScreen
import RegisterScreen from './auth/RegisterScreen'; // Import the RegisterScreen

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
    
    const clearStorage = async () => {
      await AsyncStorage.removeItem('hasLaunched');
    }
    clearStorage();
    checkFirstLaunch();
  }, []);

  return (
      <Stack.Navigator>
        {isFirstLaunch ? (
          <Stack.Screen
            name="welcomeScreen"
            options={{ headerShown: false }}
            component={WelcomeScreen} // Show the WelcomeScreen on first launch
          />
        ) : isLoggedIn ? (
          <Stack.Screen
            name="(tabs)/dashboard"
            options={{ headerShown: false }}
            children={() => <Dashboard onLogout={handleLogout} />} // Pass handleLogout to Dashboard
          />
        ) : (
          <Stack.Screen
            name="auth/AuthScreen"
            options={{ headerShown: false }}
            children={() => <AuthScreen onLogin={handleLogin} />} // Pass handleLogin to AuthScreen
          />
        )}
        <Stack.Screen
          name="auth/RegisterScreen" // Ensure the name matches the path
          options={{ headerShown: false }}
          component={RegisterScreen}
        />
      </Stack.Navigator>
  );
};

export default _layout;
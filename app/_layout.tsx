import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './(tabs)/dashboard';
import AuthScreen from './auth/AuthScreen';

interface User {
  id: string;
  name: string;
}

interface Auth {
  isLoggedIn: boolean;
  user?: User;
}

interface DashboardProps {
  user?: User;
  onLogout: () => void; // Added onLogout prop to Dashboard
}

interface AuthScreenProps {
  onLogin: () => void;
}

const Stack = createNativeStackNavigator();

const _layout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Manage login state

  const handleLogin = () => {
    setIsLoggedIn(true); // Update state to reflect logged-in status
    console.log('Login successful');
    // Add more login logic here if needed
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Update state to reflect logged-out status
    console.log('Logout successful');
    // Add more logout logic here if needed
  };

  return (
      <Stack.Navigator>
        {isLoggedIn ? (
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
      </Stack.Navigator>
  );
};

export default _layout;
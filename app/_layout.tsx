import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
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
import TargetWeightSelectionScreen from './targetWeightSelect'; // Import the TargetWeightSelectionScreen
import EditProfileScreen from './editProfile';
import ExpoCamera from './(tabs)/scan'
import PlanMealScreen from './(tabs)/planMeal';
import { ExternalLink } from '@/components/ExternalLink';
import TrackWeightScreen from './(tabs)/trackWeight';
import MealDetailScreen from './(tabs)/mealDetail';
import RecipeDetailScreen from './(tabs)/RecipeDetailScreen'; // Import the new RecipeDetailScreen
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import SavedMealsScreen from './(tabs)/savedMeals';
const Stack = createNativeStackNavigator();

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#4CAF50',
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF'
      }}
      text2Style={{
        fontSize: 14,
        color: '#CCCCCC'
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#FF4444',
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF'
      }}
      text2Style={{
        fontSize: 14,
        color: '#CCCCCC'
      }}
    />
  ),
};

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
    <View style={{ flex: 1 }}>
      <Stack.Navigator>
        {isFirstLaunch && !isLoggedIn ? (
          <Stack.Screen
            name="welcomeScreen"
            options={{ headerShown: false }}
            children={({ navigation, route }) => (
              <WelcomeScreen navigation={navigation} route={route} onLogin={handleLogin} />
            )}
          />
        ) : !isFirstLaunch && !isLoggedIn ? (
          <Stack.Screen
            name="auth/AuthScreen"
            options={{ headerShown: false }}
            children={() => <AuthScreen onLogin={handleLogin} />}
          />
        ) : (
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
        <Stack.Screen name="goalsSelect" component={GoalSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="heightSelect" component={HeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="weightSelect" component={WeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="genderSelect" component={GenderSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="targetWeightSelect" component={TargetWeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="scan" component={ExpoCamera} options={{ headerShown: false }} />
        <Stack.Screen name="planMeal" component={PlanMealScreen} options={{ headerShown: false }} />
        <Stack.Screen name="trackWeight" component={TrackWeightScreen} options={{ headerShown: false }} />
        <Stack.Screen name="savedMeals" component={SavedMealsScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="mealDetail"
          component={MealDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RecipeDetailScreen"
          component={RecipeDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <Toast config={toastConfig} />
    </View>
  );
};

export default _layout;
// Import necessary React and React Native dependencies
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
// Navigation imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Local storage for persisting app state
import AsyncStorage from '@react-native-async-storage/async-storage';
// Firebase authentication and database
import { auth, db } from '../../shared/config/firebaseConfig';
import { User } from 'firebase/auth';
// Pages and screens imports
import Dashboard from '../../pages/dashboard/dashboard';
import AuthScreen from '../../pages/auth/AuthScreen';
import WelcomeScreen from '../../pages/welcome/welcomeScreen';
import RegisterScreen from '../../pages/auth/RegisterScreen';
// User profile and onboarding screens
import GenderSelectionScreen from '../../entities/user/ui/genderSelect';
import GoalSelectionScreen from '../../entities/user/ui/goalsSelect';
import HeightSelectionScreen from '../../entities/user/ui/heightSelect';
import WeightSelectionScreen from '../../entities/user/ui/weightSelect';
import TargetWeightSelectionScreen from '../../entities/user/ui/targetWeightSelect';
import EditProfileScreen from '../../entities/user/ui/editProfile';
// Feature screens
import ScanScreen from '../../pages/inventory/scan';
import PlanMealScreen from '../../pages/meals/planMeal';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import TrackWeightScreen from '../../pages/weight-tracking/trackWeight';
import MealDetailScreen from '../../pages/meals/mealDetail';
import RecipeDetailScreen from '../../pages/recipes/RecipeDetailScreen';
import AllRecipesScreen from '../../pages/recipes/allRecipes';
// Toast notification components
import Toast, { BaseToast, ErrorToast, BaseToastProps } from 'react-native-toast-message';
import SavedMealsScreen from '../../pages/meals/savedMeals';

// Create a stack navigator for managing screen navigation
const Stack = createNativeStackNavigator();

// Custom toast notification configuration for consistent UI/UX
const toastConfig = {
  // Success toast configuration with custom styling
  success: (props: BaseToastProps) => (
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
  // Error toast configuration with custom styling
  error: (props: BaseToastProps) => (
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

/**
 * Main application layout component responsible for:
 * 1. Managing authentication state
 * 2. Handling first-time app launch
 * 3. Providing navigation structure
 * 4. Routing to the appropriate screens based on user state
 */
const AppLayout = () => {
  // State to track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // State to check if this is the first time launching the app
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  // Handler for successful login events
  const handleLogin = () => {
    setIsLoggedIn(true);
    console.log('Login successful');
  };

  // Handler for logout events
  const handleLogout = () => {
    setIsLoggedIn(false);
    console.log('Logout successful');
  };

  // Effect to check first launch status and authentication state on component mount
  useEffect(() => {
    // Function to check if this is the first time launching the app
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        // If hasLaunched is null, this is the first launch
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        // App has been launched before
        setIsFirstLaunch(false);
      }
    };

    // Function to check if user is logged in
    const checkLoginState = async () => {
      // Check for stored user token in AsyncStorage
      const storedUser = await AsyncStorage.getItem('userToken');
  
      // Set up Firebase auth state listener
      const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
        if (user || storedUser) {
          // User is logged in via Firebase or has a stored token
          setIsLoggedIn(true);
        } else {
          // User is not logged in
          setIsLoggedIn(false);
        }
      });
  
      // Cleanup function to remove the auth state listener when component unmounts
      return () => unsubscribe();
    };
   
    // Execute the checks
    checkFirstLaunch();
    checkLoginState();
  }, []);

  // Render navigation structure and screen hierarchy
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator>
        {/* Conditional rendering based on first launch and login state:
            1. Show welcome screen for first-time users who aren't logged in
            2. Show auth screen for returning users who aren't logged in
            3. Show dashboard for logged-in users */}
        {isFirstLaunch && !isLoggedIn ? (
          <Stack.Screen
            name="WelcomeScreen"
            options={{ headerShown: false }}
            children={({ navigation, route }) => (
              <WelcomeScreen navigation={navigation} route={route} onLogin={handleLogin} />
            )}
          />
        ) : !isFirstLaunch && !isLoggedIn ? (
          <Stack.Screen
            name="AuthScreen"
            options={{ headerShown: false }}
            children={() => <AuthScreen onLogin={handleLogin} />}
          />
        ) : (
          <Stack.Screen
            name="Dashboard"
            options={{ headerShown: false }}
            children={() => <Dashboard onLogout={handleLogout} />}
          />
        )}
        {/* Registration screen */}
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ headerShown: false }} />
        {/* User onboarding and profile setup screens */}
        <Stack.Screen name="goalsSelect" component={GoalSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="heightSelect" component={HeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="weightSelect" component={WeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="genderSelect" component={GenderSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="targetWeightSelect" component={TargetWeightSelectionScreen} options={{ headerShown: false }} />
        {/* Feature screens */}
        <Stack.Screen name="scan" component={ScanScreen} options={{ headerShown: false }} />
        <Stack.Screen name="planMeal" component={PlanMealScreen} options={{ headerShown: false }} />
        <Stack.Screen name="trackWeight" component={TrackWeightScreen} options={{ headerShown: false }} />
        <Stack.Screen name="savedMeals" component={SavedMealsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="mealDetail" component={MealDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RecipeDetailScreen" component={RecipeDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="allRecipes" component={AllRecipesScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      {/* Global toast notification component */}
      <Toast config={toastConfig} />
    </View>
  );
};

// Export the AppLayout component as the default export
export default AppLayout;
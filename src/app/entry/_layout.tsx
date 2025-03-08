import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../shared/config/firebaseConfig';
import { User } from 'firebase/auth';
import Dashboard from '../../pages/dashboard/dashboard';
import AuthScreen from '../../pages/auth/AuthScreen';
import WelcomeScreen from '../../pages/welcome/welcomeScreen';
import RegisterScreen from '../../pages/auth/RegisterScreen';
import GenderSelectionScreen from '../../entities/user/ui/genderSelect';
import GoalSelectionScreen from '../../entities/user/ui/goalsSelect';
import HeightSelectionScreen from '../../entities/user/ui/heightSelect';
import WeightSelectionScreen from '../../entities/user/ui/weightSelect';
import TargetWeightSelectionScreen from '../../entities/user/ui/targetWeightSelect';
import EditProfileScreen from '../../entities/user/ui/editProfile';
import ScanScreen from '../../pages/inventory/scan';
import PlanMealScreen from '../../pages/meals/planMeal';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import TrackWeightScreen from '../../pages/weight-tracking/trackWeight';
import MealDetailScreen from '../../pages/meals/mealDetail';
import RecipeDetailScreen from '../../pages/recipes/RecipeDetailScreen';
import AllRecipesScreen from '../../pages/recipes/allRecipes';
import Toast, { BaseToast, ErrorToast, BaseToastProps } from 'react-native-toast-message';
import SavedMealsScreen from '../../pages/meals/savedMeals';
const Stack = createNativeStackNavigator();

const toastConfig = {
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

const AppLayout = () => {
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
  
      const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
        if (user || storedUser) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      });
  
      return () => unsubscribe(); // Cleanup the listener when component unmounts
    };
   
    checkFirstLaunch();
    checkLoginState();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator>
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
        <Stack.Screen
          name="RegisterScreen"
          options={{ headerShown: false }}
          component={RegisterScreen}
        />
        <Stack.Screen name="goalsSelect" component={GoalSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="heightSelect" component={HeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="weightSelect" component={WeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="genderSelect" component={GenderSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="targetWeightSelect" component={TargetWeightSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="scan" component={ScanScreen} options={{ headerShown: false }} />
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
        <Stack.Screen
          name="allRecipes"
          component={AllRecipesScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <Toast config={toastConfig} />
    </View>
  );
};

export default AppLayout;
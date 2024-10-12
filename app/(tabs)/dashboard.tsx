import React, { useState, useEffect } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GoalsScreen from './goals';
import InventoryScreen from './inventory';
import RecipesScreen from './recipes';
import ScanScreen from './scan';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';
import { Text, TouchableOpacity, ImageBackground } from 'react-native';

const auth = getAuth();
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
  const user = auth.currentUser;
  
  const [mealsConsumed, setMealsConsumed] = useState(5);
  const [calories, setCalories] = useState(1200);
  const [waterDrank, setWaterDrank] = useState(2.5);
  const [proteins, setProteins] = useState(300);
  
  useEffect(() => {
    if (user) {
      console.log('User is logged in:', {
        uid: user.uid,
        email: user.email,
      });
    } else {
      console.log('No user is logged in.');
    }
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAddMeal = () => {
    Alert.alert('Add Meal', 'Functionality to add a meal will be implemented.');
  };

  const handleTrackWater = () => {
    Alert.alert('Track Water', 'Functionality to track water intake will be implemented.');
  };

  const handleViewGoals = () => {
    Alert.alert('View Goals', 'Functionality to view goals will be implemented.');
  };

  const handleSeeRecipes = () => {
    Alert.alert('See Recipes', 'Functionality to view recipes will be implemented.');
  };

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
        tabBarStyle: {backgroundColor: 'rgba(34, 36, 40, 1)'}
      })}
    >
      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>
        {() => (
          <StyledView className="flex-1">
            <StyledImageBackground
              source={{ uri: 'https://img.freepik.com/free-vector/gradient-particle-wave-background_23-2150517309.jpg' }}
              className="flex-1 justify-center items-center bg-[#141e30]"
              blurRadius={20}
            >
              <StyledScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-5 top-10">
                {/* Header Section */}
                <StyledView className="flex-row justify-between items-center mb-5">
                  <StyledText className="text-3xl font-bold text-[#f0eaff]">Welcome, {user?.email || 'User'}!</StyledText>
                  <StyledTouchableOpacity onPress={handleLogout} className="bg-red-500 rounded-full px-4 py-2">
                    <StyledText className="text-white">Logout</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>

                {/* Motivational Quote Section */}
                <StyledView className="my-5 p-4 bg-white/10 rounded-lg shadow-lg shadow-black/30">
                  <StyledText className="text-xl font-semibold text-[#f0eaff]">“Да си оближеш пръстите.”</StyledText>
                  <StyledText className="text-gray-300">- Божидар Димов</StyledText>
                </StyledView>

                {/* User Statistics Section */}
                <StyledView className="bg-white/10 p-5 rounded-lg shadow-lg shadow-black/30">
                  <StyledText className="text-lg font-bold text-[#f0eaff]">Your Statistics</StyledText>
                  <StyledView className="flex-row justify-between mt-3">
                    <StyledText className="text-gray-300">Meals Consumed: {mealsConsumed}</StyledText>
                    <StyledText className="text-gray-300">Calories: {calories} kcal</StyledText>
                  </StyledView>
                  <StyledView className="flex-row justify-between mt-2">
                    <StyledText className="text-gray-300">Water Drank: {waterDrank}L</StyledText>
                    <StyledText className="text-gray-300">Proteins: {proteins}g</StyledText>
                  </StyledView>

                  {/* Additional Statistics */}
                  <StyledView className="mt-5">
                    <StyledText className="text-lg font-bold text-[#f0eaff]">Additional Insights</StyledText>
                    <StyledView className="flex-row justify-between mt-3">
                      <StyledView className="bg-white/20 p-3 rounded-lg flex-1 mr-2">
                        <StyledText className="text-center text-gray-300">Carbs: 150g</StyledText>
                      </StyledView>
                      <StyledView className="bg-white/20 p-3 rounded-lg flex-1 ml-2">
                        <StyledText className="text-center text-gray-300">Fats: 50g</StyledText>
                      </StyledView>
                    </StyledView>
                  </StyledView>
                </StyledView>

                {/* Action Buttons Section */}
                <StyledView className="mt-5">
                  <StyledText className="text-lg font-bold text-[#f0eaff]">Actions</StyledText>
                  <StyledView className="flex-row justify-between mt-3">
                    <StyledTouchableOpacity onPress={handleAddMeal} className="bg-[#1e90ff] p-4 rounded-lg flex-1 mr-2">
                      <StyledText className="text-white text-center">Add Meal</StyledText>
                    </StyledTouchableOpacity>
                    <StyledTouchableOpacity onPress={handleTrackWater} className="bg-[#1e90ff] p-4 rounded-lg flex-1 ml-2">
                      <StyledText className="text-white text-center">Track Water</StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>
                  <StyledView className="flex-row justify-between mt-2">
                    <StyledTouchableOpacity onPress={handleViewGoals} className="bg-[#1e90ff] p-4 rounded-lg flex-1 mr-2">
                      <StyledText className="text-white text-center">View Goals</StyledText>
                    </StyledTouchableOpacity>
                    <StyledTouchableOpacity onPress={handleSeeRecipes} className="bg-[#1e90ff] p-4 rounded-lg flex-1 ml-2">
                      <StyledText className="text-white text-center">See Recipes</StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>
                </StyledView>

                {/* Footer Section */}
                <StyledView className="mt-5 p-4 bg-white/10 rounded-lg shadow-lg shadow-black/30">
                  <StyledText className="text-center text-gray-300">© 2024 Tasty App. All rights reserved.</StyledText>
                </StyledView>
              </StyledScrollView>
            </StyledImageBackground>
          </StyledView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Goals" component={GoalsScreen} options={{headerShown: false}} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{headerShown: false}} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{headerShown: false}} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{headerShown: false}} />
    </Tab.Navigator>
  );
};

export default DashboardScreen;
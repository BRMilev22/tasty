import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Ensure you have this package installed
import DashboardContent from './two'
import GoalsScreen from './goals'
import InventoryScreen from './inventory';
import RecipesScreen from './recipes';
import DashboardScreen from './dashboard';
import GoalSelectionScreen from '../goalsSelect';

const IndexScreen = () => {
  // Create a bottom tab navigator
  const Tab = createBottomTabNavigator();

  // Dashboard content
  


  // Goals screen content

  // Inventory screen content
  // Recipes screen content

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
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1e90ff',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Recipes" component={RecipesScreen} />
      </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
});

export default IndexScreen;
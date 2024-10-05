import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { PieChart } from 'react-native-chart-kit';
import GoalsScreen from './goals';
import InventoryScreen from './inventory';
import RecipesScreen from './recipes';
import ScanScreen from './scan';
import { auth } from '../../firebaseConfig';

const Tab = createBottomTabNavigator();

interface DashboardProps {
  onLogout: () => void; 
}

const DashboardScreen: React.FC<DashboardProps> = ({ onLogout }) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isRecentActivitiesOpen, setIsRecentActivitiesOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut(); 
      onLogout(); 
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleSummary = () => {
    setIsSummaryOpen(prev => !prev);
  };

  const toggleRecentActivities = () => {
    setIsRecentActivitiesOpen(prev => !prev);
  };

  const data = [
    {
      name: 'Protein',
      population: 300,
      color: '#FF6384',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
    {
      name: 'Carbohydrates',
      population: 400,
      color: '#36A2EB',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
    {
      name: 'Fats',
      population: 100,
      color: '#FFCE56',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
  ];

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
      })}
    >
      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>
        {() => (
          <ScrollView contentContainerStyle={styles.container}>
            {/* Dashboard Title */}
            <Text style={styles.header}>Dashboard</Text>

            <View style={styles.pieChartContainer}>
              <Text style={styles.chartTitle}>Nutritional Breakdown</Text>
              <PieChart
                data={data}
                width={320}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#ffffff',
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </View>

            {/* New Features Section */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresContainer}>
              <View style={styles.featureBox}>
                <Text style={styles.featureTitle}>Meals Consumed</Text>
                <Text style={styles.featureValue}>5</Text>
              </View>
              <View style={styles.featureBox}>
                <Text style={styles.featureTitle}>Liters of Water Drank</Text>
                <Text style={styles.featureValue}>2.5L</Text>
              </View>
              <View style={styles.featureBox}>
                <Text style={styles.featureTitle}>Calories Eaten</Text>
                <Text style={styles.featureValue}>1200 kcal</Text>
              </View>
            </ScrollView>

            <TouchableOpacity onPress={toggleSummary} style={styles.summaryButton}>
              <Text style={styles.buttonText}>Summary</Text>
            </TouchableOpacity>
            {isSummaryOpen && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>Your Summary Content Here</Text>
              </View>
            )}

            <TouchableOpacity onPress={toggleRecentActivities} style={styles.activitiesButton}>
              <Text style={styles.buttonText}>Recent Activities</Text>
            </TouchableOpacity>
            {isRecentActivitiesOpen && (
              <View style={styles.activitiesContainer}>
                <Text style={styles.activitiesText}>Your Recent Activities Here</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e90ff',
    marginTop: 30, // Added margin to push the text below the dynamic island
    marginBottom: 20, // Optional: Adds some space below the header
  },
  pieChartContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  featuresContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  featureBox: {
    width: 200, // Adjust the width of the feature boxes as needed
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  featureValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  summaryButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 8,
    paddingVertical: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  activitiesButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 8,
    paddingVertical: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  summaryText: {
    color: '#333',
  },
  activitiesContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  activitiesText: {
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    borderRadius: 8,
    paddingVertical: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
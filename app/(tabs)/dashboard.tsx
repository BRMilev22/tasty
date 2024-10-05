// DashboardScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { auth } from '../../firebaseConfig';

interface DashboardProps {
  onLogout: () => void; // Ensure onLogout is defined here
}

const DashboardScreen: React.FC<DashboardProps> = ({ onLogout }) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isRecentActivitiesOpen, setIsRecentActivitiesOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      onLogout(); // Call onLogout prop to update the app state
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
    <ScrollView contentContainerStyle={styles.container}>
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
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
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
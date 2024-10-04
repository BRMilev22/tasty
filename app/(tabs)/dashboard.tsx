import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit'; // Make sure to install this package

const DashboardScreen = () => {
  const router = useRouter();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isRecentActivitiesOpen, setIsRecentActivitiesOpen] = useState(false);

  const handleLogout = () => {
    router.replace('/auth/AuthScreen');
  };

  const toggleSummary = () => {
    setIsSummaryOpen(!isSummaryOpen);
  };

  const toggleRecentActivities = () => {
    setIsRecentActivitiesOpen(!isRecentActivitiesOpen);
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
          width={320} // Set the width of the pie chart
          height={220} // Set the height of the pie chart
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute // Show absolute values
        />
        <View style={styles.legendContainer}>
          {data.map((item) => (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.toggleButton} onPress={toggleSummary}>
        <Text style={styles.toggleButtonText}>Today's Summary</Text>
        <MaterialIcons name={isSummaryOpen ? "expand-less" : "expand-more"} size={24} color="#000" />
      </TouchableOpacity>
      {isSummaryOpen && (
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>Keep track of your daily intake and goals.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.toggleButton} onPress={toggleRecentActivities}>
        <Text style={styles.toggleButtonText}>Recent Activities</Text>
        <MaterialIcons name={isRecentActivitiesOpen ? "expand-less" : "expand-more"} size={24} color="#000" />
      </TouchableOpacity>
      {isRecentActivitiesOpen && (
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>Added Chicken Breast to Inventory</Text>
          <Text style={styles.sectionDescription}>Logged Breakfast: Oatmeal</Text>
        </View>
      )}

      <TouchableOpacity style={styles.addMealButton}>
        <Text style={styles.addMealButtonText}>Add New Meal</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#eef2f3',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  legendColorBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  section: {
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  addMealButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  addMealButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
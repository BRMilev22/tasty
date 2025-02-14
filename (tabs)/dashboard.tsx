import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Табло за управление</Text>
        </View>

        {/* Секция за дневен прогрес */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Дневен прогрес</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Калории</Text>
              <Text style={styles.progressValue}>1200/2000</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Протеини</Text>
              <Text style={styles.progressValue}>45g/80g</Text>
            </View>
          </View>
        </View>

        {/* Секция за последни дейности */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Последни дейности</Text>
          <View style={styles.activitiesList}>
            <Text style={styles.activityItem}>• Закуска: Овесени ядки - 300 кал</Text>
            <Text style={styles.activityItem}>• Обяд: Салата с риба - 450 кал</Text>
          </View>
        </View>

        {/* Бутон за изход */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Изход</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    color: '#666',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  activitiesList: {
    marginTop: 10,
  },
  activityItem: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Dashboard;
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, deleteDoc, doc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NutritionCardProps {
  stats: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFats: number;
  };
  meals: Array<{
    id: string;
    name: string;
    calories: number;
    timestamp: any;
  }>;
}

const NutritionCard = ({ stats, meals }: NutritionCardProps) => {
  const auth = getAuth();
  const db = getFirestore();

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Грешка при изтриване на храненето');
    }
  };

  const renderMeal = ({ item }: { item: any }) => (
    <View style={styles.mealItem}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealCalories}>{item.calories} kcal</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteMeal(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  const renderProgressBar = (current: number, target: number, color: string) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Дневен прием</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Калории</Text>
          <Text style={styles.statValue}>{stats.calories} / {stats.targetCalories}</Text>
          {renderProgressBar(stats.calories, stats.targetCalories, '#FF9800')}
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Протеини</Text>
          <Text style={styles.statValue}>{stats.protein}g / {stats.targetProtein}g</Text>
          {renderProgressBar(stats.protein, stats.targetProtein, '#4CAF50')}
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Въглехидрати</Text>
          <Text style={styles.statValue}>{stats.carbs}g / {stats.targetCarbs}g</Text>
          {renderProgressBar(stats.carbs, stats.targetCarbs, '#2196F3')}
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Мазнини</Text>
          <Text style={styles.statValue}>{stats.fats}g / {stats.targetFats}g</Text>
          {renderProgressBar(stats.fats, stats.targetFats, '#F44336')}
        </View>
      </View>

      {/* Today's meals list */}
      <View style={styles.mealsContainer}>
        <Text style={styles.mealsTitle}>Днешни хранения</Text>
        <FlatList
          data={meals}
          renderItem={renderMeal}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Няма записани хранения за днес</Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsContainer: {
    gap: 15,
  },
  statItem: {
    width: '100%',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  mealsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  mealsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  mealCalories: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});

export default NutritionCard; 
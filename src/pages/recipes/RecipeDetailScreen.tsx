import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PieChart } from 'react-native-chart-kit';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';

const RecipeDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { recipe } = route.params as { recipe: any };
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<any[]>(recipe.ingredients || []);
  const [instructions, setInstructions] = useState<string[]>(recipe.fullRecipe || []);
  const [nutritionalInfo, setNutritionalInfo] = useState<any>(recipe.nutritionalInfo || {});
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (recipe) {
      setIngredients(recipe.ingredients || []);
      setInstructions(recipe.fullRecipe || []);
      setNutritionalInfo(recipe.nutritionalInfo || {});
    }
    setLoading(false);
  }, [recipe]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const data = [
    {
      name: 'Протеини',
      population: nutritionalInfo.protein || 0,
      color: '#FFB800',
      legendFontColor: '#fff',
      legendFontSize: 15,
    },
    {
      name: 'Въглехидрати',
      population: nutritionalInfo.carbs || 0,
      color: '#00C49F',
      legendFontColor: '#fff',
      legendFontSize: 15,
    },
    {
      name: 'Мазнини',
      population: nutritionalInfo.fat || 0,
      color: '#FF8042',
      legendFontColor: '#fff',
      legendFontSize: 15,
    },
  ];

  const handleAddMeal = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const mealData = {
        name: recipe.title,
        calories: nutritionalInfo.calories || 0,
        protein: nutritionalInfo.protein || 0,
        carbs: nutritionalInfo.carbs || 0,
        fats: nutritionalInfo.fat || 0,
        timestamp: serverTimestamp(),
        type: 'recipe',
      };

      await addDoc(collection(db, 'users', user.uid, 'meals'), mealData);
      showMessage({
        message: 'Рецептата беше добавена успешно!',
        type: 'success',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error adding meal:', error);
      showMessage({
        message: 'Грешка при добавяне на рецептата',
        type: 'danger',
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <Text style={styles.title}>{recipe.title}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-down" size={24} color="#ff4444" />
          <Text style={styles.actionButtonText}>Блокирай</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-up" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Харесай</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.actionButtonText}>Запази</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddMeal}>
          <Ionicons name="calendar" size={24} color="#FFA500" />
          <Text style={styles.actionButtonText}>Добави</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Още</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeInfo}>
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={24} color="#ffffff" />
          <Text style={styles.timeText}>5 мин. подготовка</Text>
        </View>
        <View style={styles.timeItem}>
          <Ionicons name="flame-outline" size={24} color="#ffffff" />
          <Text style={styles.timeText}>15 мин. готвене</Text>
        </View>
      </View>

      <View style={styles.nutritionContainer}>
        <Text style={styles.calories}>{nutritionalInfo.calories} калории</Text>
        <Text style={styles.sectionTitle}>Хранителна информация</Text>
        <PieChart
          data={data}
          width={300}
          height={200}
          chartConfig={{
            backgroundColor: '#000',
            backgroundGradientFrom: '#000',
            backgroundGradientTo: '#000',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>Съставки</Text>
        {ingredients.length > 0 ? (
          ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredientText}>
              • {ingredient.name} - {ingredient.amount}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Няма налични съставки.</Text>
        )}
      </View>

      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Начин на приготвяне</Text>
        {instructions.length > 0 ? (
          instructions.map((instruction, index) => (
            <Text key={index} style={styles.instructionText}>{instruction}</Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Няма налични инструкции.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    marginTop: 5,
    fontSize: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#ffffff',
    marginLeft: 8,
  },
  nutritionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  calories: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  ingredientText: {
    color: '#fff',
    fontSize: 16,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  noDataText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default RecipeDetailScreen; 
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';

interface Ingredient {
  name: string;
  measure: string;
  image: string;
}

const translations = {
  block: 'Блокирай',
  like: 'Харесай',
  save: 'Запази',
  add: 'Добави',
  more: 'Още',
  prepTime: 'минути подготовка',
  cookTime: 'минути готвене',
  amountToEat: 'Количество за хапване',
  serving: 'порция',
  calories: 'Калории',
  ingredients: 'Съставки',
  ingredientsFor: 'за количество за хапване от',
  servings: 'порции',
  directions: 'Начин на приготвяне',
  directionsFor: 'за оригинална рецепта от 1 порция',
  addSuccess: 'Ястието беше добавено успешно',
  addError: 'Грешка при добавяне на ястието',
  carbs: 'Въглехидрати',
  fat: 'Мазнини',
  protein: 'Протеин'
};

const MealDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { meal } = route.params as { meal: any };
  const [servings, setServings] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(meal.name)}`
        );
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
          const mealDetails = data.meals[0];
          
          // Extract ingredients and measures
          const ingredientsList: Ingredient[] = [];
          for (let i = 1; i <= 20; i++) {
            const ingredient = mealDetails[`strIngredient${i}`];
            const measure = mealDetails[`strMeasure${i}`];
            
            if (ingredient && measure) {
              ingredientsList.push({
                name: ingredient,
                measure: measure,
                image: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ingredient)}-Small.png`
              });
            }
          }
          setIngredients(ingredientsList);
          
          // Just set the instructions as a single string
          setInstructions([mealDetails.strInstructions]);
        }
      } catch (error) {
        console.error('Error fetching meal details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealDetails();
  }, [meal.name]);

  const handleAddMeal = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const mealData = {
        name: meal.name,
        calories: meal.calories * servings,
        protein: (meal.protein || 0) * servings,
        carbs: (meal.carbs || 0) * servings,
        fats: (meal.fats || 0) * servings,
        timestamp: serverTimestamp(),
        type: meal.category || 'основно',
        image: meal.image,
      };

      await addDoc(collection(db, 'users', user.uid, 'meals'), mealData);
      showMessage({
        message: translations.addSuccess,
        type: 'success',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error adding meal:', error);
      showMessage({
        message: translations.addError,
        type: 'danger',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <Text style={styles.title}>{meal.name}</Text>
      
      <Image source={{ uri: meal.image }} style={styles.mealImage} />
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-down" size={24} color="#ff4444" />
          <Text style={styles.actionButtonText}>{translations.block}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-up" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>{translations.like}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.actionButtonText}>{translations.save}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddMeal}>
          <Ionicons name="calendar" size={24} color="#FFA500" />
          <Text style={styles.actionButtonText}>{translations.add}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>{translations.more}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeInfo}>
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={24} color="#ffffff" />
          <Text style={styles.timeText}>5 {translations.prepTime}</Text>
        </View>
        <View style={styles.timeItem}>
          <Ionicons name="flame-outline" size={24} color="#ffffff" />
          <Text style={styles.timeText}>15 {translations.cookTime}</Text>
        </View>
      </View>

      <View style={styles.servingSection}>
        <Text style={styles.sectionTitle}>{translations.amountToEat}</Text>
        <View style={styles.servingControls}>
          <TouchableOpacity 
            onPress={() => setServings(Math.max(1, servings - 1))}
            style={styles.servingButton}
          >
            <Text style={styles.servingButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.servingCount}>{servings}</Text>
          <TouchableOpacity 
            onPress={() => setServings(servings + 1)}
            style={styles.servingButton}
          >
            <Text style={styles.servingButtonText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.servingText}>{translations.serving}</Text>
        </View>
      </View>

      <View style={styles.nutritionInfo}>
        <Text style={styles.calories}>{meal.calories * servings}</Text>
        <Text style={styles.caloriesLabel}>{translations.calories}</Text>
        <Text style={styles.macros}>
          {meal.carbs * servings}г {translations.carbs}, {meal.fats * servings}г {translations.fat}, {meal.protein * servings}г {translations.protein}
        </Text>
      </View>

      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>{translations.ingredients}</Text>
        <Text style={styles.sectionSubtitle}>
          {translations.ingredientsFor} {servings} {servings === 1 ? translations.serving : translations.servings}
        </Text>
        {meal.ingredients && meal.ingredients.map((ingredient: any, index: number) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <Text style={styles.ingredientMeasure}>{ingredient.measure}</Text>
          </View>
        ))}
      </View>

      <View style={styles.directionsSection}>
        <Text style={styles.sectionTitle}>{translations.directions}</Text>
        <Text style={styles.sectionSubtitle}>{translations.directionsFor}</Text>
        <Text style={styles.instructions}>{meal.instructions}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 40,
    marginHorizontal: 20,
  },
  mealImage: {
    width: '100%',
    height: 300,
    marginTop: 20,
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
  servingSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingButtonText: {
    color: '#ffffff',
    fontSize: 24,
  },
  servingCount: {
    color: '#ffffff',
    fontSize: 24,
    marginHorizontal: 20,
  },
  servingText: {
    color: '#999',
    marginLeft: 10,
  },
  nutritionInfo: {
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  calories: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  caloriesLabel: {
    color: '#999',
    fontSize: 16,
  },
  macros: {
    color: '#ffffff',
    marginTop: 10,
  },
  ingredientsSection: {
    padding: 20,
  },
  sectionSubtitle: {
    color: '#999',
    marginBottom: 15,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  ingredientName: {
    color: '#ffffff',
    fontSize: 16,
  },
  ingredientMeasure: {
    color: '#999',
    fontSize: 16,
  },
  directionsSection: {
    padding: 20,
  },
  instructions: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default MealDetailScreen; 
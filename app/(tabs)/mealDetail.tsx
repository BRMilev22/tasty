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
        message: 'Ястието беше добавено успешно',
        type: 'success',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error adding meal:', error);
      showMessage({
        message: 'Грешка при добавяне на ястието',
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
      
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-down" size={24} color="#FF6B6B" />
          <Text style={styles.actionText}>Block</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="thumbs-up" size={24} color="#4CAF50" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleAddMeal}>
          <Ionicons name="calendar" size={24} color="#FF9800" />
          <Text style={styles.actionText}>Add</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          <Text style={styles.actionText}>More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeInfo}>
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={24} color="#999" />
          <Text style={styles.timeText}>5 minutes to prep</Text>
        </View>
        <View style={styles.timeItem}>
          <Ionicons name="flame-outline" size={24} color="#999" />
          <Text style={styles.timeText}>15 minutes to cook</Text>
        </View>
      </View>

      <View style={styles.servingControl}>
        <Text style={styles.servingLabel}>Amount to eat</Text>
        <View style={styles.servingAdjust}>
          <TouchableOpacity 
            style={styles.servingButton}
            onPress={() => setServings(Math.max(1, servings - 1))}
          >
            <Ionicons name="remove" size={24} color="#FF6B6B" />
          </TouchableOpacity>
          <Text style={styles.servingCount}>{servings}</Text>
          <TouchableOpacity 
            style={styles.servingButton}
            onPress={() => setServings(servings + 1)}
          >
            <Ionicons name="add" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.servingUnit}>serving</Text>
        </View>
      </View>

      <View style={styles.nutritionInfo}>
        <View style={styles.macroCircle}>
          <Text style={styles.macroValue}>{meal.calories * servings}</Text>
          <Text style={styles.macroLabel}>Calories</Text>
        </View>
        <View style={styles.macroDetails}>
          <Text style={styles.macroText}>
            {meal.carbs * servings}g Carbs, {meal.fats * servings}g Fat, {meal.protein * servings}g Protein
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ingredients</Text>
      <Text style={styles.sectionSubtitle}>for amount to eat of {servings} serving</Text>
      
      <View style={styles.ingredientsList}>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Image 
              source={{ uri: ingredient.image }} 
              style={styles.ingredientImage}
            />
            <View style={styles.ingredientInfo}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientMeasure}>{ingredient.measure}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Directions</Text>
      <Text style={styles.sectionSubtitle}>for original recipe of 1 serving.</Text>
      
      <View style={styles.directionsList}>
        <Text style={styles.directionsText}>{instructions[0]}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#999',
    marginLeft: 10,
  },
  servingControl: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  servingLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  servingAdjust: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingButton: {
    padding: 10,
  },
  servingCount: {
    color: '#fff',
    fontSize: 20,
    marginHorizontal: 20,
  },
  servingUnit: {
    color: '#999',
    marginLeft: 10,
  },
  nutritionInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  macroCircle: {
    alignItems: 'center',
    marginBottom: 10,
  },
  macroValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  macroLabel: {
    color: '#999',
  },
  macroDetails: {
    alignItems: 'center',
  },
  macroText: {
    color: '#fff',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#999',
    marginHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  ingredientsList: {
    padding: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ingredientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  ingredientMeasure: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  directionsList: {
    padding: 20,
    paddingTop: 10,
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default MealDetailScreen; 
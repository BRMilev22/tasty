import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';
import { PieChart } from 'react-native-chart-kit';

interface Ingredient {
  name: string;
  measure: string;
  image: string;
}

interface MealDetails {
  preparation_time: number;
  cooking_time: number;
  total_time: number;
  servings: number;
}

const translations = {
  block: 'Блокирай',
  like: 'Харесай',
  save: 'Запази',
  add: 'Добави',
  more: 'Още',
  prepTime: 'минути подготовка',
  cookTime: 'минути готвене',
  totalTime: 'общо време',
  servingsCount: 'порции',
  amountToEat: 'Количество за хапване',
  serving: 'порция',
  calories: 'Калории',
  ingredients: 'Съставки',
  ingredientsFor: 'за количество',
  servings: 'порции',
  directions: 'Начин на приготвяне',
  directionsFor: 'за рецепта от',
  addSuccess: 'Ястието беше добавено успешно',
  addError: 'Грешка при добавяне на ястието',
  carbs: 'Въглехидрати',
  fat: 'Мазнини',
  protein: 'Протеин'
};

const MealDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { meal: initialMeal } = route.params as { meal: any };
  
  // Инициализираме servings със стойността от рецептата
  const [meal, setMeal] = useState(initialMeal);
  const [servings, setServings] = useState(initialMeal.servings || 1);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch complete meal data from our API using the meal name
        const response = await fetch(`http://localhost:3000/recipes/name/${encodeURIComponent(initialMeal.name)}`);
        const data = await response.json();
        
        if (data.meal) {
          console.log('Complete meal data:', data.meal);
          setMeal({
            ...initialMeal,
            preparation_time: data.meal.preparation_time,
            cooking_time: data.meal.cooking_time,
            total_time: data.meal.total_time,
            servings: data.meal.servings
          });
        }

        // Extract ingredients and measures
        const ingredientsList: Ingredient[] = [];
        if (initialMeal.ingredients) {
          initialMeal.ingredients.forEach((ing: any) => {
            ingredientsList.push({
              name: ing.name,
              measure: ing.measure,
              image: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ing.name)}-Small.png`
            });
          });
        }
        setIngredients(ingredientsList);
        
        setInstructions([initialMeal.instructions]);
      } catch (error) {
        console.error('Error processing meal details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealDetails();
  }, [initialMeal]);

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

  const getPieChartData = () => {
    const protein = meal.protein * servings;
    const carbs = meal.carbs * servings;
    const fats = meal.fats * servings;
    
    return [
      {
        name: translations.protein,
        value: protein,
        color: '#FF6B6B',
        legendFontColor: '#ffffff',
        legendFontSize: 14,
      },
      {
        name: translations.carbs,
        value: carbs,
        color: '#4ECDC4',
        legendFontColor: '#ffffff',
        legendFontSize: 14,
      },
      {
        name: translations.fat,
        value: fats,
        color: '#FFE66D',
        legendFontColor: '#ffffff',
        legendFontSize: 14,
      },
    ];
  };

  // Актуализираме текста за порциите
  const servingsText = `${translations.ingredientsFor} ${meal.servings} ${translations.servings}`;
  const directionsText = `${translations.directionsFor} ${meal.servings} ${translations.servings}`;

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

      <View style={styles.timeInfoContainer}>
        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <View style={styles.timeIconContainer}>
              <Ionicons name="time-outline" size={18} color="#4CAF50" />
            </View>
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeValue}>
                {typeof meal.preparation_time === 'number' ? meal.preparation_time : 0}
              </Text>
              <Text style={styles.timeLabel}>{translations.prepTime}</Text>
            </View>
          </View>
          
          <View style={styles.timeBox}>
            <View style={styles.timeIconContainer}>
              <Ionicons name="flame-outline" size={18} color="#FF6B6B" />
            </View>
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeValue}>
                {typeof meal.cooking_time === 'number' ? meal.cooking_time : 0}
              </Text>
              <Text style={styles.timeLabel}>{translations.cookTime}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <View style={styles.timeIconContainer}>
              <Ionicons name="hourglass-outline" size={18} color="#FFD700" />
            </View>
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeValue}>
                {typeof meal.total_time === 'number' ? meal.total_time : 0}
              </Text>
              <Text style={styles.timeLabel}>{translations.totalTime}</Text>
            </View>
          </View>
          
          <View style={styles.timeBox}>
            <View style={styles.timeIconContainer}>
              <Ionicons name="people-outline" size={18} color="#4ECDC4" />
            </View>
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeValue}>
                {typeof meal.servings === 'number' ? meal.servings : 0}
              </Text>
              <Text style={styles.timeLabel}>{translations.servingsCount}</Text>
            </View>
          </View>
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
        
        <View style={styles.chartContainer}>
          <PieChart
            data={getPieChartData()}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      </View>

      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>{translations.ingredients}</Text>
        <Text style={styles.subTitle}>{servingsText}</Text>
        {meal.ingredients && meal.ingredients.map((ingredient: any, index: number) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <Text style={styles.ingredientMeasure}>{ingredient.measure}</Text>
          </View>
        ))}
      </View>

      <View style={styles.directionsSection}>
        <Text style={styles.sectionTitle}>{translations.directions}</Text>
        <Text style={styles.subTitle}>{directionsText}</Text>
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
  timeInfoContainer: {
    marginVertical: 15,
    marginHorizontal: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
  },
  timeIconContainer: {
    backgroundColor: '#333333',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeLabel: {
    color: '#888888',
    fontSize: 11,
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
  chartContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  ingredientsSection: {
    padding: 20,
  },
  subTitle: {
    color: '#888888',
    fontSize: 14,
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
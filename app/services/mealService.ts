import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal } from '../data/predefinedMeals';

const FAVORITES_STORAGE_KEY = 'favorite_meals';

interface MealDBResponse {
  meals: {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strCategory: string;
  }[];
}

// Estimated average nutritional values by category
const nutritionEstimates: { [key: string]: { calories: number; protein: number; carbs: number; fats: number } } = {
  Breakfast: { calories: 350, protein: 15, carbs: 45, fats: 12 },
  Starter: { calories: 200, protein: 8, carbs: 20, fats: 10 },
  Side: { calories: 150, protein: 5, carbs: 25, fats: 5 },
  Dessert: { calories: 300, protein: 5, carbs: 45, fats: 12 },
  Vegetarian: { calories: 400, protein: 15, carbs: 55, fats: 15 },
  Seafood: { calories: 350, protein: 35, carbs: 10, fats: 18 },
  Beef: { calories: 450, protein: 40, carbs: 8, fats: 25 },
  Chicken: { calories: 350, protein: 35, carbs: 5, fats: 15 },
  Pasta: { calories: 450, protein: 15, carbs: 65, fats: 12 },
  Pork: { calories: 400, protein: 35, carbs: 5, fats: 25 },
  Lamb: { calories: 420, protein: 38, carbs: 5, fats: 25 },
  Goat: { calories: 380, protein: 35, carbs: 5, fats: 20 },
  Miscellaneous: { calories: 350, protein: 20, carbs: 35, fats: 15 },
};

export const fetchRandomMeals = async (number: number = 50): Promise<Meal[]> => {
  try {
    const meals: Meal[] = [];
    const categories = ['Breakfast', 'Starter', 'Side', 'Dessert', 'Vegetarian', 'Seafood', 
                       'Beef', 'Chicken', 'Pasta', 'Pork', 'Lamb', 'Goat', 'Miscellaneous'];
    
    // Fetch meals from different categories to ensure variety
    for (const category of categories) {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
      );
      
      if (!response.ok) {
        console.error('API Response not OK for category:', category);
        continue;
      }

      const data: MealDBResponse = await response.json();
      
      if (!data.meals) continue;

      // Take random meals from each category
      const categoryMeals = data.meals
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.ceil(number / categories.length))
        .map(meal => {
          const nutrition = nutritionEstimates[category];
          return {
            id: meal.idMeal,
            name: meal.strMeal,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fats: nutrition.fats,
            image: meal.strMealThumb,
            category: mapCategory(category),
          };
        });

      meals.push(...categoryMeals);
    }

    // Shuffle the final array
    return meals.sort(() => Math.random() - 0.5);

  } catch (error) {
    console.error('Error fetching meals:', error);
    return fallbackMeals;
  }
};

const mapCategory = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'breakfast':
      return 'закуска';
    case 'starter':
    case 'side':
      return 'снакс';
    case 'dessert':
      return 'десерт';
    case 'vegetarian':
    case 'salad':
      return 'салата';
    default:
      return 'основно';
  }
};

// Keep the fallback meals as backup
const fallbackMeals: Meal[] = [
  {
    id: '1',
    name: 'Овесена каша с плодове',
    calories: 307,
    protein: 13,
    carbs: 55,
    fats: 5,
    category: 'закуска',
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?ixlib=rb-4.0.3',
  },
  {
    id: '2',
    name: 'Пилешки гърди на скара',
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    category: 'основно',
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?ixlib=rb-4.0.3',
  },
  {
    id: '3',
    name: 'Гръцка салата',
    calories: 230,
    protein: 7,
    carbs: 13,
    fats: 18,
    category: 'салата',
    image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3',
  },
  // Add more fallback meals here...
];

export const getFavoriteMeals = async (): Promise<string[]> => {
  try {
    const storedFavorites = await AsyncStorage.getItem('favoriteMeals');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const toggleFavorite = async (mealId: string): Promise<string[]> => {
  try {
    const currentFavorites = await getFavoriteMeals();
    const newFavorites = currentFavorites.includes(mealId)
      ? currentFavorites.filter(id => id !== mealId)
      : [...currentFavorites, mealId];
    
    await AsyncStorage.setItem('favoriteMeals', JSON.stringify(newFavorites));
    return newFavorites;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw new Error('Failed to toggle favorite');
  }
};

export const isMealFavorite = async (mealId: string): Promise<boolean> => {
  try {
    const favorites = await getFavoriteMeals();
    return favorites.includes(mealId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}; 
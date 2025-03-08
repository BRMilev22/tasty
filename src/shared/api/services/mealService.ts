import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal } from '../../../entities/meal/data/predefinedMeals';

// Update to use your actual local IP address
const API_URL = `http://${process.env.EXPO_PUBLIC_IPADDRESS}:3000`;
const FAVORITES_STORAGE_KEY = 'favorite_meals';

interface DBMeal {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  image: string;
  youtube_link: string;
  source: string;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  [key: string]: any; // For dynamic ingredient and measure fields
}

// Estimated calories by category
const categoryCalories: { [key: string]: { calories: number; protein: number; carbs: number; fats: number } } = {
  'Вегетариански': { calories: 400, protein: 15, carbs: 55, fats: 15 },
  'Десерт': { calories: 300, protein: 5, carbs: 45, fats: 12 },
  'Основно ястие': { calories: 450, protein: 35, carbs: 30, fats: 20 },
  'Салата': { calories: 200, protein: 8, carbs: 20, fats: 10 },
  'Супа': { calories: 250, protein: 12, carbs: 25, fats: 8 },
  'Предястие': { calories: 200, protein: 8, carbs: 20, fats: 10 },
  'Тестени': { calories: 450, protein: 15, carbs: 65, fats: 12 },
  'Морски дарове': { calories: 350, protein: 35, carbs: 10, fats: 18 },
  'Свинско месо': { calories: 400, protein: 35, carbs: 5, fats: 25 },
  'Пилешко месо': { calories: 350, protein: 35, carbs: 5, fats: 15 },
  'Телешко месо': { calories: 450, protein: 40, carbs: 8, fats: 25 },
};

// Update the category mapping
const mapCategory = (category: string): string => {
  // Map database categories to app categories
  const categoryMap: { [key: string]: string } = {
    // Breakfast items
    'Вегетариански': 'закуска',
    'Закуска': 'закуска',
    'Закуски': 'закуска',
    'Тестени изделия': 'закуска',
    'Печива': 'закуска',
    'Баници': 'закуска',
    'Сандвичи': 'закуска',
    
    // Snacks and desserts
    'Десерт': 'снакс',
    'Десерти': 'снакс',
    'Снакс': 'снакс',
    'Снаксове': 'снакс',
    'Напитки': 'снакс',
    'Сладкиши': 'снакс',
    
    // Lunch/Dinner items
    'Основно': 'обяд',
    'Основни ястия': 'обяд',
    'Супа': 'обяд',
    'Супи': 'обяд',
    'Тестени': 'обяд',
    'Морски дарове': 'обяд',
    'Свинско': 'обяд',
    'Пилешко': 'обяд',
    'Телешко': 'обяд',
    'Риба': 'обяд',
    'Ястие': 'обяд',
    'Зимнина': 'обяд',
    'Солени торти': 'обяд',
    
    // Salads can be for any meal
    'Салата': 'закуска',
    'Салати': 'закуска',
    'Предястие': 'закуска'
  };

  // Log the category for debugging
  const mappedCategory = categoryMap[category] || 'обяд';
  console.log('Mapping category:', category, 'to:', mappedCategory);
  
  return mappedCategory;
};

export const fetchRandomMeals = async (number: number = 50): Promise<Meal[]> => {
  try {
    const url = `${API_URL}/recipes/random`;
    const response = await fetch(url);
    const data = await response.json();

    // Log raw data from API
    if (data.meals?.length > 0) {
      console.log('Raw API response meal:', {
        name: data.meals[0].name,
        kcal: data.meals[0].kcal,
        protein: data.meals[0].protein,
        carbs: data.meals[0].carbs,
        fat: data.meals[0].fat
      });
    }

    return data.meals.map((meal: DBMeal) => {
      const mappedCategory = mapCategory(meal.category);

      // Get all ingredients and measures
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`ingredient${i}`];
        const measure = meal[`measure${i}`];
        if (ingredient && ingredient.trim() !== '' && measure && measure.trim() !== '') {
          ingredients.push({
            name: ingredient,
            measure: measure
          });
        }
      }

      // Handle the image URL
      let imageUrl = meal.thumbnail;
      if (imageUrl) {
        imageUrl = imageUrl.startsWith('@') ? imageUrl.substring(1) : imageUrl;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `https://${imageUrl}`;
        }
      } else {
        imageUrl = 'https://www.themealdb.com/images/media/meals/default.jpg';
      }

      // Parse numeric values from the database
      const calories = parseFloat(meal.kcal?.toString() || '0');
      const protein = parseFloat(meal.protein?.toString() || '0');
      const carbs = parseFloat(meal.carbs?.toString() || '0');
      const fats = parseFloat(meal.fat?.toString() || '0');

      return {
        id: meal.id,
        name: meal.name,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fats: fats,
        image: imageUrl,
        category: mappedCategory,
        area: meal.area,
        instructions: meal.instructions,
        ingredients: ingredients,
        youtube_link: meal.youtube_link,
        source: meal.source,
        mealType: mappedCategory
      };
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return fallbackMeals;
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
    category: 'Закуска',
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?ixlib=rb-4.0.3',
  },
  {
    id: '2',
    name: 'Пилешки гърди на скара',
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    category: 'Основно ястие',
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?ixlib=rb-4.0.3',
  },
  {
    id: '3',
    name: 'Гръцка салата',
    calories: 230,
    protein: 7,
    carbs: 13,
    fats: 18,
    category: 'Салата',
    image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3',
  },
];

export const getFavoriteMeals = async (): Promise<string[]> => {
  try {
    const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
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
    
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
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
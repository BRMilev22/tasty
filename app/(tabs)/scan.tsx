import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import type { StackNavigationProp } from '@react-navigation/stack';
import { processReceiptItems } from '../../services/receiptProcessingService';

const auth = getAuth();
const user = auth.currentUser;

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Update PhotoType to use the imported type
interface PhotoType extends CameraCapturedPicture {
  uri: string;
}

interface FoodRecognitionResult {
  image_id: string;
  recognition_results: any[];
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

// Add a translation function for food items
const translateToBulgarian = (foodName: string): string => {
  // Common food translations
  const translations: Record<string, string> = {
    // Meats
    'beef': 'говеждо месо',
    'chicken': 'пилешко месо',
    'pork': 'свинско месо',
    'fish': 'риба',
    'turkey': 'пуешко месо',
    'lamb': 'агнешко месо',
    'meat': 'месо',
    
    // Vegetables
    'potato': 'картоф',
    'tomato': 'домат',
    'cucumber': 'краставица',
    'carrot': 'морков',
    'lettuce': 'маруля',
    'onion': 'лук',
    'garlic': 'чесън',
    'pepper': 'чушка',
    'broccoli': 'броколи',
    'cabbage': 'зеле',
    'salad': 'салата',
    'vegetable': 'зеленчук',
    
    // Fruits
    'apple': 'ябълка',
    'banana': 'банан',
    'orange': 'портокал',
    'grape': 'грозде',
    'strawberry': 'ягода',
    'berry': 'ягода',
    'watermelon': 'диня',
    'melon': 'пъпеш',
    'fruit': 'плод',
    
    // Dairy
    'milk': 'мляко',
    'cheese': 'сирене',
    'yogurt': 'кисело мляко',
    'butter': 'масло',
    'cream': 'сметана',
    
    // Grains
    'bread': 'хляб',
    'rice': 'ориз',
    'pasta': 'паста',
    'noodle': 'спагети',
    'cereal': 'зърнена закуска',
    
    // Fast food
    'pizza': 'пица',
    'burger': 'бургер',
    'hamburger': 'хамбургер',
    'sandwich': 'сандвич',
    'french fries': 'пържени картофи',
    'fries': 'пържени картофи',
    'hot dog': 'хот-дог',
    
    // Desserts
    'cake': 'торта',
    'cookie': 'бисквита',
    'ice cream': 'сладолед',
    'chocolate': 'шоколад',
    'dessert': 'десерт',
    
    // Beverages
    'coffee': 'кафе',
    'tea': 'чай',
    'juice': 'сок',
    'water': 'вода',
    'soda': 'газирана напитка',
    'beer': 'бира',
    'wine': 'вино',
    
    // Other
    'soup': 'супа',
    'stew': 'яхния',
    'egg': 'яйце',
    'breakfast': 'закуска',
    'lunch': 'обяд',
    'dinner': 'вечеря',
    'snack': 'закуска',
    'meal': 'ястие',
    'food': 'храна'
  };
  
  // Try to find a direct translation
  if (translations[foodName.toLowerCase()]) {
    return translations[foodName.toLowerCase()];
  }
  
  // Try to find partial matches
  for (const [eng, bg] of Object.entries(translations)) {
    if (foodName.toLowerCase().includes(eng)) {
      return bg;
    }
  }
  
  // Return original if no translation found
  return foodName;
};

// Function to enhance generic food descriptions
const enhanceFoodDescription = (foodName: string): string => {
  // Map of generic food categories to more specific descriptions
  const enhancements: Record<string, string[]> = {
    'meat': ['Печено говеждо', 'Пилешко филе', 'Свинска пържола', 'Телешки кюфтета', 'Агнешко месо'],
    'vegetable': ['Зеленчукова салата', 'Печени зеленчуци', 'Задушени зеленчуци', 'Зеленчуково рагу'],
    'fruit': ['Плодова салата', 'Пресни плодове', 'Плодово асорти'],
    'egg': ['Омлет', 'Варени яйца', 'Яйца на очи', 'Бъркани яйца'],
    'bread': ['Пълнозърнест хляб', 'Френски багет', 'Домашен хляб'],
    'rice': ['Бял ориз', 'Кафяв ориз', 'Ориз с зеленчуци'],
    'pasta': ['Спагети', 'Паста с доматен сос', 'Макарони със сирене'],
    'fish': ['Печена риба', 'Риба на скара', 'Рибена чорба'],
    'salad': ['Зелена салата', 'Салата с домати и краставици', 'Шопска салата', 'Овчарска салата'],
    'soup': ['Супа топчета', 'Зеленчукова супа', 'Таратор', 'Боб чорба'],
    'dessert': ['Шоколадова торта', 'Плодов сладкиш', 'Баклава', 'Крем карамел']
  };
  
  // Check if the food name is a generic category
  const lowerCaseName = foodName.toLowerCase();
  for (const [category, specifics] of Object.entries(enhancements)) {
    if (lowerCaseName.includes(category)) {
      // Return a random specific food from the category
      return specifics[Math.floor(Math.random() * specifics.length)];
    }
  }
  
  // If not a generic category, return the original name
  return foodName;
};

// Update the function to fetch nutritional data from the Edamam API
const fetchNutritionalData = async (foodName: string) => {
  try {
    // Simplify the food name for better API recognition
    const simplifiedName = simplifyFoodName(foodName);
    console.log(`Original food name: ${foodName}, Simplified: ${simplifiedName}`);
    
    // Use the Edamam Nutrition API
    const appId = 'a49d3916';
    const appKey = 'fac9a7d31556543174aabcd5772ca58a';
    
    console.log(`Fetching nutrition data for: ${simplifiedName}`);
    
    // Make the API request to Edamam with the simplified name
    const response = await fetch(
      `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(simplifiedName)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Edamam API response:', data);
    
    // Check if we got valid nutrition data
    if (data && data.calories > 0) {
      // Extract the relevant nutritional information
      return {
        energy: data.calories || 0,
        proteins: data.totalNutrients?.PROCNT?.quantity || 0,
        carbohydrates: data.totalNutrients?.CHOCDF?.quantity || 0,
        fat: data.totalNutrients?.FAT?.quantity || 0
      };
    }
    
    // If the API didn't return valid data, try with an even simpler term
    if (simplifiedName.includes(' ')) {
      const evenSimplerName = simplifiedName.split(' ')[0];
      console.log(`Trying with even simpler term: ${evenSimplerName}`);
      
      const retryResponse = await fetch(
        `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(evenSimplerName)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        console.log('Edamam API retry response:', retryData);
        
        if (retryData && retryData.calories > 0) {
          return {
            energy: retryData.calories || 0,
            proteins: retryData.totalNutrients?.PROCNT?.quantity || 0,
            carbohydrates: retryData.totalNutrients?.CHOCDF?.quantity || 0,
            fat: retryData.totalNutrients?.FAT?.quantity || 0
          };
        }
      }
    }
    
    // If the API still didn't return valid data, fall back to our predefined values
    console.log('API returned no data, using fallback values');
    return getFallbackNutritionData(foodName);
  } catch (error) {
    console.error('Error fetching nutritional data from API:', error);
    // Fall back to our predefined values if the API call fails
    return getFallbackNutritionData(foodName);
  }
};

// Separate function for fallback nutrition data
const getFallbackNutritionData = (foodName: string) => {
  const foodType = foodName.toLowerCase();
  let nutritionData = {
    energy: 200,
    proteins: 10,
    carbohydrates: 20,
    fat: 10
  };
  
  // More detailed nutrition estimates based on food categories
  if (foodType.includes('beef') || foodType.includes('говеждо')) {
    nutritionData = { energy: 250, proteins: 26, carbohydrates: 0, fat: 17 };
  } else if (foodType.includes('chicken') || foodType.includes('пилешко')) {
    nutritionData = { energy: 165, proteins: 31, carbohydrates: 0, fat: 3.6 };
  } else if (foodType.includes('pork') || foodType.includes('свинско')) {
    nutritionData = { energy: 242, proteins: 24, carbohydrates: 0, fat: 16 };
  } else if (foodType.includes('fish') || foodType.includes('риба')) {
    nutritionData = { energy: 206, proteins: 22, carbohydrates: 0, fat: 12 };
  } else if (foodType.includes('egg') || foodType.includes('яйц')) {
    nutritionData = { energy: 155, proteins: 13, carbohydrates: 1.1, fat: 11 };
  } else if (foodType.includes('potato') || foodType.includes('картоф')) {
    nutritionData = { energy: 86, proteins: 1.8, carbohydrates: 20, fat: 0.1 };
  } else if (foodType.includes('rice') || foodType.includes('ориз')) {
    nutritionData = { energy: 130, proteins: 2.7, carbohydrates: 28, fat: 0.3 };
  } else if (foodType.includes('pasta') || foodType.includes('спагети') || foodType.includes('макарони')) {
    nutritionData = { energy: 158, proteins: 5.8, carbohydrates: 31, fat: 0.9 };
  } else if (foodType.includes('bread') || foodType.includes('хляб')) {
    nutritionData = { energy: 265, proteins: 9, carbohydrates: 49, fat: 3.2 };
  } else if (foodType.includes('salad') || foodType.includes('салата')) {
    nutritionData = { energy: 33, proteins: 1.2, carbohydrates: 6.5, fat: 0.4 };
  } else if (foodType.includes('vegetable') || foodType.includes('зеленчук')) {
    nutritionData = { energy: 65, proteins: 2.5, carbohydrates: 13, fat: 0.3 };
  } else if (foodType.includes('fruit') || foodType.includes('плод')) {
    nutritionData = { energy: 72, proteins: 0.7, carbohydrates: 19, fat: 0.2 };
  } else if (foodType.includes('burger') || foodType.includes('бургер')) {
    nutritionData = { energy: 295, proteins: 17, carbohydrates: 30, fat: 14 };
  } else if (foodType.includes('pizza') || foodType.includes('пица')) {
    nutritionData = { energy: 266, proteins: 11, carbohydrates: 33, fat: 10 };
  } else if (foodType.includes('soup') || foodType.includes('супа')) {
    nutritionData = { energy: 75, proteins: 4, carbohydrates: 9, fat: 2.5 };
  }
  
  return nutritionData;
};

// Add a function to simplify food names for better API recognition
const simplifyFoodName = (foodName: string): string => {
  // List of basic food terms to extract
  const basicFoods = [
    'rice', 'pasta', 'bread', 'potato', 'chicken', 'beef', 'pork', 'fish',
    'egg', 'milk', 'cheese', 'yogurt', 'apple', 'banana', 'orange', 'tomato',
    'carrot', 'lettuce', 'cucumber', 'onion', 'garlic', 'broccoli', 'spinach',
    'burger', 'pizza', 'sandwich', 'salad', 'soup', 'steak', 'cake', 'cookie',
    'chocolate', 'ice cream', 'coffee', 'tea', 'juice', 'water', 'soda', 'beer',
    'wine', 'meat', 'vegetable', 'fruit', 'cereal', 'oatmeal', 'pancake', 'waffle',
    'donut', 'muffin', 'bagel', 'toast', 'butter', 'oil', 'sugar', 'salt', 'pepper',
    'sauce', 'ketchup', 'mustard', 'mayonnaise', 'dressing', 'vinegar', 'lemon',
    'lime', 'avocado', 'bean', 'corn', 'pea', 'nut', 'almond', 'walnut', 'peanut',
    'cashew', 'honey', 'jam', 'jelly', 'syrup', 'bacon', 'sausage', 'ham', 'turkey',
    'lamb', 'shrimp', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'squid',
    'octopus', 'tuna', 'salmon', 'cod', 'tilapia', 'trout', 'sardine', 'anchovy',
    'mackerel', 'herring', 'caviar', 'roe', 'tofu', 'tempeh', 'seitan', 'quinoa',
    'couscous', 'bulgur', 'barley', 'millet', 'rye', 'wheat', 'oat', 'corn', 'maize',
    'tortilla', 'taco', 'burrito', 'enchilada', 'quesadilla', 'nacho', 'guacamole',
    'salsa', 'hummus', 'falafel', 'pita', 'naan', 'curry', 'sushi', 'sashimi',
    'ramen', 'udon', 'soba', 'dumpling', 'wonton', 'spring roll', 'egg roll',
    'fried rice', 'lo mein', 'chow mein', 'pad thai', 'stir fry', 'kebab', 'gyro',
    'shawarma', 'baklava', 'halva', 'gelato', 'sorbet', 'pudding', 'custard',
    'mousse', 'trifle', 'tiramisu', 'cheesecake', 'pie', 'tart', 'croissant',
    'baguette', 'pretzel', 'cracker', 'chip', 'popcorn', 'granola', 'muesli'
  ];
  
  const lowerCaseName = foodName.toLowerCase();
  
  // Check if the food name contains any of the basic foods
  for (const basicFood of basicFoods) {
    if (lowerCaseName.includes(basicFood)) {
      return basicFood;
    }
  }
  
  // If no basic food is found, return the original name
  // But limit to first two words to keep it simple
  const words = lowerCaseName.split(' ');
  if (words.length > 2) {
    return words.slice(0, 2).join(' ');
  }
  
  return lowerCaseName;
};

// Define the navigation param list type
type RootStackParamList = {
  dashboard: undefined;
  scan: undefined;
  planMeal: undefined;
  // Add other screens as needed
};

// Use the typed navigation
type NavigationProp = StackNavigationProp<RootStackParamList>;

const ScanScreen = () => {
  // Camera and scanning states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isFoodMode, setIsFoodMode] = useState(false);
  const [isReceiptMode, setIsReceiptMode] = useState(false);
  
  // Receipt processing states
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [isShowingReceiptDetails, setIsShowingReceiptDetails] = useState(false);
  
  // Food recognition states
  const [foodRecognitionResult, setFoodRecognitionResult] = useState<FoodRecognitionResult | null>(null);
  const [nutritionalInfo, setNutritionalInfo] = useState<any>(null);
  
  // Product details states
  const [productTitle, setProductTitle] = useState('');
  const [barcode, setBarcode] = useState('');

  // Refs and navigation
  const cameraRef = useRef(null);
  const navigation = useNavigation<NavigationProp>();

  // Add your LogMeal API key
  const LOGMEAL_API_KEY = '1b625018f71fb1bb6be4a666f68f4cdf44db9cad';

  // Visibility logic
  const showProductDetails = scanned && barcode && !isFoodMode && !isReceiptMode;
  const showFoodDetails = isFoodMode && foodRecognitionResult && !isReceiptMode;
  const showReceiptDetails = isReceiptMode && isShowingReceiptDetails && receiptItems.length > 0;

  // Request camera permissions when the component mounts
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Function to handle barcode scanning
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setBarcode(data);

    try {
      // First try to get product information from Open Food Facts API
      const openFoodFactsResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const openFoodFactsData = await openFoodFactsResponse.json();

      if (openFoodFactsData.status === 1 && openFoodFactsData.product) {
        // If product is found, use the product name from the Open Food Facts API
        const productName = openFoodFactsData.product.product_name || 'Няма име на продукта';
        setProductTitle(productName);

        // Extracting nutritional information if available
        const productNutritionalInfo = {
          energy: openFoodFactsData.product.nutriments?.['energy-kcal'] || 0,
          fat: openFoodFactsData.product.nutriments?.fat || 0,
          carbohydrates: openFoodFactsData.product.nutriments?.carbohydrates || 0,
          proteins: openFoodFactsData.product.nutriments?.proteins || 0,
        };
        setNutritionalInfo(productNutritionalInfo);
      } else {
        // If not found, fall back to the current logic
        const titleResponse = await fetch(
          `https://barcode.bg/barcode/BG/%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%B1%D0%B0%D1%80%D0%BA%D0%BE%D0%B4.htm?barcode=${data}`
        );
        if (titleResponse.status === 404) {
          setProductTitle('Неразпознат продукт');
          // Set default nutritional info for unknown products
          setNutritionalInfo({
            energy: 0,
            fat: 0,
            carbohydrates: 0,
            proteins: 0,
          });
        } else {
          const titleText = await titleResponse.text();
          // Extract the actual product name from the response
          const titleMatch = titleText.match(/<title>(.*?)<\/title>/);
          let productName = titleMatch ? titleMatch[1].replace(' - Баркод.bg', '').trim() : 'Неразпознат продукт';
          
          // If the title is still the default one, set it to unknown product
          if (productName === 'Информация за баркод') {
            productName = 'Неразпознат продукт';
          }
          
          setProductTitle(productName);
          // Set default nutritional info for products without data
          setNutritionalInfo({
            energy: 0,
            fat: 0,
            carbohydrates: 0,
            proteins: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching product information:', error);
      setProductTitle('Грешка при търсене на продукта');
      setNutritionalInfo({
        energy: 0,
        fat: 0,
        carbohydrates: 0,
        proteins: 0,
      });
    }
  };

  // Update the handleAddToInventory function to handle undefined imageId
  const handleAddToInventory = async () => {
    if (!user) return;
    try {
      const foodId = `food_${Date.now()}`;
      const itemDocRef = doc(db, 'users', user.uid, 'inventory', foodId);
      
      // Get the food name and nutritional info
      let foodName = productTitle;
      let nutriments = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      if (isFoodMode && foodRecognitionResult?.recognition_results && foodRecognitionResult.recognition_results.length > 0) {
        const englishName = foodRecognitionResult.recognition_results[0]?.name || 'Unknown food';
        foodName = translateToBulgarian(englishName);
      }

      // Use the nutritional info from state if available
      if (nutritionalInfo) {
        nutriments = {
          calories: nutritionalInfo.energy || 0,
          protein: nutritionalInfo.proteins || 0,
          carbs: nutritionalInfo.carbohydrates || 0,
          fat: nutritionalInfo.fat || 0
        };
      }

      // Add to inventory with properly structured nutriment data
      await setDoc(itemDocRef, {
        name: foodName,
        quantity: 1,
        unit: 'бр',
        foodId: foodId,
        createdAt: new Date(),
        nutriments: nutriments
      });

      Alert.alert('Успешно', 'Продуктът е добавен в инвентара.');
      handleScanAgain();
    } catch (error) {
      console.error('Error adding to inventory:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето в инвентара.');
    }
  };

  const handleEatNow = async () => {
    if (!user) return;
    try {
      // Get the food name and nutritional info
      let foodName = productTitle;
      let nutriments = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      // If we're in food mode and have recognition results, use those
      if (isFoodMode && foodRecognitionResult?.recognition_results && foodRecognitionResult.recognition_results.length > 0) {
        const englishName = foodRecognitionResult.recognition_results[0]?.name || 'Unknown food';
        foodName = translateToBulgarian(englishName);
      }

      // Skip logging if the product is unrecognized or has an error
      if (foodName === 'Неразпознат продукт' || foodName === 'Грешка при търсене на продукта') {
        Alert.alert('Грешка', 'Не може да се добави неразпознат продукт.');
        return;
      }

      // Use the nutritional info from state if available
      if (nutritionalInfo) {
        nutriments = {
          calories: nutritionalInfo.energy || 0,
          protein: nutritionalInfo.proteins || 0,
          carbs: nutritionalInfo.carbohydrates || 0,
          fat: nutritionalInfo.fat || 0
        };
      }

      // Log the meal with proper data
      const mealLog = {
        name: foodName,
        quantity: 1,
        unit: 'бр',
        nutriments: nutriments,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'users', user.uid, 'meals'), mealLog);

      Alert.alert('Успешно', 'Храната е добавена към дневника');
      handleScanAgain();
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето на храната.');
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setBarcode('');
    setProductTitle('');
    setNutritionalInfo(null);
    setFoodRecognitionResult(null);
    setIsShowingReceiptDetails(false);
  };

  // Function to handle food recognition
  const handleFoodRecognition = async (photo: CameraCapturedPicture) => {
    try {
      setScanned(true); // Set scanned to true when taking a food photo
      
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Create form data for the API request
      const formData = new FormData();
      
      // Append the image file directly
      formData.append('image', {
        uri: manipulatedImage.uri,
        type: 'image/jpeg',
        name: 'food.jpg',
      } as any);

      try {
        // Make API request to LogMeal
        const logMealResponse = await fetch('https://api.logmeal.es/v2/image/recognition/complete/v1.0', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOGMEAL_API_KEY}`,
          },
          body: formData,
        });

        const result = await logMealResponse.json();
        console.log('Food recognition result:', result);
        
        // Check if there's an error in the API response
        if (result.code && result.message) {
          console.error('API Error:', result.message);
          
          // Create a mock result for demonstration purposes
          const mockResult = {
            image_id: Date.now().toString(),
            recognition_results: []
          };
          
          setFoodRecognitionResult(mockResult);
          
          // Show error message to user
          Alert.alert(
            'API Error',
            'There was an issue with the food recognition service. You can still manually enter food items.',
            [{ text: 'OK' }]
          );
          
          return;
        }
        
        // Create a standardized result structure
        const standardizedResult = {
          image_id: result.imageId || result.image_id || Date.now().toString(),
          recognition_results: result.recognition_results || []
        };
        
        setFoodRecognitionResult(standardizedResult);
        
        // Generate more accurate nutrition data based on recognized food
        if (standardizedResult.recognition_results && standardizedResult.recognition_results.length > 0) {
          const foodName = standardizedResult.recognition_results[0].name;
          // Use the English food name for better API results
          const nutritionData = await fetchNutritionalData(foodName);
          setNutritionalInfo(nutritionData);
        }
      } catch (apiError) {
        console.error('API request error:', apiError);
        
        // Create a mock result for demonstration purposes
        const mockResult = {
          image_id: Date.now().toString(),
          recognition_results: []
        };
        
        setFoodRecognitionResult(mockResult);
        
        Alert.alert(
          'Connection Error',
          'Could not connect to the food recognition service. You can still manually enter food items.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Error during food recognition:', error);
      Alert.alert('Грешка', 'Неуспешно разпознаване на храната.');
    }
  };

  // Helper function to create estimated nutrition data
  const createEstimatedNutrition = async (foodName: string) => {
    // Get more accurate nutrition data based on the food name
    const nutritionData = await fetchNutritionalData(foodName);
    setNutritionalInfo(nutritionData);
  };

  // Update the handleReceiptScanning function to use the new state
  const handleReceiptScanning = async (photo: CameraCapturedPicture) => {
    try {
      setIsProcessingReceipt(true);
      
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Create form data for the API request
      const formData = new FormData();
      formData.append('extractLineItems', 'true');
      formData.append('extractTime', 'false');
      formData.append('refresh', 'false');
      formData.append('incognito', 'false');
      
      // Append the image file
      formData.append('file', {
        uri: manipulatedImage.uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      // Make API request to Taggun
      const response = await fetch('https://api.taggun.io/api/receipt/v1/verbose/file', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          apikey: 'bb171440f48e11ef8629fb2558d8ff71'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const taggunData = await response.json();
      
      // Process the receipt data using our new service
      const processedReceipt = await processReceiptItems(taggunData);
      
      // Update state with processed items
      setReceiptItems([
        ...processedReceipt.foodItems.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          unit: item.unit || 'бр.'
        })),
        ...processedReceipt.beverages.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          unit: item.unit || 'бр.'
        }))
      ]);
      
      setIsShowingReceiptDetails(true);
      setScanned(true);
      setIsProcessingReceipt(false);
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Грешка', 'Възникна проблем при обработката на касовата бележка.');
      setIsProcessingReceipt(false);
    }
  };

  // Update the handleCameraCapture function to handle the correct photo type
  const handleCameraCapture = async () => {
    if (isFoodMode || isReceiptMode) {
      try {
        // Request camera permissions first
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Грешка', 'Нямате разрешение за използване на камерата.');
          return;
        }

        // Launch the camera
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          aspect: [4, 3],
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const photo: CameraCapturedPicture = {
            uri: result.assets[0].uri,
            width: result.assets[0].width || 1080,
            height: result.assets[0].height || 1920,
            base64: undefined,
          };
          
          if (isFoodMode) {
            await handleFoodRecognition(photo);
          } else if (isReceiptMode) {
            await handleReceiptScanning(photo);
          }
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Грешка', 'Неуспешно заснемане на снимка.');
      }
    }
  };

  // Update toggle button for switching between modes
  const toggleMode = () => {
    if (isFoodMode) {
      setIsFoodMode(false);
      setIsReceiptMode(true);
    } else if (isReceiptMode) {
      setIsReceiptMode(false);
      setIsFoodMode(false);
    } else {
      setIsFoodMode(true);
      setIsReceiptMode(false);
    }
    
    // Reset scan state
    setScanned(false);
    setBarcode('');
    setFoodRecognitionResult(null);
    setReceiptItems([]);
    setNutritionalInfo(null);
    setIsShowingReceiptDetails(false);
  };

  // Update the handleManualFoodEntry function
  const handleManualFoodEntry = () => {
    // Navigate to the planMeal screen
    navigation.navigate('planMeal');
    
    // Reset the scan state
    handleScanAgain();
  };

  // Add a function to go back to previous screen
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Add a function to add receipt item to inventory
  const handleAddReceiptItemToInventory = async (item: any) => {
    if (!user) return;
    try {
      const foodId = `food_${Date.now()}`;
      const itemDocRef = doc(db, 'users', user.uid, 'inventory', foodId);
      
      await setDoc(itemDocRef, {
        name: item.name,
        quantity: 1,
        unit: 'бр',
        foodId: foodId,
        createdAt: new Date(),
        nutriments: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      });

      Alert.alert('Успешно', `${item.name} е добавен в инвентара.`);
      
      // Remove the item from the list
      setReceiptItems(receiptItems.filter(i => i !== item));
      
      // If no more items, reset scan
      if (receiptItems.length <= 1) {
        handleScanAgain();
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето в инвентара.');
    }
  };

  // Add a function to add all receipt items to inventory
  const handleAddAllReceiptItems = async () => {
    if (!user || receiptItems.length === 0) return;
    
    try {
      // Show loading indicator or message
      Alert.alert('Добавяне', 'Добавяне на всички продукти в инвентара...');
      
      // Add each item to inventory
      for (const item of receiptItems) {
        const foodId = `food_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const itemDocRef = doc(db, 'users', user.uid, 'inventory', foodId);
        
        await setDoc(itemDocRef, {
          name: item.name,
          quantity: 1,
          unit: 'бр',
          foodId: foodId,
          createdAt: new Date(),
          nutriments: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }
        });
      }

      Alert.alert('Успешно', 'Всички продукти са добавени в инвентара.');
      handleScanAgain();
    } catch (error) {
      console.error('Error adding all items to inventory:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето на продуктите в инвентара.');
    }
  };

  const handleFoodSelection = (selectedFood: any) => {
    if (!foodRecognitionResult) return;
    
    // Update the recognition results to put the selected food first
    const updatedResults = [...foodRecognitionResult.recognition_results];
    const selectedIndex = updatedResults.findIndex(food => food.id === selectedFood.id);
    if (selectedIndex > -1) {
      const [selected] = updatedResults.splice(selectedIndex, 1);
      updatedResults.unshift(selected);
    }
    
    setFoodRecognitionResult({
      ...foodRecognitionResult,
      recognition_results: updatedResults
    });
    
    // Update nutritional info for the selected food
    createEstimatedNutrition(selectedFood.name);
  };

  if (hasPermission === null) {
    return <Text>Искане за позволение за използване на камерата...</Text>;
  }

  if (hasPermission === false) {
    return <Text>Липса на достъп до камерата</Text>;
  }

  return (
    <StyledView className="flex-1 bg-black items-center justify-center">
      <CameraView 
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={!isFoodMode && !isReceiptMode && !scanned ? handleBarcodeScanned : undefined}
        facing="back"
      />

      {/* Mode Switcher */}
      <StyledView 
        className="absolute top-12 w-[80%] z-10 flex-row justify-center"
        style={styles.modeSwitcher}
      >
        <StyledTouchableOpacity 
          onPress={() => {
            setIsFoodMode(false);
            setIsReceiptMode(false);
            handleScanAgain();
          }}
          style={[
            styles.modeButton,
            !isFoodMode && !isReceiptMode && styles.modeButtonActive,
            { borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }
          ]}
        >
          <Ionicons 
            name="barcode-outline" 
            size={24} 
            color={!isFoodMode && !isReceiptMode ? "#FFFFFF" : "#888888"} 
          />
          <StyledText 
            className={`text-xs mt-1 ${!isFoodMode && !isReceiptMode ? 'text-white' : 'text-gray-400'}`}
          >
            Баркод
          </StyledText>
        </StyledTouchableOpacity>

        <StyledTouchableOpacity 
          onPress={() => {
            setIsFoodMode(true);
            setIsReceiptMode(false);
            handleScanAgain();
          }}
          style={[
            styles.modeButton,
            isFoodMode && styles.modeButtonActive,
          ]}
        >
          <Ionicons 
            name="restaurant-outline" 
            size={24} 
            color={isFoodMode ? "#FFFFFF" : "#888888"} 
          />
          <StyledText 
            className={`text-xs mt-1 ${isFoodMode ? 'text-white' : 'text-gray-400'}`}
          >
            Храна
          </StyledText>
        </StyledTouchableOpacity>

        <StyledTouchableOpacity 
          onPress={() => {
            setIsFoodMode(false);
            setIsReceiptMode(true);
            handleScanAgain();
          }}
          style={[
            styles.modeButton,
            isReceiptMode && styles.modeButtonActive,
            { borderTopRightRadius: 20, borderBottomRightRadius: 20 }
          ]}
        >
          <Ionicons 
            name="receipt-outline" 
            size={24} 
            color={isReceiptMode ? "#FFFFFF" : "#888888"} 
          />
          <StyledText 
            className={`text-xs mt-1 ${isReceiptMode ? 'text-white' : 'text-gray-400'}`}
          >
            Касова
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      {/* Camera Button for Food and Receipt Mode */}
      {(isFoodMode || isReceiptMode) && !scanned && (
        <StyledTouchableOpacity 
          onPress={handleCameraCapture}
          className="absolute bottom-36"
          style={styles.captureButton}
        >
          <Ionicons name="camera-outline" size={36} color="white" />
        </StyledTouchableOpacity>
      )}

      {/* Loading indicator for receipt processing */}
      {isProcessingReceipt && (
        <StyledView className="absolute inset-0 bg-black bg-opacity-70 items-center justify-center">
          <StyledText className="text-white text-lg mb-4">Обработка на касовата бележка...</StyledText>
          {/* You could add a spinner here */}
        </StyledView>
      )}

      {/* Product Details Container - Only show for barcode mode */}
      {showProductDetails && (
        <StyledView className="absolute bottom-8 w-11/12 max-h-[60%]" style={styles.claymorphismCard}>
          <StyledText className="text-lg font-bold text-white text-center mb-3">Сканиран продукт</StyledText>
          <StyledText className="text-gray-400 text-center">Баркод: {barcode}</StyledText>
          <StyledText className="text-green-400 text-center font-bold">{productTitle || 'Непознато име'}</StyledText>

          {nutritionalInfo && (
            <StyledView className="mt-3" style={styles.nutritionContainer}>
              <StyledText className="text-white font-bold mb-2 text-center">Хранителна информация</StyledText>
              <StyledView className="flex-row justify-between">
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Калории</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.energy)} kcal</StyledText>
                </StyledView>
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Протеини</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.proteins)} g</StyledText>
                </StyledView>
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Въгл.</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.carbohydrates)} g</StyledText>
                </StyledView>
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Мазнини</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.fat)} g</StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          )}

          <StyledView className="flex-row justify-between mt-4">
            <StyledTouchableOpacity 
              onPress={handleAddToInventory} 
              style={styles.primaryButton}
            >
              <Ionicons name="archive-outline" size={20} color="white" />
              <StyledText className="text-white font-bold ml-2">Добави в инвентар</StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity 
              onPress={handleEatNow}
              style={styles.secondaryButton}
            >
              <Ionicons name="restaurant-outline" size={20} color="white" />
              <StyledText className="text-white font-bold ml-2">Изяж сега</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
          
          <StyledTouchableOpacity 
            onPress={handleScanAgain}
            style={styles.textButton}
          >
            <StyledText className="text-gray-400 font-bold">Сканирай отново</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      )}

      {/* Food Recognition Results - Only show for food mode */}
      {showFoodDetails && (
        <StyledView className="absolute bottom-8 w-11/12 max-h-[70%]" style={styles.claymorphismCard}>
          <StyledText className="text-lg font-bold text-white text-center mb-2">Идентифицирана храна</StyledText>
          
          {foodRecognitionResult?.recognition_results?.length > 0 ? (
            <StyledView className="w-full">
              <StyledText className="text-white text-center mb-2 text-sm">Изберете правилната храна:</StyledText>
              <StyledView style={styles.foodOptionsContainer}>
                {foodRecognitionResult.recognition_results.slice(0, 3).map((result: any, index: number) => {
                  // Translate the food name to Bulgarian
                  const englishName = result.name || 'Unknown food';
                  const bulgarianName = translateToBulgarian(englishName);
                  
                  return (
                    <StyledTouchableOpacity 
                      key={index} 
                      style={[
                        styles.foodOption, 
                        foodRecognitionResult.recognition_results[0].id === result.id && styles.selectedFoodOption
                      ]}
                      onPress={() => handleFoodSelection(result)}
                    >
                      <StyledText className="text-white text-center font-bold">
                        {bulgarianName}
                      </StyledText>
                      {result.name !== bulgarianName && (
                        <StyledText className="text-gray-500 text-center text-xs">
                          ({result.name})
                        </StyledText>
                      )}
                      {result.prob && (
                        <StyledText className="text-gray-400 text-center text-xs">
                          Сигурност: {Math.round(result.prob * 100)}%
                        </StyledText>
                      )}
                    </StyledTouchableOpacity>
                  );
                })}
              </StyledView>
              
        <StyledTouchableOpacity 
                style={styles.outlineButton}
                onPress={handleManualFoodEntry}
              >
                <StyledText className="text-blue-400 text-center text-sm">
                  Нито едно от горните ↑ (Ръчно въвеждане)
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>
          ) : (
            <StyledView className="w-full items-center">
              <StyledText className="text-yellow-400 text-center mb-3 text-sm">
                Не успяхме да разпознаем храната. Моля, опитайте отново с по-ясна снимка.
              </StyledText>
              <StyledTouchableOpacity 
                style={styles.outlineButton}
                onPress={handleManualFoodEntry}
              >
                <StyledText className="text-blue-400 font-bold text-sm">Ръчно въвеждане</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          )}
          
          {nutritionalInfo && (
            <StyledView className="mt-2" style={styles.nutritionContainer}>
              <StyledText className="text-white font-bold mb-1 text-center text-sm">Хранителна информация</StyledText>
              <StyledView className="flex-row justify-between">
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Калории</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.energy)}</StyledText>
                </StyledView>
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Протеини</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.proteins)}g</StyledText>
                </StyledView>
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Въгл.</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.carbohydrates)}g</StyledText>
                </StyledView>
                <StyledView style={styles.nutrientBubble}>
                  <StyledText className="text-gray-300 text-xs">Мазнини</StyledText>
                  <StyledText className="text-white font-bold">{Math.round(nutritionalInfo.fat)}g</StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          )}
          
          <StyledView className="flex-row justify-between mt-3">
            <StyledTouchableOpacity 
              onPress={handleAddToInventory} 
              style={styles.primaryButton}
            >
              <Ionicons name="archive-outline" size={18} color="white" />
              <StyledText className="text-white font-bold ml-1 text-sm">Добави</StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity 
              onPress={handleEatNow}
              style={styles.secondaryButton}
            >
              <Ionicons name="restaurant-outline" size={18} color="white" />
              <StyledText className="text-white font-bold ml-1 text-sm">Изяж</StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity 
              onPress={handleScanAgain}
              style={styles.cancelButton}
            >
              <Ionicons name="close-outline" size={18} color="white" />
              <StyledText className="text-white font-bold ml-1 text-sm">Откажи</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      )}

      {/* Receipt Scanning Results - Only show for receipt mode */}
      {showReceiptDetails && (
        <StyledView className="absolute bottom-0 w-full" style={styles.receiptContainer}>
          <StyledView className="px-4 py-3 bg-[#1C1C1E] rounded-t-3xl">
            <StyledText className="text-xl font-bold text-white text-center mb-2">
              Сканирана касова бележка
            </StyledText>
            <StyledText className="text-gray-400 text-center mb-3">
              Открити {receiptItems.length} продукта
            </StyledText>
            
            {/* Scrollable list container */}
            <StyledView style={styles.scrollContainer}>
              <ScrollView style={styles.itemsList}>
                {receiptItems.map((item, index) => (
                  <StyledView key={index} style={styles.receiptItem}>
                    <StyledView style={{flex: 1}}>
                      <StyledText className="text-white font-bold">{item.name}</StyledText>
                      <StyledText className="text-gray-400 text-xs">
                        Цена: {item.price} лв
                      </StyledText>
                    </StyledView>
                    <StyledTouchableOpacity 
                      onPress={() => handleAddReceiptItemToInventory(item)}
                      style={styles.addItemButton}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                    </StyledTouchableOpacity>
                  </StyledView>
                ))}
              </ScrollView>
            </StyledView>

            {/* Buttons container */}
            <StyledView className="flex-row justify-between mt-3 pb-6 px-2">
              <StyledTouchableOpacity 
                onPress={handleAddAllReceiptItems} 
                style={styles.primaryButton}
                className="flex-1 mr-2"
              >
                <Ionicons name="archive-outline" size={18} color="white" />
                <StyledText className="text-white font-bold ml-1 text-sm">Добави всички</StyledText>
              </StyledTouchableOpacity>
              
              <StyledTouchableOpacity 
                onPress={handleScanAgain}
                style={styles.cancelButton}
                className="flex-1 ml-2"
              >
                <Ionicons name="close-outline" size={18} color="white" />
                <StyledText className="text-white font-bold ml-1 text-sm">Откажи</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>
      )}
    </StyledView>
  );
};

// Update styles to make the UI more compact
const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
  iconButton: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  claymorphismCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  foodOptionsContainer: {
    maxHeight: 220,
  },
  nutritionContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nutrientBubble: {
    backgroundColor: 'rgba(60, 60, 60, 0.6)',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButton: {
    backgroundColor: 'rgba(80, 80, 80, 0.8)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  foodOption: {
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedFoodOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: 'rgba(76, 175, 80, 0.6)',
    borderWidth: 1,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  outlineButton: {
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    borderColor: 'rgba(33, 150, 243, 0.6)',
    borderWidth: 1,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  textButton: {
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  
  scrollContainer: {
    maxHeight: 400,
  },
  
  itemsList: {
    paddingHorizontal: 2,
  },
  
  receiptItem: {
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  addItemButton: {
    padding: 6,
  },
  modeSwitcher: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 20,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.6)',
  },
});

export default ScanScreen;
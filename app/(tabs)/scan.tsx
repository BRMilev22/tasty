import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';  // Import as type
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [nutritionalInfo, setNutritionalInfo] = useState<any>(null); // To store nutritional info
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFoodMode, setIsFoodMode] = useState(false);
  const [foodRecognitionResult, setFoodRecognitionResult] = useState<FoodRecognitionResult | null>(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Add your LogMeal API key
  //const LOGMEAL_API_KEY = '29c0703873dadf9f8b5adaa8004a04f1e8211843';
  const LOGMEAL_API_KEY = '1b625018f71fb1bb6be4a666f68f4cdf44db9cad';

  // Update camera ref type to use Camera
  const cameraRef = React.useRef(null);

  // Update the product details visibility logic
  const showProductDetails = scanned && barcode && !isFoodMode;
  const showFoodDetails = isFoodMode && foodRecognitionResult;

  // Get the navigation object with the correct type
  const navigation = useNavigation<NavigationProp>();

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
          energy: openFoodFactsData.product.nutriments?.['energy-kcal'] || 'Не е налично',
          fat: openFoodFactsData.product.nutriments?.fat || 'Не е налично',
          //fatValue: openFoodFactsData.product.nutriments?.fat_value || 'Не е налично',
          carbohydrates: openFoodFactsData.product.nutriments?.carbohydrates || 'Не е налично',
          proteins: openFoodFactsData.product.nutriments?.proteins || 'Не е налично',
          //proteinsValue: openFoodFactsData.product.nutriments?.proteins_value || 'Не е налично',
        };
        setNutritionalInfo(productNutritionalInfo); // Store the nutritional information
      } else {
        // If not found, fall back to the current logic
        const titleResponse = await fetch(
          `https://barcode.bg/barcode/BG/%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%B1%D0%B0%D1%80%D0%BA%D0%BE%D0%B4.htm?barcode=${data}`
        );
        if (titleResponse.status === 404) {
          setProductTitle('Името на продукта не бе намерено');
          setNutritionalInfo(null); // Clear nutritional info if not found
        } else {
          const htmlContent = await titleResponse.text();
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            setProductTitle(titleMatch[1]);
            setNutritionalInfo(null); // No nutritional info available in fallback
          } else {
            setProductTitle('Името на продукта не бе намерено');
            setNutritionalInfo(null); // Clear nutritional info if not found
          }
        }
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      //Alert.alert('Грешка', 'Данните за продукта не бяха извлечени.');
    }
  };

  // Update the handleAddToInventory function to handle undefined imageId
  const handleAddToInventory = async () => {
    if (!user) return;
    try {
      const foodId = `food_${Date.now()}`;
      const itemDocRef = doc(db, 'users', user.uid, 'inventory', foodId);
      
      // Get the food name and nutritional info
      let foodName = 'Неразпозната храна';
      let nutriments = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      if (isFoodMode && foodRecognitionResult?.recognition_results?.length > 0) {
        const englishName = foodRecognitionResult.recognition_results[0].name || 'Unknown food';
        foodName = translateToBulgarian(englishName);
        
        // Use the nutritional info from state
        if (nutritionalInfo) {
          nutriments = {
            calories: nutritionalInfo.energy || 0,
            protein: nutritionalInfo.proteins || 0,
            carbs: nutritionalInfo.carbohydrates || 0,
            fat: nutritionalInfo.fat || 0
          };
        }
      } else if (!isFoodMode && barcode && productTitle) {
        foodName = productTitle.replace(/ - Баркод: \d+$/, '') || 'Непознат продукт';
        
        // Use the nutritional info from state
        if (nutritionalInfo) {
          nutriments = {
            calories: nutritionalInfo.energy || 0,
            protein: nutritionalInfo.proteins || 0,
            carbs: nutritionalInfo.carbohydrates || 0,
            fat: nutritionalInfo.fat || 0
          };
        }
      }

      // Add to inventory with properly structured nutriment data
      await setDoc(itemDocRef, {
        name: foodName,
        quantity: 1,
        unit: 'бр',
        foodId: foodId,
        createdAt: new Date(),
        nutriments: nutriments // Make sure nutriments is properly structured
      });

      Alert.alert('Успешно', 'Продуктът е добавен в инвентара.');
      handleScanAgain();
    } catch (error) {
      console.error('Error adding to inventory:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето в инвентара.');
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setBarcode(null);
    setProductTitle(null);
    setNutritionalInfo(null);
    setFoodRecognitionResult(null);
    setIsConfirming(false);
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

  // Modify the camera capture function to use ImagePicker
  const handleCameraCapture = async () => {
    if (isFoodMode) {
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
          const photo = {
            uri: result.assets[0].uri,
            width: result.assets[0].width || 1080,
            height: result.assets[0].height || 1920,
            exif: null,
            base64: null
          };
          
          await handleFoodRecognition(photo);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Грешка', 'Неуспешно заснемане на снимка.');
      }
    }
  };

  // Add toggle button for switching between barcode and food mode
  const toggleMode = () => {
    setIsFoodMode(!isFoodMode);
    setScanned(false);
    setBarcode(null);
    setFoodRecognitionResult(null);
    setNutritionalInfo(null);
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

  // Add a function to log food as eaten
  const handleLogAsEaten = async () => {
    if (user) {
      try {
        let foodName = 'Неразпозната храна';
        let englishFoodName = 'Unknown food';
        let macros = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        };
        
        // Get food name and macros from recognition results
        if (isFoodMode && foodRecognitionResult?.recognition_results?.length > 0) {
          englishFoodName = foodRecognitionResult.recognition_results[0].name || 'Unknown food';
          const translatedName = translateToBulgarian(englishFoodName);
          
          // If the food name is too generic, enhance it with a more specific description
          if (['месо', 'зеленчук', 'плод', 'яйце', 'хляб', 'ориз', 'паста', 'риба', 'салата', 'супа', 'десерт'].includes(translatedName.toLowerCase())) {
            foodName = enhanceFoodDescription(translatedName);
          } else {
            foodName = translatedName;
          }
          
          if (nutritionalInfo) {
            macros = {
              calories: nutritionalInfo.energy || 0,
              protein: nutritionalInfo.proteins || 0,
              carbs: nutritionalInfo.carbohydrates || 0,
              fat: nutritionalInfo.fat || 0
            };
          } else {
            // Get nutrition data from the API using the English food name for better results
            const nutritionData = await fetchNutritionalData(englishFoodName);
            macros = {
              calories: nutritionData.energy || 0,
              protein: nutritionData.proteins || 0,
              carbs: nutritionData.carbohydrates || 0,
              fat: nutritionData.fat || 0
            };
            
            // Update the UI with the fetched nutrition data
            setNutritionalInfo(nutritionData);
          }
        } else if (!isFoodMode && barcode && productTitle) {
          foodName = productTitle.replace(/ - Баркод: \d+$/, '') || 'Непознат продукт';
          englishFoodName = foodName; // Use the product title for API lookup
          
          if (nutritionalInfo) {
            macros = {
              calories: nutritionalInfo.energy || 0,
              protein: nutritionalInfo.proteins || 0,
              carbs: nutritionalInfo.carbohydrates || 0,
              fat: nutritionalInfo.fat || 0
            };
          } else {
            // Get nutrition data from the API
            const nutritionData = await fetchNutritionalData(englishFoodName);
            macros = {
              calories: nutritionData.energy || 0,
              protein: nutritionData.proteins || 0,
              carbs: nutritionData.carbohydrates || 0,
              fat: nutritionData.fat || 0
            };
            
            // Update the UI with the fetched nutrition data
            setNutritionalInfo(nutritionData);
          }
        }
        
        // Determine meal type based on time of day
        const currentHour = new Date().getHours();
        let mealType = 'snack';
        
        if (currentHour >= 5 && currentHour < 11) {
          mealType = 'breakfast';
        } else if (currentHour >= 11 && currentHour < 15) {
          mealType = 'lunch';
        } else if (currentHour >= 17 && currentHour < 22) {
          mealType = 'dinner';
        }
        
        // Add to meals collection - match the structure expected by the dashboard
        const mealData = {
          name: foodName,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fat,
          type: mealType, // Use 'type' instead of 'mealType' to match dashboard
          timestamp: new Date(),
          userId: user.uid
        };
        
        // Add to Firestore
        const mealRef = await addDoc(collection(db, 'users', user.uid, 'meals'), mealData);
        console.log('Meal added with ID:', mealRef.id);
        
        // Show success message with translated meal type
        const mealTypeTranslated = 
          mealType === 'breakfast' ? 'закуска' : 
          mealType === 'lunch' ? 'обяд' : 
          mealType === 'dinner' ? 'вечеря' : 'закуска';
        
        Alert.alert(
          'Успешно добавяне',
          `${foodName} беше добавена като ${mealTypeTranslated}.`,
          [{ text: 'OK' }]
        );
        
        handleScanAgain(); // Reset the scan state after adding
        
      } catch (error) {
        console.error('Error logging food as eaten:', error);
        Alert.alert('Грешка', 'Възникна проблем при добавянето на храната.');
      }
    } else {
      Alert.alert('Грешка', 'Трябва да сте влезли в профила си, за да добавите храна.');
    }
  };

  // Update the food selection handler to refresh nutritional data
  const handleFoodSelection = async (result: any) => {
    // Create a new result with only this food item
    const selectedResult = {
      ...foodRecognitionResult,
      recognition_results: [result]
    };
    setFoodRecognitionResult(selectedResult);
    
    // Update nutritional info based on the selected food
    const englishName = result.name || 'Unknown food';
    const nutritionData = await fetchNutritionalData(englishName);
    setNutritionalInfo(nutritionData);
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
        onBarcodeScanned={!isFoodMode && !scanned ? handleBarcodeScanned : undefined}
        type="back"
      />

      {/* Back Button */}
      <StyledTouchableOpacity 
        onPress={handleGoBack}
        className="absolute top-12 left-4 z-10"
        style={styles.iconButton}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </StyledTouchableOpacity>

      {/* Mode Toggle Button */}
      <StyledTouchableOpacity 
        onPress={toggleMode}
        className="absolute top-12 right-4 z-10"
        style={styles.iconButton}
      >
        <Ionicons 
          name={isFoodMode ? "barcode-outline" : "restaurant-outline"} 
          size={24} 
          color="#FFFFFF" 
        />
        <StyledText className="text-white text-xs mt-1">
          {isFoodMode ? "Баркод" : "Храна"}
        </StyledText>
      </StyledTouchableOpacity>

      {/* Camera Button for Food Mode */}
      {isFoodMode && !scanned && (
        <StyledTouchableOpacity 
          onPress={handleCameraCapture}
          className="absolute bottom-36"
          style={styles.captureButton}
        >
          <Ionicons name="camera-outline" size={36} color="white" />
        </StyledTouchableOpacity>
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
              onPress={handleLogAsEaten}
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
              onPress={handleLogAsEaten}
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
    padding: 10,
    flex: 1,
    marginRight: 6,
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
    padding: 10,
    flex: 1,
    marginHorizontal: 6,
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
    padding: 10,
    flex: 1,
    marginLeft: 6,
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
});

export default ScanScreen;
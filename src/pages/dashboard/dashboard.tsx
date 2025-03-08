import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, View, ActivityIndicator, Image, StyleSheet, Alert, Animated, Dimensions, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where, orderBy, limit, deleteDoc, updateDoc, addDoc, getDocs, Timestamp, setDoc } from 'firebase/firestore';
import { styled } from 'nativewind';
import { Text, TouchableOpacity, ImageBackground, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NutritionCard from '../../widgets/nutrition/NutritionCard';
import AddMealButton from '../../features/meal-planning/ui/AddMealButton';
import { LineChart } from 'react-native-chart-kit';
import { showMessage } from 'react-native-flash-message';
import { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchRandomMeals } from '../../shared/api/services/mealService';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GoalsScreen from '../goals/goals';
import InventoryScreen from '../inventory/inventory';
import RecipesScreen from '../recipes/recipes';
import ScanScreen from '../inventory/scan';
import EditProfileScreen from '../../entities/user/ui/editProfile';

const auth = getAuth();
const db = getFirestore();
const Tab = createBottomTabNavigator();

const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImageBackground = styled(ImageBackground);

const translations = {
  welcome: 'Добре дошли',
  breakfast: 'Закуска',
  lunch: 'Обяд', 
  dinner: 'Вечеря',
  snacks: 'Снаксове',
  water: 'Вода',
  recommended: 'Препоръчително',
  deleteConfirmation: 'Сигурни ли сте, че искате да изтриете това ястие?',
  cancel: 'Отказ',
  deleteMeal: 'Изтрий ястие',
  deleteSuccess: 'Ястието беше изтрито успешно',
  deleteError: 'Грешка при изтриване на ястието',
  waterAchievement: 'Хидратация',
  waterAchievementDesc: 'Достигнахте дневната си цел за вода',
  kcalLeft: 'калории остават',
  eaten: 'приети',
  burned: 'изгорени',
  today: 'Днес',
  yesterday: 'Вчера',
  selectDate: 'Изберете дата',
  todaysMeals: 'Днешни хранения',
};

const theme = {
  colors: {
    primary: '#4CAF50',
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    accent: '#4CAF50',
    gradient: {
      start: '#4CAF50',
      middle: '#FFD700',
      end: '#4CAF50'
    }
  }
};

interface DashboardProps {
  onLogout: () => void;
}

interface DashboardItem {
  id: string;
  title: string;
  description: string;
  type: 'bmi' | 'water' | 'nutrition';
}

interface NutritionStats {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
}

interface UserData {
  weight?: string;
  height?: string;
  gender?: string;
  dateOfBirth?: any; // Firebase Timestamp
  goal?: string;
  activityLevel?: number;
}

interface WeightRecord {
  weight: number;
  date: Date;
}

interface PlannedMeal {
  id: string;
  name: string;
  plannedFor: Date;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  status: 'planned' | 'completed';
  fadeAnim?: Animated.Value;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: Timestamp;
  permanent: boolean;
}

interface SuggestedMeal {
  name: string;
  calories?: number;
  kcal?: number;
  servingSize: string;
  image?: string;
  thumbnail?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  category?: string;
  instructions?: string;
  ingredients?: any[];
  eaten?: boolean;
}

interface MealTimeButtonProps {
  icon: string;
  title: string;
  subtitle?: string;
  calories?: number;
  recommended?: string;
  todaysMeals: MealData[];
  suggestedMeals?: SuggestedMeal[];
}

interface MealData {
  id: string;
  name: string;
  type: string;
  mealType?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: Date;
}

interface MealRecommendations {
  breakfast: { min: number; max: number };
  lunch: { min: number; max: number };
  dinner: { min: number; max: number };
  snacks: { min: number; max: number };
  [key: string]: { min: number; max: number }; // Add index signature
}

interface WaterData {
  amount: number;
  timestamp: Date;
}

interface WaterTrackerProps {
  currentAmount: number;
  targetAmount: number;
  onAddWater: (index: number) => void;
}

interface DateSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

type RootStackParamList = {
  dashboard: undefined;
  addMeal: { mealType?: string };
  editProfile: undefined;
  planMeal: { meal?: PlannedMeal; directLog?: boolean };
  trackWeight: undefined;
  goalsSelect: undefined;
  mealDetail: { meal: SuggestedMeal; mealType?: string; eaten?: boolean };
  savedMeals: undefined;
  allRecipes: undefined;
};

const calculateAge = (dateOfBirth: any): number => {
  const birthDate = dateOfBirth.toDate();
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const calculateNutritionTargets = (userData: UserData) => {
  // Add null checks and default values
  const weight = parseFloat(userData?.weight || '0');
  const height = parseFloat(userData?.height || '0');
  const age = userData?.dateOfBirth ? calculateAge(userData.dateOfBirth) : 25;
  const isMale = (userData?.gender || '').toLowerCase() === 'male';
  const activityLevel = userData?.activityLevel || 1.55;
  const goal = (userData?.goal || 'maintain weight').toLowerCase();

  // Calculate BMR using Harris-Benedict equation
  let bmr;
  if (isMale) {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Use the actual activity level from user data
  let maintenanceCalories = bmr * activityLevel;

  // Adjust calories based on goal
  let targetCalories;
  switch (goal) {
    case 'lose weight':
      targetCalories = maintenanceCalories - 500; // 500 calorie deficit
      break;
    case 'gain weight':
      targetCalories = maintenanceCalories + 500; // 500 calorie surplus
      break;
    default: // 'maintain weight'
      targetCalories = maintenanceCalories;
  }

  // Calculate macronutrient targets
  // Protein: 2g per kg of body weight
  const targetProtein = weight * 2;
  
  // Fat: 25% of total calories
  const targetFats = (targetCalories * 0.25) / 9; // 9 calories per gram of fat
  
  // Remaining calories from carbs
  const carbCalories = targetCalories - (targetProtein * 4) - (targetFats * 9); // 4 calories per gram of protein
  const targetCarbs = carbCalories / 4; // 4 calories per gram of carbs

  return {
    targetCalories: Math.round(targetCalories),
    targetProtein: Math.round(targetProtein),
    targetCarbs: Math.round(targetCarbs),
    targetFats: Math.round(targetFats)
  };
};

const calculateMealRecommendations = (totalCalories: number): MealRecommendations => {
  return {
    breakfast: {
      min: Math.round(totalCalories * 0.25), // 25% of daily calories
      max: Math.round(totalCalories * 0.35), // 35% of daily calories
    },
    lunch: {
      min: Math.round(totalCalories * 0.30), // 30% of daily calories
      max: Math.round(totalCalories * 0.40), // 40% of daily calories
    },
    dinner: {
      min: Math.round(totalCalories * 0.30), // 30% of daily calories
      max: Math.round(totalCalories * 0.40), // 40% of daily calories
    },
    snacks: {
      min: Math.round(totalCalories * 0.05), // 5% of daily calories
      max: Math.round(totalCalories * 0.10), // 10% of daily calories
    },
  };
};

// Add new interface for stored meal suggestions
interface StoredMealSuggestions {
  date: string;
  breakfast: SuggestedMeal[];
  lunch: SuggestedMeal[];
  dinner: SuggestedMeal[];
  snacks: SuggestedMeal[];
}

// Add this constant at the top level of the file, outside any component
const mealTypeMap: { [key: string]: string } = {
  'Закуска': 'breakfast',
  'Обяд': 'lunch',
  'Вечеря': 'dinner',
  'Снаксове': 'snacks'
};

// Add these new interfaces at the top with the other interfaces
interface MealTimeWindow {
  start: number; // Hours in 24h format
  end: number;
}

interface MealTimings {
  breakfast: MealTimeWindow;
  lunch: MealTimeWindow;
  dinner: MealTimeWindow;
  snacks: MealTimeWindow[];
}

// Add this constant with the meal timings
const defaultMealTimings: MealTimings = {
  breakfast: { start: 6, end: 10 },
  lunch: { start: 12, end: 15 },
  dinner: { start: 18, end: 22 },
  snacks: [
    { start: 10, end: 12 },
    { start: 15, end: 18 }
  ]
};

// Add this function to check missed meals
const checkMissedMeals = (
  currentTime: Date,
  todaysMeals: MealData[],
  mealTimings: MealTimings = defaultMealTimings
): string[] => {
  const currentHour = currentTime.getHours();
  const missedMeals: string[] = [];

  // Check breakfast
  if (currentHour > mealTimings.breakfast.end) {
    const hasBreakfast = todaysMeals.some(meal => 
      meal.type?.toLowerCase() === 'breakfast' || 
      meal.mealType?.toLowerCase() === 'breakfast'
    );
    if (!hasBreakfast) {
      missedMeals.push('breakfast');
    }
  }

  // Check lunch
  if (currentHour > mealTimings.lunch.end) {
    const hasLunch = todaysMeals.some(meal => 
      meal.type?.toLowerCase() === 'lunch' || 
      meal.mealType?.toLowerCase() === 'lunch'
    );
    if (!hasLunch) {
      missedMeals.push('lunch');
    }
  }

  // Check dinner
  if (currentHour > mealTimings.dinner.end) {
    const hasDinner = todaysMeals.some(meal => 
      meal.type?.toLowerCase() === 'dinner' || 
      meal.mealType?.toLowerCase() === 'dinner'
    );
    if (!hasDinner) {
      missedMeals.push('dinner');
    }
  }

  return missedMeals;
};

// Add this component for the missed meals alert
const MissedMealAlert = ({ 
  mealType, 
  onLogMeal, 
  onSkipMeal, 
  onClose 
}: { 
  mealType: string; 
  onLogMeal: () => void; 
  onSkipMeal: () => void; 
  onClose: () => void; 
}) => {
  return (
    <View style={styles.alertOverlay}>
      <View style={styles.alertContainer}>
        <Text style={styles.alertTitle}>Пропуснато хранене</Text>
        <Text style={styles.alertMessage}>
          Изглежда, че сте пропуснали {
            mealType === 'breakfast' ? 'закуската' :
            mealType === 'lunch' ? 'обяда' :
            'вечерята'
          }. Какво бихте искали да направите?
        </Text>
        <View style={styles.alertButtons}>
          <TouchableOpacity 
            style={[styles.alertButton, styles.alertButtonPrimary]}
            onPress={onLogMeal}
          >
            <Text style={styles.alertButtonText}>Добави хранене</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={onSkipMeal}
          >
            <Text style={styles.alertButtonTextSecondary}>Пропусни</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.alertCloseButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#999999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Add these new interfaces
interface MissedMealRecord {
  date: string;
  skippedMeals: string[];
}

// Update the component name and its display text
const SkippedMealNotificationToggle = ({ 
  isNotificationEnabled, 
  setIsNotificationEnabled 
}: { 
  isNotificationEnabled: boolean;
  setIsNotificationEnabled: (value: boolean) => void;
}) => (
  <TouchableOpacity
    style={[
      styles.notificationToggleButton,
      isNotificationEnabled ? styles.notificationToggleEnabled : styles.notificationToggleDisabled
    ]}
    onPress={() => {
      setIsNotificationEnabled(!isNotificationEnabled);
      showMessage({
        message: isNotificationEnabled ? 
          'Напомняния за пропуснати хранения изключени' : 
          'Напомняния за пропуснати хранения включени',
        type: 'info',
        duration: 2000,
      });
    }}
  >
    <View style={styles.notificationToggleContent}>
      <MaterialIcons 
        name={isNotificationEnabled ? "notifications-active" : "notifications-off"} 
        size={24} 
        color={isNotificationEnabled ? "#FFFFFF" : "#4CAF50"} 
        style={styles.notificationIcon}
      />
      <Text style={styles.notificationToggleText}>
        {isNotificationEnabled ? 'Изключи напомняния' : 'Включи напомняния'}
      </Text>
    </View>
  </TouchableOpacity>
);

// Add this interface for the refresh button in the meal item
interface SuggestedMealItemProps {
  meal: SuggestedMeal;
  mealType: string;
  eaten: boolean;
  onRegenerate: () => Promise<void>;
}

// Add this helper function before SuggestedMealItem definition
const getEncodedImageUrl = (url?: string) => {
  if (!url) return 'https://via.placeholder.com/300';
  
  try {
    // Handle URLs with spaces, Cyrillic characters, or special symbols
    const baseUrl = url.split('?')[0]; // Remove any query parameters
    const encodedUrl = encodeURI(baseUrl);
    
    // Check if URL already has a protocol
    if (!encodedUrl.startsWith('http')) {
      // If it's a relative path, ensure it has a protocol
      return `http://${process.env.EXPO_PUBLIC_IPADDRESS || 'localhost'}:3000${encodedUrl.startsWith('/') ? '' : '/'}${encodedUrl}`;
    }
    
    return encodedUrl;
  } catch (error) {
    console.error('Error encoding image URL:', error, url);
    return 'https://via.placeholder.com/300';
  }
};

// Update the SuggestedMealItem component
const SuggestedMealItem = ({ meal, mealType, eaten, onRegenerate }: SuggestedMealItemProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [imageError, setImageError] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handlePress = () => {
    const enhancedMeal = {
      ...meal,
      image: getEncodedImageUrl(meal.image || meal.thumbnail),
      calories: meal.calories || meal.kcal || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fats: meal.fats || 0,
      servings: 1,
      preparation_time: 0,
      cooking_time: 0,
      total_time: 0,
      instructions: meal.instructions || '',
      ingredients: meal.ingredients || []
    };
    
    navigation.navigate('mealDetail', {
      meal: enhancedMeal,
      mealType: mealType
    });
  };

  const handleRegenerateMeal = async () => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.suggestedMealItem, 
        eaten && styles.suggestedMealItemEaten
      ]} 
      onPress={handlePress}
    >
      <View style={styles.bulletPoint} />
      {(meal.image || meal.thumbnail) ? (
        <Image 
          source={{ 
            uri: getEncodedImageUrl(meal.image || meal.thumbnail),
            cache: 'force-cache'
          }} 
          style={[
            styles.suggestedMealImage,
            eaten && styles.suggestedMealImageEaten
          ]}
          onError={(e) => {
            console.log('Error loading image:', e.nativeEvent.error, meal.name);
            setImageError(true);
          }}
        />
      ) : (
        <View style={[styles.suggestedMealImage, { backgroundColor: '#333' }]} />
      )}
      <View style={styles.suggestedMealContent}>
        <View style={styles.suggestedMealNameRow}>
          {eaten && (
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.eatenIcon} />
          )}
          <Text 
            style={[
              styles.suggestedMealName,
              eaten && styles.suggestedMealNameEaten
            ]}
          >
            {meal.name}
          </Text>
        </View>
        <Text style={styles.suggestedMealDetails}>
          {meal.servingSize} • {Math.round(meal.calories || meal.kcal || 0)} kcal
        </Text>
      </View>
      <TouchableOpacity 
        style={[
          styles.regenerateMealButton,
          isRegenerating && styles.regeneratingButton
        ]}
        onPress={handleRegenerateMeal}
        disabled={isRegenerating}
      >
        <Ionicons 
          name={isRegenerating ? "hourglass-outline" : "refresh-outline"} 
          size={20} 
          color="#4CAF50" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const DashboardScreen: React.FC<DashboardProps> = ({ onLogout }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [bmi, setBmi] = useState<number | null>(null);
  const [water, setWaterConsumption] = useState<number | null>(null);
  const [nutritionStats, setNutritionStats] = useState<NutritionStats>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFats: 70
  });
  const [todaysMeals, setTodaysMeals] = useState<MealData[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userData, setUserData] = useState<UserData>({});
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [animatingMeals, setAnimatingMeals] = useState<string[]>([]);
  const [mealRecommendations, setMealRecommendations] = useState<MealRecommendations>({
    breakfast: { min: 0, max: 0 },
    lunch: { min: 0, max: 0 },
    dinner: { min: 0, max: 0 },
    snacks: { min: 0, max: 0 },
  });
  const [waterIntake, setWaterIntake] = useState<WaterData[]>([]);
  const [breakfastSuggestions, setBreakfastSuggestions] = useState<SuggestedMeal[]>([]);
  const [lunchSuggestions, setLunchSuggestions] = useState<SuggestedMeal[]>([]);
  const [dinnerSuggestions, setDinnerSuggestions] = useState<SuggestedMeal[]>([]);
  const [snackSuggestions, setSnackSuggestions] = useState<SuggestedMeal[]>([]);
  const [storedSuggestions, setStoredSuggestions] = useState<StoredMealSuggestions | null>(null);
  // Add these new state variables
  const [showMissedMealAlert, setShowMissedMealAlert] = useState(false);
  const [missedMealType, setMissedMealType] = useState<string | null>(null);
  const [checkedMeals, setCheckedMeals] = useState<Set<string>>(new Set());
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Function to save skipped meals to AsyncStorage
  const saveSkippedMeal = async (mealType: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedSkippedMeals = await AsyncStorage.getItem('skippedMeals');
      let missedMealRecords: MissedMealRecord[] = [];
      
      if (storedSkippedMeals) {
        missedMealRecords = JSON.parse(storedSkippedMeals);
      }

      const todayRecord = missedMealRecords.find(record => record.date === today);
      
      if (todayRecord) {
        if (!todayRecord.skippedMeals.includes(mealType)) {
          todayRecord.skippedMeals.push(mealType);
        }
      } else {
        missedMealRecords.push({
          date: today,
          skippedMeals: [mealType]
        });
      }

      await AsyncStorage.setItem('skippedMeals', JSON.stringify(missedMealRecords));
    } catch (error) {
      console.error('Error saving skipped meal:', error);
    }
  };

  // Function to check if a meal was already skipped today
  const checkIfMealSkipped = async (mealType: string): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedSkippedMeals = await AsyncStorage.getItem('skippedMeals');
      
      if (!storedSkippedMeals) return false;

      const missedMealRecords: MissedMealRecord[] = JSON.parse(storedSkippedMeals);
      const todayRecord = missedMealRecords.find(record => record.date === today);
      
      return todayRecord ? todayRecord.skippedMeals.includes(mealType) : false;
    } catch (error) {
      console.error('Error checking skipped meal:', error);
      return false;
    }
  };

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) {
      console.log("User not logged in");
      return;
    }

    setLoading(true);

    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      try {
        if (doc.exists()) {
          const userData = doc.data();
          console.log('User data updated:', userData);

          setProfileImage(userData?.profileImage || '');
          setUserData(userData);

          const weightString = userData?.weight || null;
          const heightString = userData?.height || null;

          // Convert strings to numbers
          const weight = weightString ? parseFloat(weightString) : null;
          const height = heightString ? parseFloat(heightString) : null;

          if (weight && height) {
            // Validate values before calculation
            if (!isNaN(weight) && !isNaN(height) && height > 0) {
              const calculatedBmi = weight / ((height / 100) * (height / 100));
              setBmi(calculatedBmi);
            } else {
              console.error('Invalid weight or height values:', { weight, height });
              setBmi(null);
            }
          } else {
            setBmi(null); // Handle missing weight or height
          }

          if (weight) {
            if (!isNaN(weight)) {
              const calculatedWaterConsumption = weight * 0.035;
              setWaterConsumption(calculatedWaterConsumption);
            } else {
              console.error('Invalid weight value:', { weight });
              setWaterConsumption(null);
            }
          } else {
            setWaterConsumption(null);
          }

          if (!userData?.goal) {
            console.log('No goal found for user, redirecting to GoalsSelect.');
            navigation.replace('goalsSelect');
          }

          // Calculate nutrition targets based on user data
          const targets = calculateNutritionTargets(userData as UserData);
          
          setNutritionStats(prev => ({
            ...prev,
            targetCalories: targets.targetCalories,
            targetProtein: targets.targetProtein,
            targetCarbs: targets.targetCarbs,
            targetFats: targets.targetFats
          }));

          // Calculate meal recommendations based on target calories
          setMealRecommendations(calculateMealRecommendations(targets.targetCalories));
        } else {
          console.log('User document does not exist in the "users" collection.');
        }
      } catch (err) {
        console.error('Error processing user data:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  useEffect(() => {
    setDashboardData([
      { id: '1', title: 'Вашият индекс на телесна маса', description: 'Изчисляване на ИТМ...' },
      { id: '2', title: 'Вашият дневен прием на вода', description: 'Изчисляване на дневен прием на вода...' },
      { id: '3', title: 'Вашата цел', description: 'Зареждане на цел...' },
    ]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (currentDate.getDate() !== now.getDate()) {
        setCurrentDate(now);
        setNutritionStats(prev => ({
          ...prev,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        }));
        setTodaysMeals([]);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const q = query(
      mealsRef,
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFats = 0;
      
      const meals = snapshot.docs.map(doc => {
        const data = doc.data();
        // Transform the nested nutriments structure to flat structure
        const mealData = {
          id: doc.id,
          name: data.name,
          calories: data.nutriments?.calories || data.calories || 0,
          protein: data.nutriments?.protein || data.protein || 0,
          carbs: data.nutriments?.carbs || data.carbs || 0,
          fats: data.nutriments?.fat || data.fats || 0, // Note: handle both 'fat' and 'fats'
          timestamp: data.timestamp,
          type: data.type,
          mealType: data.mealType
        };
        
        // Add to totals
        totalCalories += mealData.calories;
        totalProtein += mealData.protein;
        totalCarbs += mealData.carbs;
        totalFats += mealData.fats;
        
        return mealData;
      });

      setTodaysMeals(meals);
      setNutritionStats(prev => ({
        ...prev,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fats: totalFats,
      }));
    });

    return () => unsubscribe();
  }, [currentDate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const weightHistoryRef = collection(db, 'users', user.uid, 'weightHistory');
    const weightQuery = query(weightHistoryRef, orderBy('date', 'desc'), limit(7));

    const unsubscribeWeight = onSnapshot(weightQuery, (snapshot) => {
      const weights = snapshot.docs.map(doc => ({
        weight: doc.data().weight,
        date: doc.data().date.toDate()
      }));
      setWeightHistory(weights);
    });

    return () => unsubscribeWeight();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const plannedMealsRef = collection(db, 'users', user.uid, 'plannedMeals');
    const plannedQuery = query(
      plannedMealsRef,
      where('plannedFor', '>=', today),
      orderBy('plannedFor', 'asc')
    );

    const unsubscribePlanned = onSnapshot(plannedQuery, (snapshot) => {
      const meals = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to Date
        return {
          id: doc.id,
          ...data,
          plannedFor: data.plannedFor?.toDate() || new Date(), // Handle potential undefined
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      setPlannedMeals(meals);
    });

    return () => unsubscribePlanned();
  }, [currentDate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const updateAchievements = async () => {
      const newAchievements = await checkAchievements(userData, todaysMeals);
      setAchievements(newAchievements);
    };

    updateAchievements();
  }, [userData, todaysMeals]);

  useEffect(() => {
    // Initialize animation values for each meal
    plannedMeals.forEach(meal => {
      if (!meal.fadeAnim) {
        meal.fadeAnim = new Animated.Value(1);
      }
    });
  }, [plannedMeals]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const waterRef = collection(db, 'users', user.uid, 'waterIntake');
    const q = query(
      waterRef,
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const waterData = snapshot.docs[0].data();
        // Update with array of WaterData instead of just a number
        setWaterIntake([{ 
          amount: waterData.amount || 0, 
          timestamp: waterData.timestamp.toDate() 
        }]);
      } else {
        // Initialize with empty array
        setWaterIntake([]);
      }
    });

    return () => unsubscribe();
  }, [currentDate]);

  useEffect(() => {
    const fetchAndStoreSuggestions = async () => {
      try {
        if (!user) return;
        
        setLoadingSuggestions(true);
        
        // Format the date as YYYY-MM-DD for storage key
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Reference to the user's meal suggestions document
        const suggestionsRef = doc(db, 'users', user.uid, 'mealSuggestions', dateKey);
        
        // Check if we already have suggestions for this date
        const suggestionsDoc = await getDoc(suggestionsRef);
        
        if (suggestionsDoc.exists()) {
          // Use existing suggestions
          const data = suggestionsDoc.data() as StoredMealSuggestions;
          setStoredSuggestions(data);
          setBreakfastSuggestions(data.breakfast || []);
          setLunchSuggestions(data.lunch || []);
          setDinnerSuggestions(data.dinner || []);
          setSnackSuggestions(data.snacks || []);
          setLoadingSuggestions(false);
          return;
        }

        // Try to get suggestions from AsyncStorage first (offline fallback)
        const storedSuggestionsJson = await AsyncStorage.getItem('mealSuggestions');
        if (storedSuggestionsJson) {
          const storedData = JSON.parse(storedSuggestionsJson) as StoredMealSuggestions;
          // Only use stored suggestions if they're for the same date
          if (storedData.date === dateKey) {
            setStoredSuggestions(storedData);
            setBreakfastSuggestions(storedData.breakfast || []);
            setLunchSuggestions(storedData.lunch || []);
            setDinnerSuggestions(storedData.dinner || []);
            setSnackSuggestions(storedData.snacks || []);
            
            // Also save to Firestore for future reference
            await setDoc(suggestionsRef, storedData);
            setLoadingSuggestions(false);
            return;
          }
        }
        
        // Generate new suggestions for the selected date
        let breakfast, lunch, dinner, snacks;
        
        try {
          breakfast = await generateMealSuggestions('breakfast', nutritionStats.targetCalories);
          lunch = await generateMealSuggestions('lunch', nutritionStats.targetCalories);
          dinner = await generateMealSuggestions('dinner', nutritionStats.targetCalories);
          snacks = await generateMealSuggestions('snacks', nutritionStats.targetCalories);
        } catch (error) {
          console.error('Error generating meal suggestions:', error);
          
          // Use fallback meals if API fails
          breakfast = getFallbackMeals('breakfast', mealRecommendations.breakfast);
          lunch = getFallbackMeals('lunch', mealRecommendations.lunch);
          dinner = getFallbackMeals('dinner', mealRecommendations.dinner);
          snacks = getFallbackMeals('snacks', mealRecommendations.snacks);
          
          Toast.show({
            type: 'error',
            text1: 'Грешка при зареждане на ястия',
            text2: 'Използваме запазени ястия вместо това',
            position: 'top',
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 50
          });
        }

        // Store the suggestions with the selected date
        const newSuggestions: StoredMealSuggestions = {
          date: dateKey,
          breakfast,
          lunch,
          dinner,
          snacks,
        };

        // Only store suggestions for today or future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(currentDate);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate >= today) {
          try {
            await setDoc(suggestionsRef, newSuggestions);
            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem('mealSuggestions', JSON.stringify(newSuggestions));
          } catch (error) {
            console.error('Error storing suggestions:', error);
          }
        }
        
        setStoredSuggestions(newSuggestions);
        setBreakfastSuggestions(breakfast);
        setLunchSuggestions(lunch);
        setDinnerSuggestions(dinner);
        setSnackSuggestions(snacks);
        
      } catch (error) {
        console.error('Error in fetchAndStoreSuggestions:', error);
        
        // Use fallback meals as a last resort
        const fallbackSuggestions: StoredMealSuggestions = {
          date: currentDate.toISOString().split('T')[0],
          breakfast: getFallbackMeals('breakfast', mealRecommendations.breakfast),
          lunch: getFallbackMeals('lunch', mealRecommendations.lunch),
          dinner: getFallbackMeals('dinner', mealRecommendations.dinner),
          snacks: getFallbackMeals('snacks', mealRecommendations.snacks)
        };
        
        setStoredSuggestions(fallbackSuggestions);
        setBreakfastSuggestions(fallbackSuggestions.breakfast);
        setLunchSuggestions(fallbackSuggestions.lunch);
        setDinnerSuggestions(fallbackSuggestions.dinner);
        setSnackSuggestions(fallbackSuggestions.snacks);
        
        Toast.show({
          type: 'error',
          text1: 'Грешка при зареждане',
          text2: 'Не можахме да заредим препоръчаните ястия',
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 50
        });
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchAndStoreSuggestions();
  }, [currentDate, nutritionStats.targetCalories, user?.uid]); // Add user?.uid to dependencies

  useEffect(() => {
    const checkMeals = async () => {
      const currentTime = new Date();
      const missedMeals = checkMissedMeals(currentTime, todaysMeals);
      
      // Find the first unchecked and not skipped meal
      for (const meal of missedMeals) {
        const isSkipped = !isNotificationEnabled ? false : await checkIfMealSkipped(meal);
        if (!checkedMeals.has(meal) && !isSkipped) {
          setMissedMealType(meal);
          setShowMissedMealAlert(true);
          break;
        }
      }
    };

    // Check every 30 minutes
    const interval = setInterval(checkMeals, 1800000);
    
    // Initial check
    checkMeals();

    return () => clearInterval(interval);
  }, [todaysMeals, checkedMeals, isNotificationEnabled]);

  // Add these handlers for the missed meal alert
  const handleLogMissedMeal = () => {
    if (missedMealType) {
      // Navigate to planMeal with empty params object
      navigation.navigate('planMeal', {});
      setCheckedMeals(prev => new Set([...prev, missedMealType]));
      setShowMissedMealAlert(false);
    }
  };

  const handleSkipMissedMeal = async () => {
    if (missedMealType) {
      await saveSkippedMeal(missedMealType);
      setCheckedMeals(prev => new Set([...prev, missedMealType]));
      setShowMissedMealAlert(false);
    }
  };

  const handleCloseMissedMealAlert = () => {
    setShowMissedMealAlert(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem('userToken'); // Remove user ID
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  const handleAddMeal = () => {
    navigation.navigate('addMeal', {});
  };

  const checkAchievements = async (userData: any, meals: any[]): Promise<Achievement[]> => {
    if (!user) return [];

    try {
      const achievementsRef = collection(db, 'users', user.uid, 'achievements');
      const achievementsSnapshot = await getDocs(achievementsRef);
      const existingAchievements = new Map(
        achievementsSnapshot.docs.map(doc => [doc.data().id, { ...doc.data(), dbId: doc.id }])
      );

      const newAchievements: Achievement[] = [
        {
          id: 'first_meal',
          title: 'Първо ястие',
          description: 'Добавихте първото си ястие',
          icon: 'restaurant',
          earned: false,
          permanent: true
        },
        {
          id: 'weight_goal',
          title: 'Достигната цел',
          description: 'Достигнахте целевото си тегло',
          icon: 'trophy',
          earned: false,
          permanent: true
        },
        {
          id: 'daily_water',
          title: 'Хидратация',
          description: 'Достигнахте дневната си цел за вода',
          icon: 'water',
          earned: false,
          permanent: true // Changed to true so it stays unlocked
        }
      ];

      // First, restore any previously earned permanent achievements
      newAchievements.forEach(achievement => {
        const existing = existingAchievements.get(achievement.id);
        if (existing?.earned && achievement.permanent) {
          achievement.earned = true;
          achievement.earnedDate = existing.earnedDate;
        }
      });

      // Check weight goal achievement
      if (userData?.weight && userData?.goalWeight && userData?.goal) {
        const currentWeight = parseFloat(userData.weight);
        const targetWeight = parseFloat(userData.goalWeight);
        
        if (!isNaN(currentWeight) && !isNaN(targetWeight)) {
          let goalAchieved = false;
          
          // Convert goal to lowercase and trim any whitespace
          const userGoal = userData.goal.toLowerCase().trim();
          
          console.log('Weight Goal Check - Before:', {
            currentWeight,
            targetWeight,
            userGoal
          });

          switch (userGoal) {
            case 'lose weight':
            case 'отслабване': // Bulgarian translation
              goalAchieved = currentWeight >= targetWeight; // Changed from <= to >=
              break;
            case 'gain weight':
            case 'качване на тегло': // Bulgarian translation
              goalAchieved = currentWeight <= targetWeight; // Changed from >= to <=
              break;
            case 'maintain weight':
            case 'поддържане на тегло': // Bulgarian translation
              goalAchieved = Math.abs(currentWeight - targetWeight) <= 1;
              break;
          }

          console.log('Weight Goal Check - After:', {
            currentWeight,
            targetWeight,
            userGoal,
            goalAchieved
          });

          if (goalAchieved) {
            const weightAchievement = newAchievements.find(a => a.id === 'weight_goal');
            if (weightAchievement && !weightAchievement.earned) {
              weightAchievement.earned = true;
              weightAchievement.earnedDate = Timestamp.fromDate(new Date());
              
              // Save the achievement
              await addDoc(achievementsRef, {
                ...weightAchievement,
                earnedDate: weightAchievement.earnedDate
              });

              showMessage({
                message: 'Ново постижение!',
                description: 'Достигнахте целевото си тегло! 🎉',
                type: 'success',
                duration: 3000,
              });
            }
          }
        }
      }

      // Check water achievement
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check first meal achievement
      if (meals && meals.length > 0) {
        const firstMealAchievement = newAchievements.find(a => a.id === 'first_meal');
        if (firstMealAchievement && !firstMealAchievement.earned) {
          firstMealAchievement.earned = true;
          firstMealAchievement.earnedDate = Timestamp.fromDate(new Date());
          
          // Save the achievement
          await addDoc(achievementsRef, {
            ...firstMealAchievement,
            earnedDate: firstMealAchievement.earnedDate
          });
          
          showMessage({
            message: 'Ново постижение!',
            description: 'Добавихте първото си ястие! 🍽️',
            type: 'success',
            duration: 3000,
          });
        }
      }

      const waterRef = collection(db, 'users', user.uid, 'waterIntake');
      const waterQuery = query(
        waterRef,
        where('timestamp', '>=', today),
        where('timestamp', '<', tomorrow),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const waterSnapshot = await getDocs(waterQuery);
      if (!waterSnapshot.empty) {
        const waterData = waterSnapshot.docs[0].data();
        if (waterData.amount >= (water || 2.5)) {
          const waterAchievement = newAchievements.find(a => a.id === 'daily_water');
          if (waterAchievement && !waterAchievement.earned) {
            waterAchievement.earned = true;
            waterAchievement.earnedDate = new Date();
            
            // Save the achievement
            await addDoc(achievementsRef, {
              ...waterAchievement,
              earnedDate: Timestamp.fromDate(waterAchievement.earnedDate)
            });
          }
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    if (item.id === '1') {
      return (
        <View style={[styles.cardContainer, styles.bmiCard]}>
          <Text style={styles.cardTitle}>Вашият индекс на телесна маса</Text>
          {loading ? (
            <Text style={styles.bmiValue}>Зареждане...</Text>
          ) : bmi !== null ? (
            <>
              <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
              <Text style={styles.bmiDescription}>
                {bmi < 18.5
                  ? 'Поднормено тегло'
                  : bmi >= 18.5 && bmi <= 24.9
                  ? 'Нормално тегло'
                  : bmi >= 25 && bmi <= 29.9
                  ? 'Наднормено тегло'
                  : 'Затлъстяване'}
              </Text>
            </>
          ) : (
            <Text style={styles.bmiValue}>Невалидни или липсващи данни относно масата и/или височината.</Text>
          )}
        </View>
      );
    }

    if (item.id === '2') {
      return (
        <View style={[styles.cardContainer, styles.waterCard]}>
          <Text style={styles.cardTitle}>Вашият дневен прием на вода</Text>
          {loading ? (
            <Text style={styles.waterValue}>Зареждане...</Text>
          ) : water !== null ? (
            <>
              <Text style={styles.waterValue}>{water.toFixed(2) + " L"}</Text>
            </>
          ) : (
            <Text style={styles.waterValue}>Невалидни или липсващи данни относно масата.</Text>
          )}
        </View>
      );
    }

    if (item.id === '3') {
      const goalTranslations: { [key: string]: string } = {
        'Maintain Weight': 'Поддържане на тегло',
        'Lose Weight': 'Отслабване',
        'Gain Weight': 'Качване на тегло'
      };

      return (
        <View style={[styles.cardContainer, styles.goalCard]}>
          <Text style={styles.cardTitle}>Вашата цел</Text>
          {loading ? (
            <Text style={styles.goalValue}>Зареждане...</Text>
          ) : userData?.goal ? (
            <Text style={styles.goalValue}>{goalTranslations[userData.goal] || userData.goal}</Text>
          ) : (
            <Text style={styles.goalValue}>Не е зададена цел</Text>
          )}
        </View>
      );
    }

    return null;
  };  

  const WeightProgressCard = ({ weightHistory }: { weightHistory: WeightRecord[] }) => {
    return (
      <View style={[styles.cardContainer, styles.weightCard]}>
        <Text style={styles.cardTitle}>Прогрес на теглото</Text>
        {weightHistory.length > 0 ? (
          <LineChart
            data={{
              labels: weightHistory.map(w => 
                w.date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' })
              ),
              datasets: [{
                data: weightHistory.map(w => w.weight)
              }]
            }}
            width={300}
            height={200}
            chartConfig={{
              backgroundColor: '#000000',
              backgroundGradientFrom: '#000000',
              backgroundGradientTo: '#000000',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green color
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        ) : (
          <Text style={styles.noDataText}>Няма налични данни</Text>
        )}
      </View>
    );
  };

  const AchievementsCard = ({ achievements }: { achievements: Achievement[] }) => {
    return (
      <View style={[styles.cardContainer, styles.achievementsCard]}>
        <Text style={styles.cardTitle}>Постижения</Text>
        <FlatList
          horizontal
          data={achievements}
          renderItem={({ item }) => (
            <View style={[
              styles.achievementItem,
              !item.earned && styles.achievementLocked
            ]}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={item.earned ? '#4CAF50' : '#bdbdbd'} 
              />
              <Text style={styles.achievementTitle}>{item.title}</Text>
              <Text style={styles.achievementDesc}>{item.description}</Text>
              {item.earned && item.earnedDate && (
                <Text style={styles.achievementDate}>
                  Постигнато на: {
                    typeof item.earnedDate.toDate === 'function' 
                      ? item.earnedDate.toDate().toLocaleDateString('bg-BG')
                      : item.earnedDate instanceof Date 
                        ? item.earnedDate.toLocaleDateString('bg-BG')
                        : 'Неизвестна дата'
                  }
                </Text>
              )}
            </View>
          )}
          keyExtractor={item => item.id}
        />
      </View>
    );
  };

  // Add this function near the other utility functions
  const generateMealSuggestions = async (mealType: string, targetCalories: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      // First, get the list of blocked meals
      const blockedMealsRef = collection(db, 'users', user.uid, 'blockedMeals');
      const blockedMealsSnapshot = await getDocs(blockedMealsRef);
      const blockedMealNames = new Set(
        blockedMealsSnapshot.docs.map(doc => doc.data().name)
      );
      
      // Use the environment variable for the IP address instead of localhost
      const apiUrl = `http://${process.env.EXPO_PUBLIC_IPADDRESS || 'localhost'}:3000/recipes/random`;
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response;
      try {
        response = await fetch(apiUrl, { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Network error fetching meals:', error);
        throw new Error('Network error fetching meals');
      }
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing API response:', error);
        throw new Error('Invalid API response format');
      }

      if (!data.meals || !Array.isArray(data.meals) || data.meals.length === 0) {
        throw new Error('No meals received from API');
      }

      // Define appropriate categories for each meal type
      const mealTypeCategories: { [key: string]: string[] } = {
        'breakfast': ['Закуски', 'Тестени изделия', 'Предястия'],
        'lunch': ['Основни ястия', 'Супи', 'Салати', 'Постни ястия', 'Вегетариански'],
        'dinner': ['Основни ястия', 'Супи', 'Салати', 'Постни ястия', 'Вегетариански'],
        'snacks': ['Десерти', 'Сладкиши', 'Закуски'],
        'закуска': ['Закуски', 'Тестени изделия', 'Предястия'],
        'обяд': ['Основни ястия', 'Супи', 'Салати', 'Постни ястия', 'Вегетариански'],
        'вечеря': ['Основни ястия', 'Супи', 'Салати', 'Постни ястия', 'Вегетариански'],
        'снаксове': ['Десерти', 'Сладкиши', 'Закуски']
      };

      // Get the recommended calorie range for this meal type
      const mealTypeMap: { [key: string]: keyof MealRecommendations } = {
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner',
        'snacks': 'snacks',
        'закуска': 'breakfast',
        'обяд': 'lunch',
        'вечеря': 'dinner',
        'снаксове': 'snacks'
      };

      const mappedMealType = mealTypeMap[mealType.toLowerCase()] || 'breakfast';
      const calorieRange = mealRecommendations[mappedMealType];
      const appropriateCategories = mealTypeCategories[mealType.toLowerCase()];

      // Transform and filter meals by calorie range AND category AND not blocked
      const suggestions = data.meals
        .map((meal: any) => ({
          name: meal.name,
          calories: Math.round((meal.calories || meal.kcal || 0) * 10) / 10,
          kcal: Math.round((meal.kcal || meal.calories || 0) * 10) / 10,
          servingSize: '1 порция',
          image: meal.image || meal.thumbnail || '',
          thumbnail: meal.thumbnail || meal.image || '',
          protein: Math.round((meal.macros?.protein || meal.protein || 0) * 10) / 10,
          carbs: Math.round((meal.macros?.carbs || meal.carbs || 0) * 10) / 10,
          fats: Math.round((meal.macros?.fat || meal.fats || 0) * 10) / 10,
          category: meal.category,
          instructions: meal.instructions,
          ingredients: meal.ingredients || []
        }))
        .filter((meal: SuggestedMeal) => {
          const calories = meal.calories || meal.kcal || 0;
          const isAppropriateCategory = appropriateCategories.includes(meal.category || '');
          const isNotBlocked = !blockedMealNames.has(meal.name);
          return calories >= calorieRange.min * 0.4 && 
                 calories <= calorieRange.max * 0.7 && 
                 isAppropriateCategory &&
                 isNotBlocked;
        });

      // If no suitable meals found after filtering, use fallback meals
      if (suggestions.length === 0) {
        console.log('No suitable meals found after filtering, using fallbacks');
        return getFallbackMeals(mealType, calorieRange);
      }

      // Randomly select meals while ensuring total calories stay within range
      const shuffled = suggestions.sort(() => 0.5 - Math.random());
      const selectedMeals: typeof suggestions = [];
      let totalCalories = 0;

      // Try to add 1-2 meals while staying within calorie range
      for (const meal of shuffled) {
        const mealCalories = meal.calories || meal.kcal || 0;
        if (totalCalories + mealCalories <= calorieRange.max) {
          selectedMeals.push(meal);
          totalCalories += mealCalories;
          
          // Stop if we have 2 meals or if adding another would exceed max calories
          if (selectedMeals.length >= 2 || totalCalories >= calorieRange.max * 0.8) {
            break;
          }
        }
      }

      // If no meals were selected, return fallback meals
      if (selectedMeals.length === 0) {
        console.log('No meals selected within calorie range, using fallbacks');
        return getFallbackMeals(mealType, calorieRange);
      }

      return selectedMeals;

    } catch (error) {
      console.error('Error generating meal suggestions:', error);
      
      // Return fallback meals based on meal type
      const mappedMealType = mealTypeMap[mealType.toLowerCase()] || 'breakfast';
      const calorieRange = mealRecommendations[mappedMealType];
      return getFallbackMeals(mealType, calorieRange);
    }
  };

  // Add a helper function to provide fallback meals
  const getFallbackMeals = (mealType: string, calorieRange: { min: number, max: number }): SuggestedMeal[] => {
    // Define fallback meals for each meal type
    const fallbackMeals: { [key: string]: SuggestedMeal[] } = {
      'breakfast': [
        {
          name: 'Овесена каша с плодове',
          calories: 307,
          protein: 13,
          carbs: 55,
          fats: 5,
          servingSize: '1 порция',
          category: 'Закуски',
          image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?ixlib=rb-4.0.3'
        },
        {
          name: 'Мюсли с кисело мляко',
          calories: 286,
          protein: 11,
          carbs: 45,
          fats: 8,
          servingSize: '1 порция',
          category: 'Закуски',
          image: 'https://www.acouplecooks.com/wp-content/uploads/2020/09/Muesli-005.jpg'
        }
      ],
      'lunch': [
        {
          name: 'Пилешки гърди на скара',
          calories: 165,
          protein: 31,
          carbs: 0,
          fats: 3.6,
          servingSize: '1 порция',
          category: 'Основни ястия',
          image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?ixlib=rb-4.0.3'
        },
        {
          name: 'Гръцка салата',
          calories: 230,
          protein: 7,
          carbs: 13,
          fats: 18,
          servingSize: '1 порция',
          category: 'Салати',
          image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3'
        }
      ],
      'dinner': [
        {
          name: 'Печена риба със зеленчуци',
          calories: 280,
          protein: 25,
          carbs: 15,
          fats: 12,
          servingSize: '1 порция',
          category: 'Основни ястия',
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3'
        },
        {
          name: 'Зеленчукова супа',
          calories: 120,
          protein: 5,
          carbs: 20,
          fats: 2,
          servingSize: '1 порция',
          category: 'Супи',
          image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3'
        }
      ],
      'snacks': [
        {
          name: 'Плодова салата',
          calories: 95,
          protein: 1,
          carbs: 25,
          fats: 0,
          servingSize: '1 порция',
          category: 'Десерти',
          image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?ixlib=rb-4.0.3'
        },
        {
          name: 'Ядкова смес',
          calories: 170,
          protein: 6,
          carbs: 7,
          fats: 14,
          servingSize: '30г',
          category: 'Закуски',
          image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3'
        }
      ]
    };

    // Map Bulgarian meal types to English keys
    const mealTypeMap: { [key: string]: string } = {
      'закуска': 'breakfast',
      'обяд': 'lunch',
      'вечеря': 'dinner',
      'снаксове': 'snacks'
    };

    const key = mealTypeMap[mealType.toLowerCase()] || mealType.toLowerCase();
    return fallbackMeals[key] || fallbackMeals['breakfast'];
  };

  const checkIfMealEaten = (mealName: string, todaysMeals: MealData[]): boolean => {
    return todaysMeals.some(meal => 
      meal.name.toLowerCase() === mealName.toLowerCase()
    );
  };

  // Add this function to the DashboardScreen component
  const regenerateSingleMeal = async (
    mealType: string, 
    index: number,
    currentSuggestions: SuggestedMeal[]
  ) => {
    try {
      // Generate a single new meal suggestion
      const newMeal = await generateMealSuggestions(mealType, nutritionStats.targetCalories);
      
      if (newMeal && newMeal.length > 0) {
        // Create a copy of the current suggestions
        const updatedSuggestions = [...currentSuggestions];
        // Replace the meal at the specified index
        updatedSuggestions[index] = newMeal[0];
        
        // Update the appropriate state based on meal type
        switch (mealType.toLowerCase()) {
          case 'закуска':
          case 'breakfast':
            setBreakfastSuggestions(updatedSuggestions);
            break;
          case 'обяд':
          case 'lunch':
            setLunchSuggestions(updatedSuggestions);
            break;
          case 'вечеря':
          case 'dinner':
            setDinnerSuggestions(updatedSuggestions);
            break;
          case 'снаксове':
          case 'snacks':
            setSnackSuggestions(updatedSuggestions);
            break;
        }

        // Update AsyncStorage
        const dateKey = currentDate.toISOString().split('T')[0];
        const storedSuggestionsJson = await AsyncStorage.getItem('mealSuggestions');
        if (storedSuggestionsJson) {
          const storedSuggestions = JSON.parse(storedSuggestionsJson);
          storedSuggestions[mealTypeMap[mealType.toLowerCase()] || mealType.toLowerCase()] = updatedSuggestions;
          await AsyncStorage.setItem('mealSuggestions', JSON.stringify(storedSuggestions));
        }

        Toast.show({
          type: 'success',
          text1: 'Ястието е обновено',
          text2: 'Успешно обновихте препоръчаното ястие',
          position: 'top',
          visibilityTime: 2000,
          autoHide: true,
          topOffset: 50
        });
      }
    } catch (error) {
      console.error('Error regenerating single meal:', error);
      Toast.show({
        type: 'error',
        text1: 'Грешка при обновяване',
        text2: 'Неуспешно обновяване на ястието',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50
      });
    }
  };

  const MealTimeButton = ({ 
    icon, 
    title, 
    subtitle, 
    recommended, 
    todaysMeals,
    suggestedMeals 
  }: MealTimeButtonProps) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    // Update to get all meals for category
    const getMealsForCategory = (meals: MealData[], category: string) => {
      return meals.filter(meal => {
        // Get meal category from either type or mealType field
        const mealCategory = meal.type?.toLowerCase() || meal.mealType?.toLowerCase();
        if (!mealCategory) return false;
        
        const searchCategory = category.toLowerCase();
        
        // Map Bulgarian titles to English categories
        const categoryMap: { [key: string]: string } = {
          'закуска': 'breakfast',
          'обяд': 'lunch',
          'вечеря': 'dinner',
          'снаксове': 'snacks'
        };
        
        // Map English categories to Bulgarian titles
        const reverseCategoryMap: { [key: string]: string } = {
          'breakfast': 'закуска',
          'lunch': 'обяд',
          'dinner': 'вечеря',
          'snacks': 'снаксове'
        };
        
        // Also handle "основно" as a possible meal type
        const additionalMappings: { [key: string]: string[] } = {
          'закуска': ['breakfast', 'закуска'],
          'обяд': ['lunch', 'обяд', 'основно'],
          'вечеря': ['dinner', 'вечеря'],
          'снаксове': ['snacks', 'снаксове']
        };
        
        // Check if the meal category matches any of the possible values for this category
        return mealCategory === searchCategory.toLowerCase() || 
               mealCategory === categoryMap[searchCategory.toLowerCase()] ||
               mealCategory === reverseCategoryMap[searchCategory.toLowerCase()] ||
               (additionalMappings[searchCategory.toLowerCase()] && 
                additionalMappings[searchCategory.toLowerCase()].includes(mealCategory));
      });
    };

    const categoryMeals = getMealsForCategory(todaysMeals, title);

    const toggleSuggestions = () => {
      setShowSuggestions(!showSuggestions);
    };

    return (
      <View style={styles.mealTimeSection}>
        <TouchableOpacity 
          style={[
            styles.mealTimeButton,
            showSuggestions && styles.mealTimeButtonExpanded
          ]}
          onPress={toggleSuggestions}
        >
          <View style={styles.mealTimeContent}>
            <View style={styles.mealTimeLeft}>
              <View style={styles.mealIconContainer}>
                <Text style={styles.mealIcon}>{icon}</Text>
              </View>
              <View style={styles.mealTimeTexts}>
                <Text style={styles.mealTimeTitle}>{title}</Text>
                {categoryMeals.length > 0 ? (
                  <View>
                    {categoryMeals.map((meal, index) => (
                      <Text key={meal.id} style={[
                        styles.mealTimeSubtitle,
                        index > 0 && styles.additionalMeal
                      ]}>
                        {meal.name}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.mealTimeNoMeal}>Няма добавено хранене</Text>
                )}
                {recommended && (
                  <Text style={styles.mealTimeRecommended}>
                    <Ionicons name="flame-outline" size={12} color="#4CAF50" /> {recommended}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.expandIconContainer}>
              <Ionicons 
                name={showSuggestions ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#666666"
                style={[
                  styles.expandIcon,
                  showSuggestions && styles.expandIconRotated
                ]} 
              />
            </View>
          </View>
        </TouchableOpacity>

        {showSuggestions && suggestedMeals && suggestedMeals.length > 0 && (
          <View style={styles.suggestedMealsContainer}>
            {suggestedMeals.map((meal, index) => {
              const isEaten = checkIfMealEaten(meal.name, todaysMeals);
              return (
                <SuggestedMealItem 
                  key={`${meal.name}-${index}`} 
                  meal={meal} 
                  mealType={title}
                  eaten={isEaten}
                  onRegenerate={() => regenerateSingleMeal(title, index, suggestedMeals)}
                />
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const WaterTracker = ({ currentAmount, targetAmount, onAddWater }: WaterTrackerProps) => {
    const glassSize = targetAmount / 8;
    const filledGlasses = Math.floor(currentAmount / glassSize);
    const glasses = Array(8).fill(null);

    return (
      <View style={styles.waterTrackerContainer}>
        <View style={styles.waterHeader}>
          <View style={styles.waterTitleRow}>
            <Text style={styles.waterAmount}>{currentAmount.toFixed(2)} L</Text>
            <Text style={styles.waterTitle}>{translations.water}</Text>
          </View>
          <Text style={styles.waterTarget}>
            Цел: {targetAmount.toFixed(2)} L
          </Text>
        </View>
        <View style={styles.waterGlassesRow}>
          {glasses.map((_, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.waterGlass}
              onPress={() => onAddWater(index)}
            >
              <Text style={styles.glassEmoji}>
                {index < filledGlasses ? '🥤' : '🥛'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {currentAmount >= targetAmount && (
          <Text style={styles.waterGoalReached}>
            Достигнахте дневната си цел! 🎉
          </Text>
        )}
      </View>
    );
  };

  const handleAddWater = async (glassIndex: number) => {
    if (!user) return;

    const glassSize = (water || 2.5) / 8;
    const newAmount = (glassIndex + 1) * glassSize;

    try {
      const waterRef = collection(db, 'users', user.uid, 'waterIntake');
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        waterRef,
        where('timestamp', '>=', today),
        where('timestamp', '<', tomorrow)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'users', user.uid, 'waterIntake', docId), {
          amount: newAmount,
          timestamp: new Date()
        });
      } else {
        await addDoc(waterRef, {
          amount: newAmount,
          timestamp: new Date()
        });
      }

      // Update local state with the new water data
      setWaterIntake([{ amount: newAmount, timestamp: new Date() }]);

      // Check if water goal is achieved
      if (newAmount >= (water || 2.5)) {
        // Get today's achievements
        const achievementsRef = collection(db, 'users', user.uid, 'achievements');
        const achievementsQuery = query(
          achievementsRef,
          where('earnedDate', '>=', today),
          where('earnedDate', '<', tomorrow)
        );
        
        const achievementSnapshot = await getDocs(achievementsQuery);
        
        // Check if we already have a water achievement for today
        const hasWaterAchievement = achievementSnapshot.docs.some(
          doc => doc.data().id === 'daily_water'
        );
        
        if (!hasWaterAchievement) {
          // Add new achievement
          await addDoc(achievementsRef, {
            id: 'daily_water',
            title: 'Хидратация',
            description: 'Достигнахте дневната си цел за вода',
            icon: 'water',
            earned: true,
            earnedDate: new Date(),
            permanent: false
          });

          showMessage({
            message: 'Ново постижение!',
            description: 'Достигнахте дневната си цел за вода! 🎉',
            type: 'success',
            duration: 3000,
          });
        }
      }

      showMessage({
        message: 'Приемът на вода е актуализиран',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating water intake:', error);
      showMessage({
        message: 'Грешка при актуализиране на приема на вода',
        type: 'danger',
      });
    }
  };

  const CalorieCircle = ({ calories, totalCalories }: { calories: number; totalCalories: number }) => {
    // Calculate remaining calories and ensure it's not negative
    let remaining: number = Math.max(0, totalCalories - calories);
    
    // Format numbers to have no decimal places
    const formattedCalories = Math.round(calories);
    const formattedRemaining = Math.round(remaining);
    
    // Calculate percentages for macros with fixed precision
    const carbsPercent = Math.min(100, Math.round((nutritionStats.carbs / nutritionStats.targetCarbs) * 100));
    const proteinPercent = Math.min(100, Math.round((nutritionStats.protein / nutritionStats.targetProtein) * 100));
    const fatsPercent = Math.min(100, Math.round((nutritionStats.fats / nutritionStats.targetFats) * 100));
    
    return (
      <View style={styles.calorieCircleContainer}>
        <View style={styles.macroRow}>
          <View style={styles.macroCircle}>
            <Text style={styles.macroValue}>{formattedCalories}</Text>
            <Text style={styles.macroLabel}>приети</Text>
          </View>
          
          <View style={[styles.macroCircle, styles.mainCircle]}>
            <Text style={styles.remainingCalories}>{formattedRemaining}</Text>
            <Text style={styles.remainingLabel}>калории{'\n'}остават</Text>
          </View>
          
          <View style={styles.macroCircle}>
            <Text style={styles.macroValue}>0</Text>
            <Text style={styles.macroLabel}>изгорени</Text>
          </View>
        </View>
        
        <View style={styles.macroStatsRow}>
          <View style={styles.macroStat}>
            <Text style={styles.macroStatLabel}>Въглехидрати</Text>
            <View style={styles.macroStatValues}>
              <Text style={styles.macroStatValue}>
                {Math.round(nutritionStats.carbs)}/{Math.round(nutritionStats.targetCarbs)}g
              </Text>
              <Text style={styles.macroStatPercent}>{carbsPercent}%</Text>
            </View>
          </View>
          
          <View style={styles.macroStat}>
            <Text style={styles.macroStatLabel}>Протеини</Text>
            <View style={styles.macroStatValues}>
              <Text style={styles.macroStatValue}>
                {Math.round(nutritionStats.protein)}/{Math.round(nutritionStats.targetProtein)}g
              </Text>
              <Text style={styles.macroStatPercent}>{proteinPercent}%</Text>
            </View>
          </View>
          
          <View style={styles.macroStat}>
            <Text style={styles.macroStatLabel}>Мазнини</Text>
            <View style={styles.macroStatValues}>
              <Text style={styles.macroStatValue}>
                {Math.round(nutritionStats.fats)}/{Math.round(nutritionStats.targetFats)}g
              </Text>
              <Text style={styles.macroStatPercent}>{fatsPercent}%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const DateSelector: React.FC<DateSelectorProps> = ({ currentDate, onDateChange }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const navigation = useNavigation();

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('bg-BG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    };

    const goToDate = (days: number) => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + days);
      onDateChange(newDate);
    };

    return (
      <View style={styles.dateContainer}>
        <View style={styles.dateHeader}>
          <TouchableOpacity 
            style={styles.dateSelectorButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            <Text style={styles.dateText}>
              {currentDate.toDateString() === new Date().toDateString() 
                ? translations.today 
                : currentDate.toDateString() === new Date(Date.now() - 86400000).toDateString()
                ? translations.yesterday
                : formatDate(currentDate)
              }
            </Text>
            <Ionicons name="chevron-down-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('allRecipes')}
            >
              <Ionicons name="restaurant-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('savedMeals')}
            >
              <Ionicons name="bookmark-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleRegenerateMeals}
            >
              <Ionicons name="refresh-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <TouchableOpacity 
              style={styles.dateOption}
              onPress={() => {
                goToDate(0);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.dateOptionText}>{translations.today}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dateOption}
              onPress={() => {
                goToDate(-1);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.dateOptionText}>{translations.yesterday}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const TodaysMealsList = ({ meals, onDeleteMeal }: { 
    meals: MealData[]; 
    onDeleteMeal: (mealId: string) => void;
  }) => {
    const formatTime = (timestamp: any) => {
      if (!timestamp) return '';
      
      // Convert Firestore Timestamp to Date if needed
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      
      return date.toLocaleTimeString('bg-BG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    return (
      <View style={styles.todaysMealsContainer}>
        <Text style={styles.todaysMealsTitle}>{translations.todaysMeals}</Text>
        {meals.length > 0 ? (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealListItem}>
              <View style={styles.mealListItemLeft}>
                <Text style={styles.mealListItemName}>{meal.name}</Text>
                <Text style={styles.mealListItemMacros}>
                  {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                </Text>
                <Text style={styles.mealListItemTime}>
                  {formatTime(meal.timestamp)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.mealListItemDelete}
                onPress={() => onDeleteMeal(meal.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noMealsText}>Никакви хранения не са добавени днес.</Text>
        )}
      </View>
    );
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    Alert.alert(
      "Изтрийте хранене",
      "Сигурни ли сте, че желаете да изтриете това хранене за деня?",
      [
        {
          text: "Отказ",
          style: "cancel"
        },
        {
          text: "Изтрий",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
              showMessage({
                message: 'Meal deleted successfully',
                type: 'success',
              });
            } catch (error) {
              console.error('Error deleting meal:', error);
              showMessage({
                message: 'Error deleting meal',
                type: 'danger',
              });
            }
          }
        }
      ]
    );
  };

  // Add this new function inside DashboardScreen component
  const handleRegenerateMeals = async () => {
    try {
      if (!user) return;

      // Show loading toast
      Toast.show({
        type: 'success',
        text1: 'Обновяване на ястията',
        text2: 'Моля, изчакайте...',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50
      });

      const dateKey = currentDate.toISOString().split('T')[0];
      
      // Generate new suggestions
      const breakfast = await generateMealSuggestions('закуска', nutritionStats.targetCalories);
      const lunch = await generateMealSuggestions('обяд', nutritionStats.targetCalories);
      const dinner = await generateMealSuggestions('вечеря', nutritionStats.targetCalories);
      const snacks = await generateMealSuggestions('снаксове', nutritionStats.targetCalories);

      // Store the new suggestions
      const newSuggestions = {
        date: dateKey,
        breakfast,
        lunch,
        dinner,
        snacks,
      };

      // Store in AsyncStorage for offline access
      await AsyncStorage.setItem('mealSuggestions', JSON.stringify(newSuggestions));

      // Update state
      setBreakfastSuggestions(breakfast);
      setLunchSuggestions(lunch);
      setDinnerSuggestions(dinner);
      setSnackSuggestions(snacks);

      Toast.show({
        type: 'success',
        text1: 'Ястията са обновени',
        text2: 'Успешно обновихте препоръчаните ястия',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50
      });
    } catch (error) {
      console.error('Error regenerating meals:', error);
      
      // Show a more informative error message
      let errorMessage = 'Неуспешно обновяване на ястията';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Връзката към сървъра изтече. Проверете интернет връзката си.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Проблем с мрежата. Проверете интернет връзката си.';
        }
      }
      
      Toast.show({
        type: 'error',
        text1: 'Грешка при обновяване',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 50
      });
    }
  };

  // Update the navigation to planMeal
  const handlePlanMeal = () => {
    navigation.navigate('planMeal', { directLog: true }); // Add directLog parameter
  };

  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-[#f4f7fa]">
        <ActivityIndicator size="large" color="#00aaff" />
      </StyledView>
    );
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') {
              iconName = 'home-outline';
            } else if (route.name === 'Goals') {
              iconName = 'flag-outline';
            } else if (route.name === 'Inventory') {
              iconName = 'cube-outline';
            } else if (route.name === 'Recipes') {
              iconName = 'restaurant-outline';
            } else if (route.name === 'scan') {
              iconName = 'scan-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            }
            return <Ionicons name={iconName || 'home-outline'} size={24} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            height: 60,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          },
          tabBarShowLabel: false,
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          options={{ headerShown: false }}
        >{() => (
          <SafeAreaView style={styles.container}>
            <StyledImageBackground
              source={{
                uri: 'https://i.imgur.com/8F9ZGpX.png',
              }}
              style={styles.imageBackground}
              blurRadius={5}
            >
              <View style={styles.headerBackground}>
                <DateSelector currentDate={currentDate} onDateChange={setCurrentDate} />
              </View>
              <View style={styles.mainContainer}>
                <FlatList
                  data={[{ key: 'content' }]}
                  renderItem={() => (
                    <>
                      <CalorieCircle 
                        calories={nutritionStats.calories} 
                        totalCalories={nutritionStats.targetCalories} 
                      />
                      <WaterTracker 
                        currentAmount={waterIntake.length > 0 ? waterIntake[0].amount : 0} 
                        targetAmount={water || 2.5} 
                        onAddWater={handleAddWater}
                      />
                      <MealTimeButton
                        icon="🥐"
                        title={translations.breakfast}
                        subtitle={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'breakfast' || 
                          m.mealType?.toLowerCase() === 'breakfast'
                        )?.name}
                        calories={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'breakfast' || 
                          m.mealType?.toLowerCase() === 'breakfast'
                        )?.calories}
                        recommended={`${mealRecommendations.breakfast.min} - ${mealRecommendations.breakfast.max} kcal`}
                        todaysMeals={todaysMeals}
                        suggestedMeals={breakfastSuggestions}
                      />
                      <MealTimeButton
                        icon="🍴"
                        title={translations.lunch}
                        subtitle={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'lunch' || 
                          m.mealType?.toLowerCase() === 'lunch'
                        )?.name}
                        calories={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'lunch' || 
                          m.mealType?.toLowerCase() === 'lunch'
                        )?.calories}
                        recommended={`${mealRecommendations.lunch.min} - ${mealRecommendations.lunch.max} kcal`}
                        todaysMeals={todaysMeals}
                        suggestedMeals={lunchSuggestions}
                      />
                      <MealTimeButton
                        icon="🍽️"
                        title={translations.dinner}
                        subtitle={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'dinner' || 
                          m.mealType?.toLowerCase() === 'dinner'
                        )?.name}
                        calories={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'dinner' || 
                          m.mealType?.toLowerCase() === 'dinner'
                        )?.calories}
                        recommended={`${mealRecommendations.dinner.min} - ${mealRecommendations.dinner.max} kcal`}
                        todaysMeals={todaysMeals}
                        suggestedMeals={dinnerSuggestions}
                      />
                      <MealTimeButton
                        icon="🍪"
                        title={translations.snacks}
                        subtitle={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'snacks' || 
                          m.mealType?.toLowerCase() === 'snacks'
                        )?.name}
                        calories={todaysMeals.find(m => 
                          m.type?.toLowerCase() === 'snacks' || 
                          m.mealType?.toLowerCase() === 'snacks'
                        )?.calories}
                        recommended={`${mealRecommendations.snacks.min} - ${mealRecommendations.snacks.max} kcal`}
                        todaysMeals={todaysMeals}
                        suggestedMeals={snackSuggestions}
                      />
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={handlePlanMeal}
                        >
                          <Ionicons name="restaurant-outline" size={24} color="#ffffff" />
                          <Text style={styles.actionButtonText}>Отчетете хранене</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => navigation.navigate('trackWeight')}
                        >
                          <Ionicons name="scale-outline" size={24} color="#ffffff" />
                          <Text style={styles.actionButtonText}>Запишете тегло</Text>
                        </TouchableOpacity>
                      </View>
                      <TodaysMealsList 
                        meals={todaysMeals} 
                        onDeleteMeal={handleDeleteMeal}
                      />
                      <WeightProgressCard weightHistory={weightHistory} />
                      <AchievementsCard achievements={achievements} />
                      <View style={styles.logoutContainer}>
                        <SkippedMealNotificationToggle 
                          isNotificationEnabled={isNotificationEnabled}
                          setIsNotificationEnabled={setIsNotificationEnabled}
                        />
                        <TouchableOpacity
                          onPress={handleLogout}
                          style={styles.logoutButton}
                        >
                          <Text style={styles.logoutText}>Отпишете се</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                  keyExtractor={() => 'content'}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </StyledImageBackground>
          </SafeAreaView>
        )}</Tab.Screen>
        <Tab.Screen name="Goals" component={GoalsScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Recipes" component={RecipesScreen} options={{ headerShown: false }} />
        <Tab.Screen name="scan" component={ScanScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Profile" component={EditProfileScreen} options={{ headerShown: false }} />
      </Tab.Navigator>

      {showMissedMealAlert && missedMealType && (
        <MissedMealAlert
          mealType={missedMealType}
          onLogMeal={handleLogMissedMeal}
          onSkipMeal={handleSkipMissedMeal}
          onClose={handleCloseMissedMealAlert}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerBackground: {
    backgroundColor: '#000000',
    paddingBottom: 15,
    paddingTop: 10, // Add some padding at the top
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.9,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  cardList: {
    marginTop: 20,
  },
  cardContainer: {
    backgroundColor: '#000000',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  bmiCard: {
    backgroundColor: '#e3f2fd',
  },
  waterCard: {
    backgroundColor: '#e3f2fd',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  bmiDescription: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  waterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  waterDescription: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  logoutContainer: {
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-end',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e74c3c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#e3f2fd',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginTop: 8,
    textAlign: 'center',
  },
  weightCard: {
    backgroundColor: '#000000',
  },
  weightValue: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  mealsCard: {
    backgroundColor: '#000000',
  },
  mealItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mealTime: {
    fontSize: 14,
    color: '#999999',
  },
  mealMacros: {
    fontSize: 14,
    color: '#999999',
  },
  noMealsText: {
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  achievementsCard: {
    backgroundColor: '#000000',
  },
  achievementItem: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    marginVertical: 5,
    minWidth: 200,
  },
  achievementLocked: {
    opacity: 0.5,
    backgroundColor: '#333333',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: theme.colors.text,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  mealNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  achievementDate: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  mealTimeButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#333333',
  },
  mealTimeButtonExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#333333',
  },
  mealTimeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealTimeTexts: {
    flex: 1,
  },
  mealTimeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealTimeSubtitle: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 2,
  },
  mealTimeNoMeal: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  mealTimeRecommended: {
    color: '#666666',
    fontSize: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    opacity: 0.7,
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  suggestedMealsContainer: {
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 5,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#333333',
  },
  suggestedMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
    position: 'absolute',
    left: -20,
  },
  suggestedMealContent: {
    flex: 1,
  },
  suggestedMealName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  suggestedMealDetails: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  suggestedMealImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    marginRight: 12,
    resizeMode: 'cover' // Add this to ensure the image fills the container
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regenerateButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    marginLeft: 10,
  },
  suggestedMealItemEaten: {
    opacity: 0.7,
  },
  
  suggestedMealImageEaten: {
    opacity: 0.6,
  },
  
  suggestedMealNameEaten: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  
  suggestedMealNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  eatenIcon: {
    marginRight: 4,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  alertButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertButtonTextSecondary: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  alertCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  devModeButton: {
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
  },
  devModeText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  notificationToggleButton: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#333333',
  },
  notificationToggleEnabled: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  notificationToggleDisabled: {
    backgroundColor: '#1A1A1A',
    borderColor: '#4CAF50',
  },
  notificationToggleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    marginRight: 10,
  },
  waterTrackerContainer: {
    padding: 10,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  waterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
  },
  waterTarget: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  waterGlassesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  waterGlass: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassEmoji: {
    fontSize: 24,
  },
  waterGoalReached: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
  },
  calorieCircleContainer: {
    backgroundColor: '#000000',
    padding: 15,
    marginTop: 10,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  macroCircle: {
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.2,
  },
  mainCircle: {
    width: Dimensions.get('window').width * 0.25,
    height: Dimensions.get('window').width * 0.25,
    borderRadius: (Dimensions.get('window').width * 0.25) / 2,
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  macroValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  remainingCalories: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  remainingLabel: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  macroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  macroStat: {
    flex: 1,
    alignItems: 'center',
  },
  macroStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  macroStatValues: {
    alignItems: 'center',
  },
  macroStatValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  macroStatPercent: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  dateContainer: {
    paddingHorizontal: 15,
  },
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 10,
    textTransform: 'capitalize',
  },
  datePickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 15,
    right: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dateOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  todaysMealsContainer: {
    backgroundColor: '#000000',
    padding: 20,
    marginTop: 10,
    borderRadius: 10,
  },
  todaysMealsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  mealListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  mealListItemLeft: {
    flex: 1,
  },
  mealListItemName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  mealListItemMacros: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  mealListItemTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  mealListItemDelete: {
    padding: 8,
  },
  noDataText: {
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mealTimeSection: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  suggestedMealsContainer: {
    marginLeft: 40,
    marginTop: 10,
  },
  suggestedMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingRight: 10,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
    position: 'absolute',
    left: -20,
  },
  suggestedMealContent: {
    flex: 1,
  },
  suggestedMealName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  suggestedMealDetails: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  suggestedMealImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    marginRight: 12,
    resizeMode: 'cover' // Add this to ensure the image fills the container
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regenerateButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    marginLeft: 10,
  },
  suggestedMealItemEaten: {
    opacity: 0.7,
  },
  
  suggestedMealImageEaten: {
    opacity: 0.6,
  },
  
  suggestedMealNameEaten: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  
  suggestedMealNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  eatenIcon: {
    marginRight: 4,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  alertButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertButtonTextSecondary: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  alertCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  devModeButton: {
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
  },
  devModeText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  notificationToggleButton: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#333333',
  },
  notificationToggleEnabled: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  notificationToggleDisabled: {
    backgroundColor: '#1A1A1A',
    borderColor: '#4CAF50',
  },
  notificationToggleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  additionalMeal: {
    marginTop: 4,
    opacity: 0.8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  
  regenerateMealButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    marginLeft: 8,
  },
  
  regeneratingButton: {
    opacity: 0.5,
  },
});

export default DashboardScreen;

import React, { useState, useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, Image, StyleSheet, Alert, Animated, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where, orderBy, limit, deleteDoc, updateDoc, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { styled } from 'nativewind';
import GoalsScreen from './goals';
import InventoryScreen from './inventory';
import RecipesScreen from './recipes';
import ScanScreen from './scan';
import { Text, TouchableOpacity, ImageBackground, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NutritionCard from '../components/NutritionCard';
import AddMealButton from '../components/AddMealButton';
import AddMealScreen from '../(tabs)/addMeal';
import ExpoCamera from '../(tabs)/scan'
import { LineChart } from 'react-native-chart-kit';
import { showMessage } from 'react-native-flash-message';
import { NavigationProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { fetchRandomMeals } from '../services/mealService';

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
  calories: number;
  servingSize: string;
  image: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  category?: string;
  instructions?: string;
  ingredients?: any[];
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
  planMeal: { meal?: PlannedMeal };
  trackWeight: undefined;
  goalsSelect: undefined;
  mealDetail: { meal: SuggestedMeal };
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
    targetCarbs: 250,
    targetFats: 70,
  });
  const [todaysMeals, setTodaysMeals] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
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
  const [waterIntake, setWaterIntake] = useState(0);
  const [breakfastSuggestions, setBreakfastSuggestions] = useState<SuggestedMeal[]>([]);
  const [lunchSuggestions, setLunchSuggestions] = useState<SuggestedMeal[]>([]);
  const [dinnerSuggestions, setDinnerSuggestions] = useState<SuggestedMeal[]>([]);
  const [snackSuggestions, setSnackSuggestions] = useState<SuggestedMeal[]>([]);

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
      
      const meals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      meals.forEach((meal) => {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFats += meal.fats || 0;
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
        setWaterIntake(waterData.amount || 0);
      } else {
        setWaterIntake(0);
      }
    });

    return () => unsubscribe();
  }, [currentDate]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const breakfast = await generateMealSuggestions('breakfast', nutritionStats.targetCalories);
        const lunch = await generateMealSuggestions('lunch', nutritionStats.targetCalories);
        const dinner = await generateMealSuggestions('dinner', nutritionStats.targetCalories);
        const snacks = await generateMealSuggestions('snacks', nutritionStats.targetCalories);

        console.log('Fetched suggestions:', { breakfast, lunch, dinner, snacks }); // Debug log

        setBreakfastSuggestions(breakfast);
        setLunchSuggestions(lunch);
        setDinnerSuggestions(dinner);
        setSnackSuggestions(snacks);
      } catch (error) {
        console.error('Error fetching meal suggestions:', error);
      }
    };

    fetchSuggestions();
  }, [nutritionStats.targetCalories]);

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
    navigation.navigate('addMeal'); // You'll need to create this screen
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

  const PlannedMealsCard = ({ meals }: { meals: PlannedMeal[] }) => {
    const navigation = useNavigation();
    const user = auth.currentUser;
    
    const handleDeleteMeal = async (mealId: string) => {
      if (!user) return;

      Alert.alert(
        "Изтриване на планирано ястие",
        "Сигурни ли сте, че искате да изтриете това ястие?",
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
                await deleteDoc(doc(db, 'users', user.uid, 'plannedMeals', mealId));
                showMessage({
                  message: 'Ястието беше изтрито успешно',
                  type: 'success',
                });
              } catch (error) {
                console.error('Error deleting meal:', error);
                showMessage({
                  message: 'Грешка при изтриване на ястието',
                  type: 'danger',
                });
              }
            }
          }
        ]
      );
    };

    const handleEditMeal = (meal: PlannedMeal) => {
      navigation.navigate('planMeal', { meal });
    };

    const handleCompleteMeal = async (meal: PlannedMeal) => {
      if (!user || animatingMeals.includes(meal.id)) return;

      try {
        setAnimatingMeals(prev => [...prev, meal.id]);

        // Start fade out animation
        Animated.timing(meal.fadeAnim!, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(async () => {
          // After animation completes, update the database
          await updateDoc(doc(db, 'users', user.uid, 'plannedMeals', meal.id), {
            status: 'completed'
          });

          // Add to today's meals
          await addDoc(collection(db, 'users', user.uid, 'meals'), {
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            timestamp: new Date(),
            source: 'planned_meal',
            originalMealId: meal.id
          });

          showMessage({
            message: 'Ястието е отбелязано като изядено',
            type: 'success',
          });

          setAnimatingMeals(prev => prev.filter(id => id !== meal.id));
        });
      } catch (error) {
        console.error('Error completing meal:', error);
        showMessage({
          message: 'Грешка при отбелязване на ястието',
          type: 'danger',
        });
        setAnimatingMeals(prev => prev.filter(id => id !== meal.id));
      }
    };

    return (
      <View style={[styles.cardContainer, styles.mealsCard]}>
        <Text style={styles.cardTitle}>Планирани ястия</Text>
        {meals.filter(meal => meal.status !== 'completed').length > 0 ? (
          <FlatList
            data={meals.filter(meal => meal.status !== 'completed')}
            renderItem={({ item }) => (
              <Animated.View 
                style={[
                  styles.mealItem,
                  { opacity: item.fadeAnim }
                ]}
              >
                <View style={styles.mealHeader}>
                  <TouchableOpacity 
                    style={styles.mealTitleRow}
                    onPress={() => handleCompleteMeal(item)}
                  >
                    <Ionicons 
                      name="checkmark-circle-outline"
                      size={24} 
                      color="#bdbdbd"
                      style={styles.checkIcon}
                    />
                    <Text style={styles.mealName}>{item.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.mealActions}>
                    <TouchableOpacity 
                      onPress={() => handleEditMeal(item)}
                      style={styles.actionIcon}
                    >
                      <Ionicons name="pencil" size={20} color="#1e88e5" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteMeal(item.id)}
                      style={styles.actionIcon}
                    >
                      <Ionicons name="trash" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.mealTime}>
                  {item.plannedFor instanceof Date ? 
                    item.plannedFor.toLocaleDateString('bg-BG', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'long'
                    }) : 'Invalid date'}
                </Text>
                <Text style={styles.mealMacros}>
                  {item.calories} kcal | П: {item.protein}g | В: {item.carbs}g | М: {item.fats}g
                </Text>
              </Animated.View>
            )}
            keyExtractor={item => item.id}
          />
        ) : (
          <Text style={styles.noMealsText}>Няма планирани ястия</Text>
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

  const generateMealSuggestions = async (mealType: string, targetCalories: number): Promise<SuggestedMeal[]> => {
    try {
      // Get random meals from the API
      const meals = await fetchRandomMeals(10);
      
      // Filter meals based on meal type and calories
      const filteredMeals = meals.filter(meal => {
        const mealTypeMap: { [key: string]: string } = {
          'breakfast': 'закуска',
          'lunch': 'обяд',
          'dinner': 'обяд', // We'll use the same meals for lunch and dinner
          'snacks': 'снакс'
        };
        
        const targetType = mealTypeMap[mealType.toLowerCase()];
        const isCorrectType = meal.category === targetType || meal.mealType === targetType;
        const isWithinCalories = meal.calories <= targetCalories * 1.2; // Allow some flexibility
        
        return isCorrectType && isWithinCalories;
      });

      return filteredMeals.slice(0, 3).map(meal => ({
        name: meal.name,
        calories: meal.calories,
        servingSize: '1 serving',
        image: meal.image,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        category: meal.category,
        instructions: meal.instructions,
        ingredients: meal.ingredients
      }));
    } catch (error) {
      console.error('Error generating meal suggestions:', error);
      return [];
    }
  };

  const MealTimeButton = ({ 
    icon, 
    title, 
    subtitle, 
    calories, 
    recommended, 
    todaysMeals,
    suggestedMeals 
  }: MealTimeButtonProps) => {
    const navigation = useNavigation();
    
    const mealTypeMap = {
      [translations.breakfast]: 'breakfast',
      [translations.lunch]: 'lunch',
      [translations.dinner]: 'dinner',
      [translations.snacks]: 'snacks'
    };

    const handlePress = () => {
      navigation.navigate('mealDetail', {
        meal: suggestedMeals && suggestedMeals[0],
        mealType: mealTypeMap[title]
      });
    };

    return (
      <View style={styles.mealTimeSection}>
        <TouchableOpacity 
          style={styles.mealTimeButton}
          onPress={handlePress}
        >
          <View style={styles.mealTimeContent}>
            <View style={styles.mealTimeLeft}>
              <Text style={styles.mealIcon}>{icon}</Text>
              <View style={styles.mealTimeTexts}>
                <Text style={styles.mealTimeTitle}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.mealTimeSubtitle}>{subtitle}</Text>
                ) : (
                  <Text style={styles.mealTimeRecommended}>
                    {translations.recommended}: {recommended}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.mealTimeRight}>
              {calories && <Text style={styles.mealTimeCalories}>{calories} kcal</Text>}
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handlePress}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {Array.isArray(suggestedMeals) && suggestedMeals.length > 0 && (
          <View style={styles.suggestedMealsContainer}>
            {suggestedMeals.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={handlePress}
              >
                <View style={styles.suggestedMealItem}>
                  <View style={styles.bulletPoint} />
                  <Image 
                    source={{ uri: suggestion.image }}
                    style={styles.suggestedMealImage}
                    onError={(e) => {
                      console.log('Image error for:', {
                        name: suggestion.name,
                        image: suggestion.image,
                        error: e.nativeEvent.error
                      });
                    }}
                  />
                  <View style={styles.suggestedMealContent}>
                    <Text style={styles.suggestedMealName}>{suggestion.name}</Text>
                    <Text style={styles.suggestedMealDetails}>
                      {suggestion.servingSize} • {suggestion.calories} kcal
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    let remaining: number = totalCalories - calories;
    if (remaining <= 0) {
      remaining = 0;
    }
    
    // Calculate percentages for macros
    const carbsPercent = Math.round((nutritionStats.carbs / nutritionStats.targetCarbs) * 100);
    const proteinPercent = Math.round((nutritionStats.protein / nutritionStats.targetProtein) * 100);
    const fatsPercent = Math.round((nutritionStats.fats / nutritionStats.targetFats) * 100);
    
    return (
      <View style={styles.calorieCircleContainer}>
        <View style={styles.macroRow}>
          <View style={styles.macroCircle}>
            <Text style={styles.macroValue}>{calories}</Text>
            <Text style={styles.macroLabel}>приети</Text>
          </View>
          
          <View style={[styles.macroCircle, styles.mainCircle]}>
            <Text style={styles.remainingCalories}>{remaining}</Text>
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
              <Text style={styles.macroStatValue}>{nutritionStats.carbs}/{nutritionStats.targetCarbs}g</Text>
              <Text style={styles.macroStatPercent}>{carbsPercent}%</Text>
            </View>
          </View>
          
          <View style={styles.macroStat}>
            <Text style={styles.macroStatLabel}>Протеини</Text>
            <View style={styles.macroStatValues}>
              <Text style={styles.macroStatValue}>{nutritionStats.protein}/{nutritionStats.targetProtein}g</Text>
              <Text style={styles.macroStatPercent}>{proteinPercent}%</Text>
            </View>
          </View>
          
          <View style={styles.macroStat}>
            <Text style={styles.macroStatLabel}>Мазнини</Text>
            <View style={styles.macroStatValues}>
              <Text style={styles.macroStatValue}>{nutritionStats.fats}/{nutritionStats.targetFats}g</Text>
              <Text style={styles.macroStatPercent}>{fatsPercent}%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const DateSelector: React.FC<DateSelectorProps> = ({ currentDate, onDateChange }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

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
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
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

  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-[#f4f7fa]">
        <ActivityIndicator size="large" color="#00aaff" />
      </StyledView>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'home-outline';
          } else if (route.name === 'Goals') {
            iconName = 'flag-outline';
          } else if (route.name === 'Inventory') {
            iconName = 'cart-outline';
          } else if (route.name === 'Recipes') {
            iconName = 'restaurant-outline';
          } else if (route.name === 'scan') {
            iconName = 'scan-outline';
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
      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>
        {() => (
          <StyledView style={styles.container}>
            <StyledImageBackground
              source={{
                uri: 'https://i.imgur.com/8F9ZGpX.png',
              }}
              style={styles.imageBackground}
              blurRadius={5}
            >
              <View style={styles.headerBackground}>
                <View style={styles.headerContainer}>
                  <StyledText style={styles.welcomeText}>
                    Добре дошли, {user?.email || 'User'}!
                  </StyledText>
                  <TouchableOpacity onPress={() => navigation.navigate('editProfile')}>
                    <Image
                      source={{
                        uri: profileImage ||
                          'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg',
                      }}
                      style={styles.profileImage}
                    />
                  </TouchableOpacity>
                </View>
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
                        currentAmount={waterIntake} 
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
                          onPress={() => navigation.navigate('planMeal')}
                        >
                          <Ionicons name="calendar-outline" size={24} color="#ffffff" />
                          <Text style={styles.actionButtonText}>Планирайте ястие</Text>
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
                      <PlannedMealsCard meals={plannedMeals} />
                      <AchievementsCard achievements={achievements} />
                      <View style={styles.logoutContainer}>
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
          </StyledView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="scan" component={ExpoCamera} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerBackground: {
    backgroundColor: '#000000',
    paddingBottom: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 15,
    backgroundColor: '#000000',
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
    backgroundColor: theme.colors.surface,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 15,
    padding: 20,
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
  mealIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  mealTimeTexts: {
    flex: 1,
  },
  mealTimeTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  mealTimeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  mealTimeRecommended: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  mealTimeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTimeCalories: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  moreButton: {
    padding: 5,
  },
  addButton: {
    padding: 10,
  },
  mealOptions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealOptionButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#b0bec5',
    borderRadius: 8,
    marginBottom: 10,
  },
  mealOptionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
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
    marginTop: 15,
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
});

export default DashboardScreen;

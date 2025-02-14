import React, { useState, useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, Image, StyleSheet, Alert, Animated } from 'react-native';
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

const auth = getAuth();
const db = getFirestore();
const Tab = createBottomTabNavigator();

const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImageBackground = styled(ImageBackground);

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
  weight: string;
  height: string;
  gender: string;
  dateOfBirth: any; // Firebase Timestamp
  goal: string;
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
  const weight = parseFloat(userData.weight);
  const height = parseFloat(userData.height);
  const age = calculateAge(userData.dateOfBirth);
  const isMale = userData.gender.toLowerCase() === 'male';

  // Calculate BMR using Harris-Benedict equation
  let bmr;
  if (isMale) {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Activity factor (using moderate activity as default)
  const activityFactor = 1.55;
  let maintenanceCalories = bmr * activityFactor;

  // Adjust calories based on goal
  let targetCalories;
  switch (userData.goal.toLowerCase()) {
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

const DashboardScreen: React.FC<DashboardProps> = ({ onLogout }) => {
  const navigation = useNavigation();
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

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) {
      console.log("User not logged in");
      return;
    }

    setLoading(true); // Set loading state at start

    const userDocRef = doc(db, 'users', user.uid);
    
    // Create real-time listener for user data
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
        } else {
          console.log('User document does not exist in the "users" collection.');
        }
      } catch (err) {
        console.error('Error processing user data:', err);
      } finally {
        setLoading(false); // Set loading to false after processing
      }
    }, (error) => {
      console.error('Error listening to user data:', error);
      setLoading(false); // Set loading to false on error
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigation]); // Only depend on navigation

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
        // Add more achievements here
      ];

      // Check each achievement
      const updatedAchievements = await Promise.all(newAchievements.map(async (achievement) => {
        const existingAchievement = existingAchievements.get(achievement.id);
        
        // If achievement was already earned and is permanent, keep it earned
        if (existingAchievement?.earned && achievement.permanent) {
          return {
            ...achievement,
            earned: true,
            earnedDate: existingAchievement.earnedDate
          };
        }

        // Check if achievement should be earned
        let shouldBeEarned = false;
        switch (achievement.id) {
          case 'first_meal':
            shouldBeEarned = meals.length > 0;
            break;
          case 'weight_goal':
            if (userData?.weight && userData?.goal) {
              const currentWeight = parseFloat(userData.weight);
              const targetWeight = parseFloat(userData.targetWeight || '0');
              
              if (userData.goal === 'Lose Weight') {
                shouldBeEarned = currentWeight <= targetWeight;
              } else if (userData.goal === 'Gain Weight') {
                shouldBeEarned = currentWeight >= targetWeight;
              }
            }
            break;
        }

        // If achievement should be earned and wasn't earned before
        if (shouldBeEarned && !existingAchievement?.earned) {
          const achievementData = {
            ...achievement,
            earned: true,
            earnedDate: Timestamp.fromDate(new Date())
          };

          // Store in Firestore
          if (existingAchievement?.dbId) {
            await updateDoc(doc(db, 'users', user.uid, 'achievements', existingAchievement.dbId), achievementData);
          } else {
            await addDoc(collection(db, 'users', user.uid, 'achievements'), achievementData);
          }

          showMessage({
            message: 'Ново постижение!',
            description: achievement.title,
            type: 'success',
            duration: 3000,
          });

          return achievementData;
        }

        return existingAchievement || achievement;
      }));

      return updatedAchievements;
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
              backgroundColor: '#e3f2fd',
              backgroundGradientFrom: '#e3f2fd',
              backgroundGradientTo: '#e3f2fd',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        ) : (
          <Text style={styles.weightValue}>Няма налични данни</Text>
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
                  Постигнато на: {item.earnedDate.toDate().toLocaleDateString('bg-BG')}
                </Text>
              )}
            </View>
          )}
          keyExtractor={item => item.id}
        />
      </View>
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
          size = focused ? 36 : 24;
          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Goals') {
            iconName = 'flag';
          } else if (route.name === 'Inventory') {
            iconName = 'cart';
          } else if (route.name === 'Recipes') {
            iconName = 'restaurant';
          } else if (route.name === 'scan') {
            iconName = 'scan';
          }

          return <Ionicons name={iconName || 'home'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00aaff',
        tabBarInactiveTintColor: '#b0bec5',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 65,
          paddingBottom: 14,
          paddingTop: 6,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
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
                uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
              }}
              style={styles.imageBackground}
              blurRadius={20}
            >
              <StyledView style={styles.headerContainer}>
                <StyledText style={styles.welcomeText}>
                  Добре дошли, {user?.email || 'User'}!
                </StyledText>
                <TouchableOpacity onPress={() => navigation.navigate('editProfile')}>
                  <Image
                    source={{
                      uri:
                        profileImage ||
                        'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg',
                    }}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </StyledView>
              <AddMealButton onPress={handleAddMeal} />
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
              <FlatList
                data={dashboardData}
                renderItem={renderCard}
                keyExtractor={(item) => item.id}
                style={styles.cardList}
                ListHeaderComponent={
                  <>
                    <NutritionCard 
                      stats={nutritionStats}
                      meals={todaysMeals}
                    />
                    <WeightProgressCard weightHistory={weightHistory} />
                    <PlannedMealsCard meals={plannedMeals} />
                    <AchievementsCard achievements={achievements} />
                  </>
                }
              />
              <View style={styles.logoutContainer}>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.logoutButton}
                >
                <Text style={styles.logoutText}>Отпишете се</Text>
                </TouchableOpacity>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardList: {
    marginTop: 20,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#2c3e50',
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
    backgroundColor: '#e74c3c',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
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
    backgroundColor: '#e3f2fd',
  },
  weightValue: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  mealsCard: {
    backgroundColor: '#e3f2fd',
  },
  mealItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#b0bec5',
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
    padding: 5,
    marginLeft: 10,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  mealTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  mealMacros: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  noMealsText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  achievementsCard: {
    backgroundColor: '#e3f2fd',
  },
  achievementItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#b0bec5',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    backgroundColor: '#1e88e5',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
});

export default DashboardScreen;

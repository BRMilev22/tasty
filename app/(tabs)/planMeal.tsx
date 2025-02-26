import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ImageBackground, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledImageBackground = styled(ImageBackground);

const db = getFirestore();
const auth = getAuth();

// Define the FoodGroup type first
type Portion = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type FoodGroup = {
  name: string;
  icon: string;
  basePortions: {
    small: Portion;
    medium: Portion;
    large: Portion;
  };
};

// Add these type definitions after the FoodGroup type
type PortionSize = 'small' | 'medium' | 'large';
type MealType = keyof typeof averageMeals;

// First, let's add a type and constant for our categories
type MealCategory = 'ЗАКУСКИ' | 'ОБЯД' | 'ВЕЧЕРЯ' | 'БЪРЗО ХРАНЕНЕ' | 'СНАКСОВЕ';

const mealCategories: { [key: string]: MealCategory } = {
  // ЗАКУСКИ
  breakfast_pastry: 'ЗАКУСКИ',
  breakfast_banitsa: 'ЗАКУСКИ',
  breakfast_sandwich: 'ЗАКУСКИ',
  breakfast_eggs: 'ЗАКУСКИ',
  breakfast_musli: 'ЗАКУСКИ',
  breakfast_pancakes: 'ЗАКУСКИ',
  
  // ОБЯД
  lunch_soup: 'ОБЯД',
  lunch_grill: 'ОБЯД',
  lunch_stew: 'ОБЯД',
  lunch_rice_dish: 'ОБЯД',
  lunch_pasta: 'ОБЯД',
  lunch_sarmi: 'ОБЯД',
  lunch_moussaka: 'ОБЯД',
  
  // ВЕЧЕРЯ
  dinner_grill: 'ВЕЧЕРЯ',
  dinner_chicken: 'ВЕЧЕРЯ',
  dinner_pork: 'ВЕЧЕРЯ',
  dinner_fish: 'ВЕЧЕРЯ',
  dinner_salad: 'ВЕЧЕРЯ',
  dinner_eggs: 'ВЕЧЕРЯ',
  dinner_vegetables: 'ВЕЧЕРЯ',
  
  // БЪРЗО ХРАНЕНЕ
  fastfood_kebab: 'БЪРЗО ХРАНЕНЕ',
  fastfood_burger: 'БЪРЗО ХРАНЕНЕ',
  fastfood_pizza: 'БЪРЗО ХРАНЕНЕ',
  fastfood_hotdog: 'БЪРЗО ХРАНЕНЕ',
  fastfood_fries: 'БЪРЗО ХРАНЕНЕ',
  fastfood_gyros: 'БЪРЗО ХРАНЕНЕ',
  fastfood_shawarma: 'БЪРЗО ХРАНЕНЕ',
  
  // СНАКСОВЕ
  snack_fruit: 'СНАКСОВЕ',
  snack_nuts: 'СНАКСОВЕ',
  snack_sweets: 'СНАКСОВЕ',
  snack_yogurt: 'СНАКСОВЕ',
  snack_chocolate: 'СНАКСОВЕ',
  snack_icecream: 'СНАКСОВЕ',
  snack_chips: 'СНАКСОВЕ',
  snack_popcorn: 'СНАКСОВЕ',
  snack_crackers: 'СНАКСОВЕ',
  snack_pretzel: 'СНАКСОВЕ',
  snack_croissant: 'СНАКСОВЕ',
};

// Add this type for collapsible state
type CollapsibleState = { [key in MealCategory]: boolean };

const averageMeals: { [key: string]: FoodGroup } = {
  // ЗАКУСКИ
  breakfast_pastry: {
    name: 'Тестени закуски',
    icon: '🥨',
    basePortions: {
      small: { calories: 250, protein: 8, carbs: 40, fats: 8 },
      medium: { calories: 350, protein: 12, carbs: 55, fats: 12 },
      large: { calories: 450, protein: 15, carbs: 70, fats: 16 }
    }
  },
  breakfast_banitsa: {
    name: 'Баница',
    icon: '🥟',
    basePortions: {
      small: { calories: 300, protein: 10, carbs: 35, fats: 15 },
      medium: { calories: 450, protein: 15, carbs: 50, fats: 22 },
      large: { calories: 600, protein: 20, carbs: 65, fats: 30 }
    }
  },
  breakfast_sandwich: {
    name: 'Сандвич',
    icon: '🥪',
    basePortions: {
      small: { calories: 250, protein: 12, carbs: 30, fats: 10 },
      medium: { calories: 400, protein: 18, carbs: 45, fats: 15 },
      large: { calories: 550, protein: 25, carbs: 60, fats: 20 }
    }
  },
  breakfast_eggs: {
    name: 'Яйца',
    icon: '🍳',
    basePortions: {
      small: { calories: 150, protein: 12, carbs: 1, fats: 10 },
      medium: { calories: 300, protein: 24, carbs: 2, fats: 20 },
      large: { calories: 450, protein: 36, carbs: 3, fats: 30 }
    }
  },
  breakfast_musli: {
    name: 'Мюсли',
    icon: '🥣',
    basePortions: {
      small: { calories: 200, protein: 6, carbs: 35, fats: 5 },
      medium: { calories: 300, protein: 9, carbs: 52, fats: 8 },
      large: { calories: 400, protein: 12, carbs: 70, fats: 10 }
    }
  },
  breakfast_pancakes: {
    name: 'Палачинки',
    icon: '🥞',
    basePortions: {
      small: { calories: 250, protein: 8, carbs: 40, fats: 8 },
      medium: { calories: 375, protein: 12, carbs: 60, fats: 12 },
      large: { calories: 500, protein: 16, carbs: 80, fats: 16 }
    }
  },

  // ОБЯД
  lunch_soup: {
    name: 'Супа',
    icon: '🥣',
    basePortions: {
      small: { calories: 150, protein: 8, carbs: 20, fats: 5 },
      medium: { calories: 250, protein: 12, carbs: 30, fats: 8 },
      large: { calories: 350, protein: 16, carbs: 40, fats: 12 }
    }
  },
  lunch_grill: {
    name: 'Скара',
    icon: '🍖',
    basePortions: {
      small: { calories: 400, protein: 35, carbs: 5, fats: 25 },
      medium: { calories: 600, protein: 50, carbs: 8, fats: 35 },
      large: { calories: 800, protein: 65, carbs: 10, fats: 45 }
    }
  },
  lunch_stew: {
    name: 'Готвено',
    icon: '🥘',
    basePortions: {
      small: { calories: 350, protein: 20, carbs: 35, fats: 15 },
      medium: { calories: 500, protein: 30, carbs: 50, fats: 22 },
      large: { calories: 650, protein: 40, carbs: 65, fats: 30 }
    }
  },
  lunch_rice_dish: {
    name: 'Ястие с ориз',
    icon: '🍚',
    basePortions: {
      small: { calories: 350, protein: 15, carbs: 55, fats: 10 },
      medium: { calories: 500, protein: 22, carbs: 75, fats: 15 },
      large: { calories: 650, protein: 30, carbs: 95, fats: 20 }
    }
  },
  lunch_pasta: {
    name: 'Паста',
    icon: '🍝',
    basePortions: {
      small: { calories: 350, protein: 12, carbs: 65, fats: 8 },
      medium: { calories: 500, protein: 16, carbs: 90, fats: 12 },
      large: { calories: 650, protein: 20, carbs: 115, fats: 16 }
    }
  },
  lunch_sarmi: {
    name: 'Сарми',
    icon: '🥬',
    basePortions: {
      small: { calories: 300, protein: 12, carbs: 45, fats: 10 },
      medium: { calories: 450, protein: 18, carbs: 67, fats: 15 },
      large: { calories: 600, protein: 24, carbs: 90, fats: 20 }
    }
  },
  lunch_moussaka: {
    name: 'Мусака',
    icon: '🥘',
    basePortions: {
      small: { calories: 400, protein: 20, carbs: 35, fats: 22 },
      medium: { calories: 600, protein: 30, carbs: 52, fats: 33 },
      large: { calories: 800, protein: 40, carbs: 70, fats: 44 }
    }
  },

  // ВЕЧЕРЯ
  dinner_grill: {
    name: 'Скара',
    icon: '🥩',
    basePortions: {
      small: { calories: 400, protein: 35, carbs: 5, fats: 25 },
      medium: { calories: 600, protein: 50, carbs: 8, fats: 35 },
      large: { calories: 800, protein: 65, carbs: 10, fats: 45 }
    }
  },
  dinner_chicken: {
    name: 'Пилешко',
    icon: '🍗',
    basePortions: {
      small: { calories: 300, protein: 30, carbs: 0, fats: 18 },
      medium: { calories: 450, protein: 45, carbs: 0, fats: 27 },
      large: { calories: 600, protein: 60, carbs: 0, fats: 36 }
    }
  },
  dinner_pork: {
    name: 'Свинско',
    icon: '🥩',
    basePortions: {
      small: { calories: 350, protein: 25, carbs: 0, fats: 28 },
      medium: { calories: 500, protein: 35, carbs: 0, fats: 40 },
      large: { calories: 650, protein: 45, carbs: 0, fats: 52 }
    }
  },
  dinner_fish: {
    name: 'Риба',
    icon: '🐟',
    basePortions: {
      small: { calories: 250, protein: 25, carbs: 0, fats: 15 },
      medium: { calories: 375, protein: 37, carbs: 0, fats: 22 },
      large: { calories: 500, protein: 50, carbs: 0, fats: 30 }
    }
  },
  dinner_salad: {
    name: 'Салата',
    icon: '🥗',
    basePortions: {
      small: { calories: 150, protein: 5, carbs: 15, fats: 8 },
      medium: { calories: 250, protein: 8, carbs: 25, fats: 14 },
      large: { calories: 350, protein: 12, carbs: 35, fats: 20 }
    }
  },
  dinner_eggs: {
    name: 'Яйца',
    icon: '🍳',
    basePortions: {
      small: { calories: 150, protein: 12, carbs: 1, fats: 10 },
      medium: { calories: 300, protein: 24, carbs: 2, fats: 20 },
      large: { calories: 450, protein: 36, carbs: 3, fats: 30 }
    }
  },
  dinner_vegetables: {
    name: 'Зеленчуци',
    icon: '🥦',
    basePortions: {
      small: { calories: 100, protein: 4, carbs: 20, fats: 2 },
      medium: { calories: 150, protein: 6, carbs: 30, fats: 3 },
      large: { calories: 200, protein: 8, carbs: 40, fats: 4 }
    }
  },

  // БЪРЗО ХРАНЕНЕ
  fastfood_kebab: {
    name: 'Дюнер',
    icon: '🥙',
    basePortions: {
      small: { calories: 450, protein: 25, carbs: 45, fats: 22 },
      medium: { calories: 650, protein: 35, carbs: 65, fats: 32 },
      large: { calories: 850, protein: 45, carbs: 85, fats: 42 }
    }
  },
  fastfood_burger: {
    name: 'Бургер',
    icon: '🍔',
    basePortions: {
      small: { calories: 400, protein: 20, carbs: 40, fats: 20 },
      medium: { calories: 600, protein: 30, carbs: 60, fats: 30 },
      large: { calories: 800, protein: 40, carbs: 80, fats: 40 }
    }
  },
  fastfood_pizza: {
    name: 'Пица',
    icon: '🍕',
    basePortions: {
      small: { calories: 400, protein: 15, carbs: 50, fats: 15 },
      medium: { calories: 600, protein: 22, carbs: 75, fats: 22 },
      large: { calories: 800, protein: 30, carbs: 100, fats: 30 }
    }
  },
  fastfood_hotdog: {
    name: 'Хот-дог',
    icon: '🌭',
    basePortions: {
      small: { calories: 300, protein: 12, carbs: 30, fats: 15 },
      medium: { calories: 450, protein: 18, carbs: 45, fats: 22 },
      large: { calories: 600, protein: 24, carbs: 60, fats: 30 }
    }
  },
  fastfood_fries: {
    name: 'Пържени картофи',
    icon: '🍟',
    basePortions: {
      small: { calories: 250, protein: 3, carbs: 35, fats: 12 },
      medium: { calories: 400, protein: 5, carbs: 56, fats: 19 },
      large: { calories: 550, protein: 7, carbs: 77, fats: 26 }
    }
  },
  fastfood_gyros: {
    name: 'Гирос',
    icon: '🥙',
    basePortions: {
      small: { calories: 450, protein: 25, carbs: 45, fats: 22 },
      medium: { calories: 650, protein: 35, carbs: 65, fats: 32 },
      large: { calories: 850, protein: 45, carbs: 85, fats: 42 }
    }
  },
  fastfood_shawarma: {
    name: 'Шаурма',
    icon: '🌯',
    basePortions: {
      small: { calories: 500, protein: 25, carbs: 50, fats: 25 },
      medium: { calories: 700, protein: 35, carbs: 70, fats: 35 },
      large: { calories: 900, protein: 45, carbs: 90, fats: 45 }
    }
  },

  // СНАКСОВЕ
  snack_fruit: {
    name: 'Плодове',
    icon: '🍎',
    basePortions: {
      small: { calories: 60, protein: 1, carbs: 15, fats: 0 },
      medium: { calories: 120, protein: 2, carbs: 30, fats: 0 },
      large: { calories: 180, protein: 3, carbs: 45, fats: 0 }
    }
  },
  snack_nuts: {
    name: 'Ядки',
    icon: '🥜',
    basePortions: {
      small: { calories: 160, protein: 6, carbs: 6, fats: 14 },
      medium: { calories: 320, protein: 12, carbs: 12, fats: 28 },
      large: { calories: 480, protein: 18, carbs: 18, fats: 42 }
    }
  },
  snack_sweets: {
    name: 'Сладки',
    icon: '🍪',
    basePortions: {
      small: { calories: 150, protein: 2, carbs: 25, fats: 6 },
      medium: { calories: 300, protein: 4, carbs: 50, fats: 12 },
      large: { calories: 450, protein: 6, carbs: 75, fats: 18 }
    }
  },
  snack_yogurt: {
    name: 'Кисело мляко',
    icon: '🥛',
    basePortions: {
      small: { calories: 100, protein: 8, carbs: 12, fats: 2 },
      medium: { calories: 200, protein: 16, carbs: 24, fats: 4 },
      large: { calories: 300, protein: 24, carbs: 36, fats: 6 }
    }
  },
  snack_chocolate: {
    name: 'Шоколад',
    icon: '🍫',
    basePortions: {
      small: { calories: 150, protein: 2, carbs: 15, fats: 9 },
      medium: { calories: 300, protein: 4, carbs: 30, fats: 18 },
      large: { calories: 450, protein: 6, carbs: 45, fats: 27 }
    }
  },
  snack_icecream: {
    name: 'Сладолед',
    icon: '🍦',
    basePortions: {
      small: { calories: 200, protein: 4, carbs: 25, fats: 10 },
      medium: { calories: 350, protein: 7, carbs: 44, fats: 17 },
      large: { calories: 500, protein: 10, carbs: 63, fats: 25 }
    }
  },
  snack_chips: {
    name: 'Чипс',
    icon: '🥔',
    basePortions: {
      small: { calories: 150, protein: 2, carbs: 15, fats: 10 },
      medium: { calories: 300, protein: 4, carbs: 30, fats: 20 },
      large: { calories: 450, protein: 6, carbs: 45, fats: 30 }
    }
  },
  snack_popcorn: {
    name: 'Пуканки',
    icon: '🍿',
    basePortions: {
      small: { calories: 100, protein: 2, carbs: 20, fats: 3 },
      medium: { calories: 200, protein: 4, carbs: 40, fats: 6 },
      large: { calories: 300, protein: 6, carbs: 60, fats: 9 }
    }
  },
  snack_crackers: {
    name: 'Крекери',
    icon: '🍘',
    basePortions: {
      small: { calories: 120, protein: 2, carbs: 20, fats: 4 },
      medium: { calories: 240, protein: 4, carbs: 40, fats: 8 },
      large: { calories: 360, protein: 6, carbs: 60, fats: 12 }
    }
  },
  snack_pretzel: {
    name: 'Солети',
    icon: '🥨',
    basePortions: {
      small: { calories: 110, protein: 3, carbs: 22, fats: 1 },
      medium: { calories: 220, protein: 6, carbs: 44, fats: 2 },
      large: { calories: 330, protein: 9, carbs: 66, fats: 3 }
    }
  },
  snack_croissant: {
    name: 'Кроасан',
    icon: '🥐',
    basePortions: {
      small: { calories: 230, protein: 4, carbs: 25, fats: 12 },
      medium: { calories: 340, protein: 6, carbs: 37, fats: 18 },
      large: { calories: 450, protein: 8, carbs: 49, fats: 24 }
    }
  }
};

// Then modify the meal type selection part in the JSX to group by categories
const groupedMeals = Object.entries(averageMeals).reduce((acc, [type, meal]) => {
  const category = mealCategories[type];
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push({ type, meal });
  return acc;
}, {} as { [key in MealCategory]: { type: string; meal: FoodGroup }[] });

// In the quick select section, add this disclaimer component
const DisclaimerText = () => (
  <View style={styles.disclaimerContainer}>
    <Ionicons name="information-circle-outline" size={20} color="#999999" />
    <Text style={styles.disclaimerText}>
      Това са приблизителни стойности. Реалните стойности може да се различават според съставките.
    </Text>
  </View>
);

// Update the ManualInputForm component with better styling
const ManualInputForm = ({ onSave }: { onSave: (meal: { name: string; calories: number; protein: number; carbs: number; fats: number }) => void }) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const handleSave = () => {
    if (!name.trim() || name.length == 0) {
      showMessage({
        message: 'Грешка',
        description: 'Моля, въведете име на ястието',
        type: 'danger'
      });
      return;
    }

    const mealData = {
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0
    };

    onSave(mealData);
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  };

  return (
    <View style={styles.manualInputContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Име на ястието</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Напр. Пилешка супа"
          placeholderTextColor="#666666"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Калории</Text>
        <TextInput
          style={styles.inputField}
          placeholder="kcal"
          placeholderTextColor="#666666"
          keyboardType="numeric"
          value={calories}
          onChangeText={setCalories}
        />
      </View>

      <View style={styles.macroInputsContainer}>
        <View style={styles.macroInputGroup}>
          <Text style={styles.inputLabel}>Протеини</Text>
          <TextInput
            style={styles.macroInput}
            placeholder="g"
            placeholderTextColor="#666666"
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />
        </View>

        <View style={styles.macroInputGroup}>
          <Text style={styles.inputLabel}>Въглехидрати</Text>
          <TextInput
            style={styles.macroInput}
            placeholder="g"
            placeholderTextColor="#666666"
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
          />
        </View>

        <View style={styles.macroInputGroup}>
          <Text style={styles.inputLabel}>Мазнини</Text>
          <TextInput
            style={styles.macroInput}
            placeholder="g"
            placeholderTextColor="#666666"
            keyboardType="numeric"
            value={fats}
            onChangeText={setFats}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Запази</Text>
      </TouchableOpacity>
    </View>
  );
};

const PlanMealScreen = ({ 
  navigation, 
  route 
}: { 
  navigation: any; // TODO: Replace with proper navigation type
  route: any; // TODO: Replace with proper route type 
}) => {
    const editingMeal = route.params?.meal;
    const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast_pastry');
    const [selectedPortion, setSelectedPortion] = useState<PortionSize>('medium');
    const [showManualInput, setShowManualInput] = useState(false);
    const [error, setError] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState<CollapsibleState>({
        'ЗАКУСКИ': true,
        'ОБЯД': true,
        'ВЕЧЕРЯ': true,
        'БЪРЗО ХРАНЕНЕ': true,
        'СНАКСОВЕ': true
    });

    const handleQuickSelect = (mealType: MealType, portion: PortionSize) => {
        const meal = averageMeals[mealType].basePortions[portion];
        const portionName = portion === 'small' ? 'Малка' : 
                           portion === 'medium' ? 'Средна' : 'Голяма';
        const mealData = {
            name: `${averageMeals[mealType].name} (${portionName})`,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            mealType: mealType
        };

        handleSaveMeal(mealData);
    };

    const handleSaveMeal = async (mealData: any) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const finalMealData = {
                ...mealData,
                timestamp: new Date(),
                type: selectedMealType,
                source: 'quick_add'
            };

            await addDoc(collection(db, 'users', user.uid, 'meals'), finalMealData);
            showMessage({ message: 'Ястието е добавено успешно!', type: 'success' });
            navigation.goBack();
        } catch (error) {
            console.error('Error saving meal:', error);
            showMessage({ message: 'Грешка при добавяне на ястието', type: 'danger' });
        }
    };

    const toggleCategory = (category: MealCategory) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Update the renderCategories function with better styling
    const renderCategories = () => (
        <View style={styles.categoriesContainer}>
            {(Object.keys(groupedMeals) as MealCategory[]).map((category) => (
                <View key={category} style={styles.categoryWrapper}>
                    <TouchableOpacity 
                        style={[
                            styles.categoryHeader,
                            !collapsedCategories[category] && styles.categoryHeaderActive
                        ]}
                        onPress={() => toggleCategory(category)}
                    >
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <View style={styles.categoryHeaderRight}>
                            <Text style={styles.itemCount}>
                                {groupedMeals[category]?.length || 0} ястия
                            </Text>
                            <Ionicons 
                                name={collapsedCategories[category] ? 'chevron-down' : 'chevron-up'} 
                                size={24} 
                                color="#4CAF50" 
                            />
                        </View>
                    </TouchableOpacity>
                    {!collapsedCategories[category] && (
                        <View style={styles.mealTypeContainer}>
                            {groupedMeals[category]?.map(({ type, meal }) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.mealTypeButton,
                                        selectedMealType === type && styles.selectedMealType
                                    ]}
                                    onPress={() => setSelectedMealType(type as MealType)}
                                >
                                    <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
                                    <Text style={styles.mealTypeText}>{meal.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );

    return (
        <StyledImageBackground
            source={{ uri: 'https://i.imgur.com/8F9ZGpX.png' }}
            style={{ flex: 1 }}
            blurRadius={5}
        >
            <View style={{ backgroundColor: 'rgba(0,0,0,0.9)', flex: 1 }}>
                <StyledScrollView>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Отчетете хранене</Text>
                    </View>

                    <View style={styles.container}>
                        {/* Toggle between quick and manual input */}
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleButton, !showManualInput && styles.selectedToggle]}
                                onPress={() => setShowManualInput(false)}
                            >
                                <Text style={styles.toggleText}>Бързо отчитане</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleButton, showManualInput && styles.selectedToggle]}
                                onPress={() => setShowManualInput(true)}
                            >
                                <Text style={styles.toggleText}>Ръчно отчитане</Text>
                            </TouchableOpacity>
                        </View>

                        {showManualInput ? (
                            <ManualInputForm onSave={handleSaveMeal} />
                        ) : (
                            <View style={styles.quickSelectContainer}>
                                <DisclaimerText />
                                <Text style={styles.sectionTitle}>Вид ястие</Text>
                                {renderCategories()}

                                {/* Portion Size Selection */}
                                <Text style={styles.sectionTitle}>Размер на порцията</Text>
                                <View style={styles.portionContainer}>
                                    {['small', 'medium', 'large'].map((size) => (
                                        <TouchableOpacity
                                            key={size}
                                            style={[
                                                styles.portionButton,
                                                selectedPortion === size && styles.selectedPortion
                                            ]}
                                            onPress={() => setSelectedPortion(size as PortionSize)}
                                        >
                                            <Text style={styles.portionText}>
                                                {size === 'small' ? 'Малка' : 
                                                 size === 'medium' ? 'Средна' : 'Голяма'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Preview Macros */}
                                <View style={styles.macroPreview}>
                                    <Text style={styles.macroText}>
                                        {averageMeals[selectedMealType as MealType].basePortions[selectedPortion as PortionSize].calories} kcal
                                    </Text>
                                    <Text style={styles.macroDetails}>
                                        Протеини: {averageMeals[selectedMealType as MealType].basePortions[selectedPortion as PortionSize].protein}g
                                    </Text>
                                    <Text style={styles.macroDetails}>
                                        Въглехидрати: {averageMeals[selectedMealType as MealType].basePortions[selectedPortion as PortionSize].carbs}g
                                    </Text>
                                    <Text style={styles.macroDetails}>
                                        Мазнини: {averageMeals[selectedMealType as MealType].basePortions[selectedPortion as PortionSize].fats}g
                                    </Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.saveButton}
                                    onPress={() => handleQuickSelect(selectedMealType as MealType, selectedPortion as PortionSize)}
                                >
                                    <Text style={styles.saveButtonText}>Отчети</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </StyledScrollView>
            </View>
        </StyledImageBackground>
    );
};

const styles = StyleSheet.create({
    headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 15 },
    backButton: { padding: 10 },
    headerTitle: { fontSize: 24, fontWeight: '300', color: '#FFFFFF', marginLeft: 15 },
    container: { flex: 1, padding: 20 },
    inputContainer: { backgroundColor: '#1A1A1A', borderRadius: 15, padding: 20, marginBottom: 20 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000', borderRadius: 10, padding: 15, marginBottom: 15 },
    input: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 15 },
    errorText: { color: 'red', fontSize: 16, marginBottom: 10, textAlign: 'center' },
    saveButton: { backgroundColor: '#4CAF50', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    toggleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#1A1A1A',
        marginHorizontal: 5,
        borderRadius: 12,
        alignItems: 'center',
    },
    selectedToggle: {
        backgroundColor: '#4CAF50',
    },
    toggleText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    manualInputContainer: {
        padding: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        gap: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputField: {
        backgroundColor: '#000000',
        borderRadius: 8,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 16,
    },
    macroInputsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 15,
    },
    macroInputGroup: {
        flex: 1,
    },
    macroInput: {
        backgroundColor: '#000000',
        borderRadius: 8,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 16,
    },
    quickSelectContainer: {
        padding: 15,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
    },
    macroPreview: {
        alignItems: 'center',
        marginVertical: 15,
    },
    macroText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    macroDetails: {
        color: '#CCCCCC',
        fontSize: 16,
        marginVertical: 2,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 20,
    },
    categoriesContainer: {
        marginTop: 10,
    },
    categoryWrapper: {
        marginBottom: 8,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 12,
        backgroundColor: '#242424',
    },
    categoryHeaderActive: {
        backgroundColor: '#2C2C2C',
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    categoryHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryTitle: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: '600',
    },
    itemCount: {
        color: '#888888',
        fontSize: 14,
    },
    mealTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 8,
    },
    mealTypeButton: {
        width: '48%',
        backgroundColor: '#242424',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedMealType: {
        backgroundColor: '#4CAF50',
    },
    mealTypeIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    mealTypeText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    portionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    portionButton: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    selectedPortion: {
        backgroundColor: '#4CAF50',
    },
    portionText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242424',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    disclaimerText: {
        color: '#999999',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
});

export default PlanMealScreen;
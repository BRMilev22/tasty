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

// Replace the complex food groups with simple average meals
const averageMeals: { [key: string]: FoodGroup } = {
  breakfast: {
    name: 'Закуска',
    icon: '🍳',
    basePortions: {
      small: { calories: 300, protein: 15, carbs: 35, fats: 12 },
      medium: { calories: 450, protein: 20, carbs: 50, fats: 18 },
      large: { calories: 600, protein: 25, carbs: 65, fats: 24 }
    }
  },
  lunch: {
    name: 'Обяд',
    icon: '🍽️',
    basePortions: {
      small: { calories: 500, protein: 25, carbs: 45, fats: 20 },
      medium: { calories: 700, protein: 35, carbs: 65, fats: 28 },
      large: { calories: 900, protein: 45, carbs: 85, fats: 36 }
    }
  },
  dinner: {
    name: 'Вечеря',
    icon: '🥘',
    basePortions: {
      small: { calories: 400, protein: 20, carbs: 40, fats: 16 },
      medium: { calories: 600, protein: 30, carbs: 60, fats: 24 },
      large: { calories: 800, protein: 40, carbs: 80, fats: 32 }
    }
  },
  snack: {
    name: 'Снакс',
    icon: '🍎',
    basePortions: {
      small: { calories: 150, protein: 5, carbs: 20, fats: 6 },
      medium: { calories: 250, protein: 8, carbs: 30, fats: 10 },
      large: { calories: 350, protein: 12, carbs: 40, fats: 14 }
    }
  }
};

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
    if (!name.trim()) {
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

const PlanMealScreen = ({ navigation, route }) => {
    const editingMeal = route.params?.meal;
    const [selectedMealType, setSelectedMealType] = useState('breakfast');
    const [selectedPortion, setSelectedPortion] = useState('medium');
    const [showManualInput, setShowManualInput] = useState(false);
    const [error, setError] = useState('');

    const handleQuickSelect = (mealType: string, portion: string) => {
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
                                {/* Meal Type Selection */}
                                <Text style={styles.sectionTitle}>Вид ястие</Text>
                                <View style={styles.mealTypeContainer}>
                                    {Object.entries(averageMeals).map(([type, meal]) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.mealTypeButton,
                                                selectedMealType === type && styles.selectedMealType
                                            ]}
                                            onPress={() => setSelectedMealType(type)}
                                        >
                                            <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
                                            <Text style={styles.mealTypeText}>{meal.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

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
                                            onPress={() => setSelectedPortion(size)}
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
                                        {averageMeals[selectedMealType].basePortions[selectedPortion].calories} kcal
                                    </Text>
                                    <Text style={styles.macroDetails}>
                                        Протеини: {averageMeals[selectedMealType].basePortions[selectedPortion].protein}g
                                    </Text>
                                    <Text style={styles.macroDetails}>
                                        Въглехидрати: {averageMeals[selectedMealType].basePortions[selectedPortion].carbs}g
                                    </Text>
                                    <Text style={styles.macroDetails}>
                                        Мазнини: {averageMeals[selectedMealType].basePortions[selectedPortion].fats}g
                                    </Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.saveButton}
                                    onPress={() => handleQuickSelect(selectedMealType, selectedPortion)}
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
    mealTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    mealTypeButton: {
        width: '48%',
        backgroundColor: '#1A1A1A',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
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
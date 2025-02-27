import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Animated,
  Modal,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { styled } from 'nativewind';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Link } from 'expo-router';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  nutriments?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  fadeAnim: Animated.Value;
  imageUrl: string;
  isFromList: boolean;
}

interface AddItemFormData {
  name: string;
  quantity: number;
  unit: string;
  nutriments: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MealLog {
  name: string;
  quantity: number;
  unit: string;
  nutriments?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  timestamp: Date;
}

interface Ingredient {
  id: number;
  name: string;
  english_name: string;
  image_url: string;
  image_small_url: string;
  image_medium_url: string;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
}

const colors = {
  primary: '#4CAF50', // Green
  secondary: '#2196F3', // Blue
  accent: '#FF9800', // Orange
  error: '#F44336', // Red
  warning: '#FFC107', // Yellow
  success: '#8BC34A', // Light Green
  info: '#00BCD4', // Cyan
  background: {
    dark: '#000000',
    card: 'rgba(30, 30, 30, 0.95)',
    input: 'rgba(40, 40, 40, 0.8)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    hint: '#666666',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.1)',
    accent: 'rgba(76, 175, 80, 0.3)',
  }
};

const AddItemModal = memo(({ 
  isVisible, 
  onClose, 
  searchQuery, 
  onSearchChange,
  selectedIngredient,
  onIngredientSelect,
  filteredIngredients,
  selectedUnit,
  onUnitSelect,
  onPortionChange,
  onAddItem,
  isSubmitting,
  portionSize,
  isManualMode,
  onToggleMode,
  manualNutrients,
  onManualNutrientsChange,
}: {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  selectedIngredient: Ingredient | null;
  onIngredientSelect: (ingredient: Ingredient) => void;
  filteredIngredients: Ingredient[];
  selectedUnit: string;
  onUnitSelect: (unit: string) => void;
  onPortionChange: (value: number) => void;
  onAddItem: (item: AddItemFormData) => void;
  isSubmitting: boolean;
  portionSize: number;
  isManualMode: boolean;
  onToggleMode: () => void;
  manualNutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onManualNutrientsChange: (nutrient: string, value: number) => void;
}) => (
  <Modal
    visible={isVisible}
    transparent={false}
    animationType="slide"
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.fullScreenModal}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Добавяне на продукт</Text>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        {!isManualMode ? (
          <StyledTextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Въведете име на продукт..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        ) : (
          <StyledTextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Име на продукт..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        )}
        <TouchableOpacity 
          style={styles.modeToggleButton}
          onPress={onToggleMode}
        >
          <Ionicons 
            name={isManualMode ? "search-outline" : "create-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {!isManualMode ? (
        <View style={styles.mainContainer}>
          <View style={styles.ingredientsListContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredIngredients.map(ingredient => (
                <TouchableOpacity
                  key={ingredient.id}
                  style={[
                    styles.ingredientItem,
                    selectedIngredient?.id === ingredient.id && styles.selectedIngredient
                  ]}
                  onPress={() => onIngredientSelect(ingredient)}
                >
                  <Image
                    source={{ uri: ingredient.image_small_url }}
                    style={styles.ingredientImage}
                  />
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.nutrientsPer100g}>На 100 грама:</Text>
                    <Text style={styles.ingredientNutrients}>
                      {`${Math.round(ingredient.calories_100g || 0)} ккал • ${Math.round(ingredient.protein_100g || 0)}г протеин • ${Math.round(ingredient.carbs_100g || 0)}г въглехидрати • ${Math.round(ingredient.fat_100g || 0)}г мазнини`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedIngredient && (
            <View style={styles.selectedControls}>
              <Text style={styles.controlLabel}>Количество</Text>
              <TextInput
                style={styles.quantityInput}
                keyboardType="numeric"
                placeholder="Въведете количество..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => onPortionChange(parseFloat(text) || 0)}
              />

              <Text style={styles.controlLabel}>Мерна единица</Text>
              <View style={styles.unitSelector}>
                {['г', 'кг', 'мл', 'л', 'бр.'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      selectedUnit === unit && styles.unitButtonActive
                    ]}
                    onPress={() => onUnitSelect(unit)}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      selectedUnit === unit && styles.unitButtonTextActive
                    ]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAddItem({
                  name: selectedIngredient.name,
                  quantity: portionSize,
                  unit: selectedUnit,
                  nutriments: {
                    calories: selectedIngredient.calories_100g,
                    protein: selectedIngredient.protein_100g,
                    carbs: selectedIngredient.carbs_100g,
                    fat: selectedIngredient.fat_100g
                  }
                })}
                disabled={isSubmitting}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Добави</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.manualEntryForm}>
            <Text style={styles.controlLabel}>Количество</Text>
            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              placeholder="Въведете количество..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              onChangeText={(text) => onPortionChange(parseFloat(text) || 0)}
            />

            <Text style={styles.controlLabel}>Мерна единица</Text>
            <View style={styles.unitSelector}>
              {['г', 'кг', 'мл', 'л', 'бр.'].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    selectedUnit === unit && styles.unitButtonActive
                  ]}
                  onPress={() => onUnitSelect(unit)}
                >
                  <Text style={[
                    styles.unitButtonText,
                    selectedUnit === unit && styles.unitButtonTextActive
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.controlLabel}>Хранителни стойности на 100г</Text>
            <View style={styles.nutrientsInputs}>
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                placeholder="Калории"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => onManualNutrientsChange('calories', parseFloat(text) || 0)}
              />
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                placeholder="Протеин"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => onManualNutrientsChange('protein', parseFloat(text) || 0)}
              />
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                placeholder="Въглехидрати"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => onManualNutrientsChange('carbs', parseFloat(text) || 0)}
              />
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                placeholder="Мазнини"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => onManualNutrientsChange('fat', parseFloat(text) || 0)}
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAddItem({
                name: searchQuery,
                quantity: portionSize,
                unit: selectedUnit,
                nutriments: manualNutrients
              })}
              disabled={isSubmitting || !searchQuery.trim() || !portionSize}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Добави</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  </Modal>
));

const EditItemModal = memo(({ 
  isVisible, 
  onClose, 
  item,
  onSave,
  isSubmitting
}: {
  isVisible: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (item: InventoryItem) => void;
  isSubmitting: boolean;
}) => {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('г');
  const [nutrients, setNutrients] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setNutrients({
        calories: item.nutriments?.calories || 0,
        protein: item.nutriments?.protein || 0,
        carbs: item.nutriments?.carbs || 0,
        fat: item.nutriments?.fat || 0
      });
    }
  }, [item]);

  if (!item) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.fullScreenModal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Редактиране на продукт</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.mainContainer}>
          <View style={styles.editItemForm}>
            <View style={styles.selectedIngredient}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.ingredientImage}
                />
              ) : (
                <View style={[styles.ingredientImage, styles.placeholderImage]}>
                  <Ionicons name="nutrition-outline" size={24} color="rgba(255, 255, 255, 0.5)" />
                </View>
              )}
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{item.name}</Text>
              </View>
            </View>

            <Text style={styles.controlLabel}>Количество</Text>
            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Въведете количество..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />

            <Text style={styles.controlLabel}>Мерна единица</Text>
            <View style={styles.unitSelector}>
              {['г', 'кг', 'мл', 'л', 'бр.'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitButton,
                    unit === u && styles.unitButtonActive
                  ]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[
                    styles.unitButtonText,
                    unit === u && styles.unitButtonTextActive
                  ]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.controlLabel}>Хранителни стойности на 100г</Text>
            <View style={styles.nutrientsInputs}>
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                value={nutrients.calories.toString()}
                placeholder="Калории"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => setNutrients(prev => ({...prev, calories: parseFloat(text) || 0}))}
              />
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                value={nutrients.protein.toString()}
                placeholder="Протеин"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => setNutrients(prev => ({...prev, protein: parseFloat(text) || 0}))}
              />
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                value={nutrients.carbs.toString()}
                placeholder="Въглехидрати"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => setNutrients(prev => ({...prev, carbs: parseFloat(text) || 0}))}
              />
              <TextInput
                style={styles.nutrientInput}
                keyboardType="numeric"
                value={nutrients.fat.toString()}
                placeholder="Мазнини"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onChangeText={(text) => setNutrients(prev => ({...prev, fat: parseFloat(text) || 0}))}
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                onSave({
                  ...item,
                  quantity: parseFloat(quantity) || 0,
                  unit,
                  nutriments: nutrients
                });
              }}
              disabled={isSubmitting}
            >
              <Ionicons name="save-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Запази</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const InventoryScreen = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEatModalVisible, setIsEatModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [portionSize, setPortionSize] = useState(1);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedUnit, setSelectedUnit] = useState('г');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualNutrients, setManualNutrients] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const inventoryRef = collection(db, 'users', user.uid, 'inventory');
    const q = query(inventoryRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          fadeAnim: new Animated.Value(1),
          imageUrl: data.image_url || '',
          isFromList: data.isFromList || false
        } as InventoryItem);
      });
      setInventory(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('http://192.168.0.104:3000/ingredients');
      const data = await response.json();
      if (Array.isArray(data)) {
        setIngredients(data);
        setFilteredIngredients(data);
      } else {
        console.error('Invalid ingredients data format:', data);
        Alert.alert('Грешка', 'Невалиден формат на данните за съставките');
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      Alert.alert('Грешка', 'Неуспешно зареждане на съставките');
    }
  };

  useEffect(() => {
    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchQuery, ingredients]);

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Изтриване на продукт',
      'Сигурни ли сте, че искате да изтриете този продукт?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              Animated.timing(item.fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
              }).start(async () => {
                await deleteDoc(doc(db, 'users', user.uid, 'inventory', item.id));
              });
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Грешка', 'Възникна проблем при изтриването на продукта.');
            }
          }
        }
      ]
    );
  };

  const handleQuantityChange = async (item: InventoryItem, change: number) => {
    if (!user) return;
    const newQuantity = item.quantity + change;
    
    try {
      if (newQuantity <= 0) {
        // Fade out animation before deletion
        Animated.timing(item.fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(async () => {
          // Delete the item when quantity reaches 0
          await deleteDoc(doc(db, 'users', user.uid, 'inventory', item.id));
        });
      } else {
        // Update quantity if greater than 0
        await updateDoc(doc(db, 'users', user.uid, 'inventory', item.id), {
          quantity: newQuantity
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Грешка', 'Възникна проблем при обновяването на количеството.');
    }
  };

  const handleAddItem = async (item: AddItemFormData) => {
    try {
      setIsSubmitting(true);
      if (!user) return;

      await addDoc(collection(db, 'users', user.uid, 'inventory'), {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        nutriments: item.nutriments,
        createdAt: new Date(),
        isFromList: true,
      });

      // Reset states after adding
      setIsAddModalVisible(false);
      setSelectedIngredient(null);
      setPortionSize(1);
      setSelectedUnit('г');
      setSearchQuery(''); // Reset search query
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Грешка', 'Неуспешно добавяне на продукт');
      setIsSubmitting(false);
    }
  };

  const handleEatItem = async (item: InventoryItem) => {
    try {
      if (!user) return;

      // Log the meal
      await addDoc(collection(db, 'users', user.uid, 'meals'), {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        nutriments: item.nutriments,
        timestamp: new Date(),
      });

      // Remove from inventory
      await deleteDoc(doc(db, 'users', user.uid, 'inventory', item.id));

      Alert.alert('Успех', 'Храненето е отчетено успешно!');
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Грешка', 'Възникна проблем при отчитането на храненето.');
    }
  };

  const handleEditItem = async (updatedItem: InventoryItem) => {
    try {
      if (!user) return;
      
      await updateDoc(doc(db, 'users', user.uid, 'inventory', updatedItem.id), {
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        nutriments: updatedItem.nutriments,
        updatedAt: new Date()
      });

      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Грешка', 'Неуспешно обновяване на продукт');
    }
  };

  const handleClearInventory = () => {
    Alert.alert(
      'Изчистване на инвентара',
      'Сигурни ли сте, че искате да изтриете всички продукти?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий всичко',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              const batch = writeBatch(db);
              inventory.forEach((item) => {
                const itemRef = doc(db, 'users', user.uid, 'inventory', item.id);
                batch.delete(itemRef);
              });
              await batch.commit();
              Alert.alert('Успех', 'Инвентарът е изчистен успешно!');
            } catch (error) {
              console.error('Error clearing inventory:', error);
              Alert.alert('Грешка', 'Възникна проблем при изчистването на инвентара.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <Animated.View style={[styles.itemCard, { opacity: item.fadeAnim }]}>
      <View style={styles.itemContent}>
        {/* Left section with name and nutrients */}
        <View style={styles.itemMainInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.nutriments && (
            <View style={styles.nutrientsRow}>
              <Text style={styles.nutrientText}>
                {item.nutriments?.calories ? `${Math.round(item.nutriments.calories)} кал` : '- кал'}
              </Text>
              <Text style={styles.nutrientDivider}>•</Text>
              <Text style={styles.nutrientText}>
                {item.nutriments?.protein ? `${Math.round(item.nutriments.protein)}г прот` : '- прот'}
              </Text>
              <Text style={styles.nutrientDivider}>•</Text>
              <Text style={styles.nutrientText}>
                {item.nutriments?.carbs ? `${Math.round(item.nutriments.carbs)}г въгл` : '- въгл'}
              </Text>
              <Text style={styles.nutrientDivider}>•</Text>
              <Text style={styles.nutrientText}>
                {item.nutriments?.fat ? `${Math.round(item.nutriments.fat)}г мазн` : '- мазн'}
              </Text>
            </View>
          )}
          {item.isFromList && <Text style={styles.nutrientText}>(на 100г)</Text>}
        </View>

        {/* Right section with quantity and actions */}
        <View style={styles.itemControls}>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, -1)}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>
              {item.quantity} {item.unit}
            </Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, 1)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedItem(item);
                setPortionSize(1);
                setIsEatModalVisible(true);
              }}
            >
              <Ionicons name="restaurant-outline" size={16} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setEditingItem(item);
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons name="pencil-outline" size={16} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderIngredient = (ingredient: Ingredient) => (
    <TouchableOpacity
      key={ingredient.id}
      style={[
        styles.ingredientItem,
        selectedIngredient?.id === ingredient.id && styles.selectedIngredient
      ]}
      onPress={() => setSelectedIngredient(ingredient)}
    >
      <Image
        source={{ uri: ingredient.image_small_url }}
        style={styles.ingredientImage}
      />
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{ingredient.name}</Text>
        <Text style={styles.nutrientsPer100g}>На 100 грама:</Text>
        <Text style={styles.ingredientNutrients}>
          {`${Math.round(ingredient.calories_100g || 0)} ккал • ${Math.round(ingredient.protein_100g || 0)}г протеин • ${Math.round(ingredient.carbs_100g || 0)}г въглехидрати • ${Math.round(ingredient.fat_100g || 0)}г мазнини`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const EatModal = memo(() => {
    return (
      <Modal
        visible={isEatModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsEatModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.fullScreenModal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Отчети хранене</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsEatModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.mainContainer}>
            <View style={styles.editItemForm}>
              <View style={styles.selectedIngredient}>
                {selectedItem?.imageUrl ? (
                  <Image
                    source={{ uri: selectedItem.imageUrl }}
                    style={styles.ingredientImage}
                  />
                ) : (
                  <View style={[styles.ingredientImage, styles.placeholderImage]}>
                    <Ionicons name="nutrition-outline" size={24} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                )}
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{selectedItem?.name}</Text>
                  {selectedItem?.nutriments && (
                    <>
                      <Text style={styles.nutrientsPer100g}>Хранителни стойности:</Text>
                      <Text style={styles.ingredientNutrients}>
                        {`${Math.round(selectedItem.nutriments.calories || 0)} ккал • ${Math.round(selectedItem.nutriments.protein || 0)}г протеин • ${Math.round(selectedItem.nutriments.carbs || 0)}г въглехидрати • ${Math.round(selectedItem.nutriments.fat || 0)}г мазнини`}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (selectedItem) {
                    handleEatItem(selectedItem);
                    setIsEatModalVisible(false);
                    setSelectedItem(null);
                  }
                }}
              >
                <Ionicons name="restaurant-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Отчети</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleIngredientSelect = useCallback((ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
  }, []);

  const handleUnitSelect = useCallback((unit: string) => {
    setSelectedUnit(unit);
  }, []);

  const handlePortionChange = useCallback((value: number) => {
    setPortionSize(value);
  }, []);

  const handleToggleMode = useCallback(() => {
    setIsManualMode(prev => !prev);
    setSearchQuery('');
    setSelectedIngredient(null);
  }, []);

  const handleManualNutrientsChange = useCallback((nutrient: string, value: number) => {
    setManualNutrients(prev => ({
      ...prev,
      [nutrient]: value
    }));
  }, []);

  return (
    <StyledView style={styles.container}>
      <StyledView style={styles.header}>
        <StyledView style={styles.headerTop}>
          <StyledText style={styles.headerTitle}>Вашият инвентар</StyledText>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearInventory}
          >
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </StyledView>
        <StyledText style={styles.headerSubtitle}>
          Управлявайте вашите продукти и хранителни запаси
        </StyledText>
      </StyledView>

      <StyledView style={styles.searchContainer}>
        <Ionicons name="search-outline" size={24} color="#FFFFFF" />
        <StyledTextInput
          style={styles.searchInput}
          placeholder="Търсете продукти..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <StyledTouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999999" />
          </StyledTouchableOpacity>
        )}
      </StyledView>

      {isLoading ? (
        <StyledView style={styles.emptyContainer}>
          <StyledText style={styles.emptyText}>Зареждане...</StyledText>
        </StyledView>
      ) : filteredInventory.length === 0 ? (
        <StyledView style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={60} color="#333333" />
          <StyledText style={styles.emptyText}>
            {searchQuery ? 'Няма намерени продукти' : 'Вашият инвентар е празен'}
          </StyledText>
          <StyledText style={styles.emptySubtext}>
            {searchQuery 
              ? 'Опитайте с различно търсене'
              : 'Добавете продукти чрез сканиране на баркод или ръчно въвеждане'
            }
          </StyledText>
        </StyledView>
      ) : (
        <FlatList
          data={filteredInventory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <AddItemModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedIngredient={selectedIngredient}
        onIngredientSelect={handleIngredientSelect}
        filteredIngredients={filteredIngredients}
        selectedUnit={selectedUnit}
        onUnitSelect={handleUnitSelect}
        onPortionChange={handlePortionChange}
        onAddItem={handleAddItem}
        isSubmitting={isSubmitting}
        portionSize={portionSize}
        isManualMode={isManualMode}
        onToggleMode={handleToggleMode}
        manualNutrients={manualNutrients}
        onManualNutrientsChange={handleManualNutrientsChange}
      />
      <EatModal />
      <EditItemModal
        isVisible={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleEditItem}
        isSubmitting={isSubmitting}
      />
    </StyledView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    padding: 16,
  },
  header: {
    marginTop: 44,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    color: '#fff',
    fontSize: 16,
    height: 40,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 24,
  },
  itemCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  nutrientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  nutrientText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  nutrientDivider: {
    fontSize: 12,
    color: colors.text.hint,
    marginHorizontal: 4,
  },
  itemControls: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quantityButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    padding: 4,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.hint,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalScroll: {
    maxHeight: '80%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.text.secondary,
    marginBottom: 8,
    fontSize: 14,
  },
  textInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: 12,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    fontSize: 16,
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  unitButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
  },
  unitButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  unitButtonTextActive: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutrientInput: {
    width: '48%',
    marginBottom: 16,
  },
  nutrientTextInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: 12,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  nutrientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  nutrientBubble: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  nutrientLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  nutrientValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  portionContainer: {
    marginVertical: 16,
  },
  eatModalContent: {
    gap: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: colors.error,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  ingredientsList: {
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background.input,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectedIngredient: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  ingredientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ingredientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ingredientName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  nutrientsPer100g: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  ingredientNutrients: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  ingredientsListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectedControls: {
    padding: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    padding: 16,
    borderRadius: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  unitButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  unitButtonActive: {
    backgroundColor: '#4CAF50',
  },
  unitButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  unitButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modeToggleButton: {
    padding: 8,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 12,
  },
  manualEntryForm: {
    padding: 20,
  },
  nutrientsInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  nutrientInput: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    padding: 12,
    borderRadius: 12,
    color: '#fff',
  },
  editItemForm: {
    padding: 20,
  },
  selectedIngredient: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 16,
    marginBottom: 20,
  },
  placeholderImage: {
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InventoryScreen;
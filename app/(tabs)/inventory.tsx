import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { styled } from 'nativewind';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
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
          fadeAnim: new Animated.Value(1)
        } as InventoryItem);
      });
      setInventory(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const handleAddItem = async (formData: AddItemFormData) => {
    if (!user || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'inventory'), {
        ...formData,
        createdAt: new Date()
      });
      
      setIsAddModalVisible(false);
      Alert.alert('Успех', 'Продуктът е добавен успешно!');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето на продукта.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEatItem = async (item: InventoryItem, portion: number) => {
    if (!user) return;
    
    try {
      // Update inventory quantity
      const newQuantity = item.quantity - portion;
      
      console.log('Original item:', {
        name: item.name,
        quantity: item.quantity,
        nutriments: item.nutriments
      });
      
      console.log('Logging portion:', portion);

      // Calculate nutrients for the logged portion
      const portionNutriments = item.nutriments ? {
        calories: Math.round(item.nutriments.calories * (portion / item.quantity)),
        protein: Math.round(item.nutriments.protein * (portion / item.quantity)),
        carbs: Math.round(item.nutriments.carbs * (portion / item.quantity)),
        fat: Math.round(item.nutriments.fat * (portion / item.quantity))
      } : undefined;

      console.log('Calculated portion nutrients:', portionNutriments);

      // Log the meal with calculated nutrients
      const mealLog: MealLog = {
        name: item.name,
        quantity: portion,
        unit: item.unit,
        nutriments: portionNutriments,
        timestamp: new Date()
      };

      console.log('Meal log to be saved:', mealLog);

      await addDoc(collection(db, 'users', user.uid, 'meals'), mealLog);
      
      if (newQuantity <= 0) {
        await deleteDoc(doc(db, 'users', user.uid, 'inventory', item.id));
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'inventory', item.id), {
          quantity: newQuantity
        });
      }

      Alert.alert('Успех', 'Храната е добавена към дневника');
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Грешка', 'Възникна проблем при добавянето на храната.');
    }
  };

  const handleEditItem = async (formData: AddItemFormData, itemId: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'inventory', itemId), {
        ...formData,
        updatedAt: new Date()
      });
      
      setIsEditModalVisible(false);
      setEditingItem(null);
      Alert.alert('Успех', 'Продуктът е обновен успешно!');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Грешка', 'Възникна проблем при обновяването на продукта.');
    } finally {
      setIsSubmitting(false);
    }
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

  const AddItemModal = ({ visible, onClose, onSubmit }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: AddItemFormData) => void;
  }) => {
    // Add local state for unit selection
    const [selectedUnit, setSelectedUnit] = useState('бр');
    
    const formData = useRef<AddItemFormData>({
      name: '',
      quantity: 1,
      unit: 'бр',
      nutriments: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    });

    const resetForm = () => {
      setSelectedUnit('бр'); // Reset the selected unit
      formData.current = {
        name: '',
        quantity: 1,
        unit: 'бр',
        nutriments: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      };
    };

    return (
      <Modal
        visible={visible}
        transparent
        onRequestClose={() => {
          resetForm();
          onClose();
        }}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Добавяне на продукт</Text>
              <TouchableOpacity 
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Име на продукта</Text>
                <TextInput
                  style={styles.textInput}
                  defaultValue=""
                  onChangeText={(text) => {
                    formData.current.name = text;
                  }}
                  placeholder="Въведете име..."
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Количество</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue="1"
                    onChangeText={(text) => {
                      formData.current.quantity = parseFloat(text) || 0;
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 3 }]}>
                  <Text style={styles.inputLabel}>Мерна единица</Text>
                  <View style={styles.unitSelector}>
                    {['бр', 'г', 'кг', 'мл', 'л'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          selectedUnit === unit && styles.unitButtonActive
                        ]}
                        onPress={() => {
                          setSelectedUnit(unit);
                          formData.current.unit = unit;
                        }}
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
                </View>
              </View>

              <Text style={styles.sectionTitle}>Хранителна информация</Text>
              
              <View style={styles.nutrientsGrid}>
                <View style={styles.nutrientInput}>
                  <Text style={styles.nutrientLabel}>Калории</Text>
                  <TextInput
                    style={styles.nutrientTextInput}
                    defaultValue="0"
                    onChangeText={(text) => {
                      formData.current.nutriments.calories = parseFloat(text) || 0;
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.nutrientInput}>
                  <Text style={styles.nutrientLabel}>Протеини (г)</Text>
                  <TextInput
                    style={styles.nutrientTextInput}
                    defaultValue="0"
                    onChangeText={(text) => {
                      formData.current.nutriments.protein = parseFloat(text) || 0;
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.nutrientInput}>
                  <Text style={styles.nutrientLabel}>Въглехидрати (г)</Text>
                  <TextInput
                    style={styles.nutrientTextInput}
                    defaultValue="0"
                    onChangeText={(text) => {
                      formData.current.nutriments.carbs = parseFloat(text) || 0;
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.nutrientInput}>
                  <Text style={styles.nutrientLabel}>Мазнини (г)</Text>
                  <TextInput
                    style={styles.nutrientTextInput}
                    defaultValue="0"
                    onChangeText={(text) => {
                      formData.current.nutriments.fat = parseFloat(text) || 0;
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onSubmit(formData.current)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Добави продукт</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    );
  };

  const EatModal = () => (
    <Modal
      visible={isEatModalVisible}
      transparent
      onRequestClose={() => {
        setIsEatModalVisible(false);
        setSelectedItem(null);
        setPortionSize(1);
      }}
    >
      <BlurView intensity={80} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Отчети хранене</Text>
            <TouchableOpacity 
              onPress={() => {
                setIsEatModalVisible(false);
                setSelectedItem(null);
                setPortionSize(1);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <View style={styles.eatModalContent}>
              <Text style={styles.itemName}>{selectedItem.name}</Text>
              
              <View style={styles.portionContainer}>
                <Text style={styles.inputLabel}>Количество</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => setPortionSize(Math.max(0.5, portionSize - 0.5))}
                  >
                    <Ionicons name="remove" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityText}>
                    {portionSize} {selectedItem.unit}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => setPortionSize(Math.min(selectedItem.quantity, portionSize + 0.5))}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {selectedItem.nutriments && (
                <View style={styles.nutrientsContainer}>
                  <View style={styles.nutrientBubble}>
                    <Text style={styles.nutrientLabel}>Калории</Text>
                    <Text style={styles.nutrientValue}>
                      {Math.round(selectedItem.nutriments.calories * (portionSize / selectedItem.quantity))}
                    </Text>
                  </View>

                  <View style={styles.nutrientBubble}>
                    <Text style={styles.nutrientLabel}>Протеини</Text>
                    <Text style={styles.nutrientValue}>
                      {Math.round(selectedItem.nutriments.protein * (portionSize / selectedItem.quantity))}г
                    </Text>
                  </View>

                  <View style={styles.nutrientBubble}>
                    <Text style={styles.nutrientLabel}>Въглехидрати</Text>
                    <Text style={styles.nutrientValue}>
                      {Math.round(selectedItem.nutriments.carbs * (portionSize / selectedItem.quantity))}г
                    </Text>
                  </View>

                  <View style={styles.nutrientBubble}>
                    <Text style={styles.nutrientLabel}>Мазнини</Text>
                    <Text style={styles.nutrientValue}>
                      {Math.round(selectedItem.nutriments.fat * (portionSize / selectedItem.quantity))}г
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  handleEatItem(selectedItem, portionSize);
                  setIsEatModalVisible(false);
                  setSelectedItem(null);
                  setPortionSize(1);
                }}
              >
                <Ionicons name="restaurant-outline" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Отчети хранене</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );

  const EditModal = () => {
    if (!editingItem) return null;

    const [name, setName] = useState(editingItem.name);
    const [quantity, setQuantity] = useState(editingItem.quantity.toString());
    const [unit, setUnit] = useState(editingItem.unit);
    const [calories, setCalories] = useState(editingItem.nutriments?.calories?.toString() || '');
    const [protein, setProtein] = useState(editingItem.nutriments?.protein?.toString() || '');
    const [carbs, setCarbs] = useState(editingItem.nutriments?.carbs?.toString() || '');
    const [fat, setFat] = useState(editingItem.nutriments?.fat?.toString() || '');

    const handleSave = async () => {
      if (!user) return;

      try {
        await updateDoc(doc(db, 'users', user.uid, 'inventory', editingItem.id), {
          name,
          quantity: parseInt(quantity),
          unit,
          nutriments: {
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbs: parseFloat(carbs),
            fat: parseFloat(fat),
          },
        });
        setIsEditModalVisible(false);
        setEditingItem(null);
        Alert.alert('Success', 'Item updated successfully!');
      } catch (error) {
        console.error('Error updating item:', error);
        Alert.alert('Error', 'There was a problem updating the item.');
      }
    };

    return (
      <Modal visible={isEditModalVisible} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Редактирайте продукт</Text>

            <Text style={styles.sectionHeader}>Обща информация</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Име на продукта"
            />
            <TextInput
              style={styles.textInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Количество"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.textInput}
              value={unit}
              onChangeText={setUnit}
              placeholder="Мерна единица"
            />

            <Text style={styles.sectionHeader}>Хранителна информация</Text>
            <TextInput
              style={styles.textInput}
              value={calories}
              onChangeText={setCalories}
              placeholder="Калории"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.textInput}
              value={protein}
              onChangeText={setProtein}
              placeholder="Протеини"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.textInput}
              value={carbs}
              onChangeText={setCarbs}
              placeholder="Въглехидрати"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.textInput}
              value={fat}
              onChangeText={setFat}
              placeholder="Мазнини"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Запази</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Отказ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <StyledView style={styles.container}>
      <StyledView style={styles.header}>
        <StyledText style={styles.headerTitle}>Вашият инвентар</StyledText>
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
          onChangeText={setSearchQuery}
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
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleAddItem}
      />

      <EatModal />
      <EditModal />
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
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 12,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
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
    bottom: 24,
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
});

export default InventoryScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { styled } from 'nativewind';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

  const renderItem = ({ item }: { item: InventoryItem }) => {
    // Add color indicators based on quantity
    const getQuantityColor = (quantity: number) => {
      if (quantity <= 1) return colors.error;
      if (quantity <= 3) return colors.warning;
      return colors.success;
    };

    return (
      <Animated.View style={[
        styles.itemCard, 
        { opacity: item.fadeAnim }
      ]}>
        <StyledView style={styles.itemHeader}>
          <StyledText style={styles.itemName}>{item.name}</StyledText>
          <StyledTouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </StyledTouchableOpacity>
        </StyledView>

        <StyledView style={styles.itemDetails}>
          <StyledView style={styles.quantityContainer}>
            <StyledTouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, -1)}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </StyledTouchableOpacity>
            
            <StyledText style={styles.quantityText}>
              {item.quantity} {item.unit}
            </StyledText>
            
            <StyledTouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, 1)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </StyledTouchableOpacity>
          </StyledView>

          <StyledView style={styles.nutrientsContainer}>
            <StyledView style={styles.nutrientBubble}>
              <StyledText style={styles.nutrientLabel}>Калории</StyledText>
              <StyledText style={styles.nutrientValue}>
                {item.nutriments?.calories ? Math.round(item.nutriments.calories) : '-'}
              </StyledText>
            </StyledView>
            <StyledView style={styles.nutrientBubble}>
              <StyledText style={styles.nutrientLabel}>Протеини</StyledText>
              <StyledText style={styles.nutrientValue}>
                {item.nutriments?.protein ? `${Math.round(item.nutriments.protein)}g` : '-'}
              </StyledText>
            </StyledView>
            <StyledView style={styles.nutrientBubble}>
              <StyledText style={styles.nutrientLabel}>Въгл.</StyledText>
              <StyledText style={styles.nutrientValue}>
                {item.nutriments?.carbs ? `${Math.round(item.nutriments.carbs)}g` : '-'}
              </StyledText>
            </StyledView>
            <StyledView style={styles.nutrientBubble}>
              <StyledText style={styles.nutrientLabel}>Мазнини</StyledText>
              <StyledText style={styles.nutrientValue}>
                {item.nutriments?.fat ? `${Math.round(item.nutriments.fat)}g` : '-'}
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </Animated.View>
    );
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.2)', // Error color with opacity
  },
  itemDetails: {
    gap: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.input,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quantityButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quantityText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  nutrientsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.input,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  nutrientBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.15)', // Secondary color with opacity
    borderRadius: 8,
    padding: 6,
    minWidth: 65,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)', // Secondary color border
  },
  nutrientLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: 2,
  },
  nutrientValue: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
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
});

export default InventoryScreen;
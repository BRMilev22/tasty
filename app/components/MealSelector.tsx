import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchRandomMeals, getFavoriteMeals, toggleFavorite } from '../services/mealService';
import { Meal } from '../data/predefinedMeals';
import { auth } from '../../firebaseConfig';
import { useNavigation, NavigationProp } from '@react-navigation/native';

interface MealSelectorProps {
  onSelect: (meal: Meal) => void;
  onManualAdd: () => void;
}

const categories = [
  'всички',
  'закуска',
  'основно',
  'салата',
  'десерт',
  'снакс',
];

const { width: screenWidth } = Dimensions.get('window');

// Add this type definition
type RootStackParamList = {
  mealDetail: { meal: any };
  // ... other routes
};

const MealSelector = ({ onSelect, onManualAdd }: MealSelectorProps) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('всички');
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadMeals();
    loadFavorites();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const newMeals = await fetchRandomMeals(200);
      console.log(`Loaded ${newMeals.length} meals`); // Debug log
      if (newMeals.length === 0) {
        // Show error message to user
        Alert.alert(
          'Error',
          'Could not load meals. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      setMeals(newMeals);
    } catch (error) {
      console.error('Error in loadMeals:', error);
      Alert.alert(
        'Error',
        'Failed to load meals. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const storedFavorites = await getFavoriteMeals();
      setFavorites(storedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleToggleFavorite = async (mealId: string) => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please log in to save favorites');
        return;
      }
      const newFavorites = await toggleFavorite(mealId);
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorite:', error);
      Alert.alert('Error', 'Failed to save favorite');
    }
  };

  const filteredMeals = meals.filter(meal => {
    const matchesCategory = selectedCategory === 'всички' || meal.category === selectedCategory;
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = showOnlyFavorites ? favorites.includes(meal.id) : true;
    return matchesCategory && matchesSearch && matchesFavorites;
  });

  const renderCategoryPill = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === item && styles.categoryPillSelected
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryPillText,
        selectedCategory === item && styles.categoryPillTextSelected
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderMealCard = ({ item }: { item: Meal }) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
      <TouchableOpacity
        style={styles.carouselItem}
        onPress={() => navigation.navigate('mealDetail', { meal: item })}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.mealImage}
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(item.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#e74c3c' : '#fff'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.name}</Text>
          <Text style={styles.mealCalories}>{item.calories} kcal</Text>
          <View style={styles.macrosContainer}>
            <Text style={styles.macroText}>🥩 {item.protein}g</Text>
            <Text style={styles.macroText}>🍚 {item.carbs}g</Text>
            <Text style={styles.macroText}>🥑 {item.fats}g</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Търсене на ястие..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          onPress={() => setShowOnlyFavorites(!showOnlyFavorites)} 
          style={styles.favoriteFilterButton}
        >
          <Ionicons 
            name={showOnlyFavorites ? "heart" : "heart-outline"} 
            size={24} 
            color={showOnlyFavorites ? "#e74c3c" : "#4CAF50"} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={loadMeals} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryPill}
        keyExtractor={(item) => item}
        style={styles.categoryList}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.container}>
        <FlatList
          data={filteredMeals}
          renderItem={renderMealCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToInterval={300}
          decelerationRate="fast"
          ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
        />
      </View>

      <TouchableOpacity style={styles.manualButton} onPress={onManualAdd}>
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.manualButtonText}>Ръчно въвеждане</Text>
      </TouchableOpacity>

      <Modal
        visible={!!selectedMeal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMeal(null)}
      >
        {selectedMeal && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
              
              <View style={styles.nutritionInfo}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Калории</Text>
                  <Text style={styles.nutritionValue}>{selectedMeal.calories}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Протеини</Text>
                  <Text style={styles.nutritionValue}>{selectedMeal.protein}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Въглехидрати</Text>
                  <Text style={styles.nutritionValue}>{selectedMeal.carbs}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Мазнини</Text>
                  <Text style={styles.nutritionValue}>{selectedMeal.fats}g</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setSelectedMeal(null)}
                >
                  <Text style={styles.buttonText}>Отказ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    onSelect(selectedMeal);
                    setSelectedMeal(null);
                  }}
                >
                  <Text style={styles.buttonText}>Запиши</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    backgroundColor: '#000000',
  },
  container: {
    height: 380,
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  listContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  carouselItem: {
    width: 280,
    height: 320,
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 10,
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  mealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mealInfo: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  nutritionRow: {
    flexDirection: 'column',
    gap: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 6,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  macroText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  nutritionInfo: {
    width: '100%',
    marginBottom: 20,
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333333',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: 20,
    marginTop: 80,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 16,
  },
  categoryList: {
    marginHorizontal: 20,
    marginBottom: 8,
    height: 26,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryPillSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  favoriteFilterButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default MealSelector;
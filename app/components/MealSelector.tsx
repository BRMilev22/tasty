import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image?: string;
}

interface MealSelectorProps {
  onSelect: (meal: Meal) => void;
  onManualAdd: () => void;
}

const predefinedMeals: Meal[] = [
  {
    id: '1',
    name: 'Овесена каша',
    calories: 307,
    protein: 13,
    carbs: 55,
    fats: 5,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoi_fZKXZ4mTHNc99gpyFQyh9beF3AFzRYg&s',
  },
  {
    id: '2',
    name: 'Пилешки гърди',
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    image: 'https://www.lunchbox.eu/wp-content/uploads/2020/08/flavouredsome-chiken-brest.jpg',
  },
];

const { width: screenWidth } = Dimensions.get('window');

const MealSelector = ({ onSelect, onManualAdd }: MealSelectorProps) => {
  const [selectedMeal, setSelectedMeal] = React.useState<Meal | null>(null);

  const renderMealCard = ({ item }: { item: Meal }) => {
    return (
      <TouchableOpacity
        style={styles.carouselItem}
        onPress={() => setSelectedMeal(item)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.mealImage}
          />
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.name}</Text>
          <View style={styles.nutritionRow}>
            <Text style={styles.mealCalories}>{item.calories} kcal</Text>
            <View style={styles.macros}>
              <Text style={styles.macroText}>🥩 {item.protein}g</Text>
              <Text style={styles.macroText}>🍚 {item.carbs}g</Text>
              <Text style={styles.macroText}>🥑 {item.fats}g</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <FlatList
          data={predefinedMeals}
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
  },
  container: {
    height: 400,
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  carouselItem: {
    width: 280,
    height: 320,
    backgroundColor: 'white',
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
    padding: 15,
    flex: 1,
    justifyContent: 'space-between',
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'column',
    gap: 4,
  },
  mealCalories: {
    fontSize: 15,
    color: '#e74c3c',
    fontWeight: '600',
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  macroText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00aaff',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    justifyContent: 'center',
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '400',
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
    backgroundColor: '#e74c3c',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MealSelector;
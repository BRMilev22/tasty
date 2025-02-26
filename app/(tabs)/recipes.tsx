import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { collection, onSnapshot, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { fetchRecipesFromBgGPT } from '../../services/recipeService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const auth = getAuth();

interface Recipe {
  id: string;
  title: string;
  description: string;
  fullRecipe: string[];
  rating: number;
}

const RecipesScreen = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const unsubscribe = onSnapshot(collection(db, `users/${userId}/recipes`), (snapshot) => {
        const recipesData: Recipe[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('Recipe data from Firestore:', data);
          return {
            id: doc.id,
            ...data,
          } as Recipe;
        });
        setRecipes(recipesData);
      });

      return () => unsubscribe();
    }
  }, [auth.currentUser]);

  const generateRecipesFromInventory = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const inventorySnapshot = await getDocs(collection(db, `users/${userId}/inventory`));
      const inventory = inventorySnapshot.docs.map((doc) => doc.data().name);

      if (inventory.length === 0) {
        Alert.alert('Няма съставки', 'Инвентарът Ви е празен.');
        return;
      }

      const generatedRecipes = await fetchRecipesFromBgGPT(inventory);

      for (const recipe of generatedRecipes) {
        await addDoc(collection(db, `users/${userId}/recipes`), recipe);
      }

      Alert.alert('Рецептите са генерирани!', 'Добавени са нови рецепти на база на Вашия инвентар.');
    } catch (error) {
      console.error('Error generating recipes:', error);
      Alert.alert('Грешка', 'Рецептите не бяха създадени.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const closeModal = () => {
    setSelectedRecipe(null);
  };

  const deleteRecipe = async (id: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await deleteDoc(doc(db, `users/${userId}/recipes`, id));
      Alert.alert('Рецептата е изтрита', 'Рецептата бе изтрита успешно.');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert('Грешка', 'Рецептата не бе изтрита.');
    }
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <Ionicons name="restaurant-outline" size={24} color="white" />
        <Text style={styles.recipeTitle}>
          {item.title.replace(/"/g, '').replace(/,$/, '').trim()}
        </Text>
      </View>
      <Text style={styles.recipeDescription}>
        {item.description.replace(/"/g, '').replace(/,$/, '').trim()}
      </Text>
      <Text style={styles.recipeRating}>Оценка: {'⭐'.repeat(item.rating)}</Text>

      <TouchableOpacity 
        style={styles.viewButton} 
        onPress={() => handleRecipeClick(item)}
      >
        <Ionicons name="book-outline" size={20} color="white" />
        <Text style={styles.buttonText}>Вижте рецептата</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => deleteRecipe(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        <Text style={styles.deleteButtonText}>Изтрийте рецептата</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вашите рецепти</Text>
      <Text style={styles.subtitle}>Изкуственият интелект не е безгрешен – той е тук, за да Ви вдъхновява, но Вие сте майсторът в кухнята!</Text>

      <TouchableOpacity 
        style={styles.generateButton} 
        onPress={generateRecipesFromInventory}
      >
        <Ionicons name="flask-outline" size={24} color="white" />
        <Text style={styles.buttonText}>
          {loading ? 'Генериране...' : 'Генерирайте рецепти'}
        </Text>
      </TouchableOpacity>

      {recipes.length === 0 ? (
        <Text style={styles.emptyText}>Няма налични рецепти.</Text>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}

      <Modal visible={!!selectedRecipe} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              {selectedRecipe && (
                <>
                  <Text style={styles.modalTitle}>
                    {selectedRecipe.title.replace(/"/g, '').replace(/,$/, '').trim()}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {selectedRecipe.description.replace(/"/g, '').replace(/,$/, '').trim()}
                  </Text>
                  <Text style={styles.recipeRating}>Оценка: {'⭐'.repeat(selectedRecipe.rating)}</Text>
                  
                  <Text style={styles.instructions}>
                    {(() => {
                      try {
                        const recipeText = selectedRecipe?.fullRecipe;
                        
                        if (!recipeText) {
                          return 'Няма налична рецепта.';
                        }

                        if (Array.isArray(recipeText)) {
                          return recipeText
                            .map(step => step
                              .replace(/^"/, '')
                              .replace(/"$/, '')
                              .replace(/^Стъпка \d+: /, '')
                              .replace(/^description": "/, '')
                              .replace(/^fullRecipe": \[/, '')
                              .replace(/^],$/, '')
                              .replace(/,$/, '')
                              .replace(/rating":\d+/, '')
                              .replace(/rating":/, '')
                              .replace(/},?$/, '')
                              .replace(/"/g, '')
                              .replace(/\d+$/, '')
                              .trim()
                            )
                            .filter(step => 
                              step.length > 0 && 
                              step !== '[' && 
                              step !== ']' && 
                              !step.match(/^",$/) && 
                              !step.match(/^description":/) && 
                              !step.match(/^fullRecipe":/) &&
                              !step.match(/^rating":/)
                            )
                            .join('\n\n');
                        }
                        
                        return 'Неподдържан формат на рецептата.';
                      } catch (error) {
                        console.error('Error formatting recipe:', error);
                        return 'Грешка при форматирането на рецептата.';
                      }
                    })()}
                  </Text>
                </>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeModal}
            >
              <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
              <Text style={styles.closeButtonText}>Затворете</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 44,
    marginBottom: 8,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  generateButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  recipeCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  recipeDescription: {
    color: '#999999',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeRating: {
    color: '#FFB800',
    marginBottom: 16,
    fontSize: 14,
  },
  viewButton: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  deleteButtonText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  modalScroll: {
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalDescription: {
    color: '#999999',
    marginBottom: 16,
    lineHeight: 20,
  },
  instructions: {
    color: '#FFFFFF',
    lineHeight: 24,
    fontSize: 16,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  closeButtonText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontWeight: '600',
  },
  nutrientBubble: {
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nutrientLabel: {
    color: '#999999',
    fontSize: 12,
    marginBottom: 4,
  },
  nutrientValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RecipesScreen;
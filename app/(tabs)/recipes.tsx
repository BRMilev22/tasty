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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  subtitle: {
    color: 'pink',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 0,
    marginHorizontal: 20,
  },
  generateButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  recipeCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginLeft: 12,
  },
  recipeDescription: {
    color: '#A0A0A0',
    marginTop: 4,
    fontStyle: 'italic',
  },
  recipeRating: {
    color: '#FFB800',
    marginTop: 4,
  },
  viewButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#e74c3c',
    marginLeft: 8,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  modalScroll: {
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalDescription: {
    color: '#A0A0A0',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  instructions: {
    color: '#E5E5E5',
    lineHeight: 24,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#e74c3c',
    marginLeft: 8,
  },
});

export default RecipesScreen;
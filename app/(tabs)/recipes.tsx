import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, Pressable, ScrollView } from 'react-native';
import { collection, onSnapshot, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { fetchRecipesFromCohere } from '../../services/recipeService';
import { styled } from 'nativewind';
import Ionicons from 'react-native-vector-icons/Ionicons';

const auth = getAuth();

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledPressable = styled(Pressable);
const StyledScrollView = styled(ScrollView);

interface Recipe {
  id: string;
  title: string;
  description: string;
  fullRecipe: string[]; // Ensure it's an array for correct formatting
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
        const recipesData: Recipe[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Recipe[];
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

      const generatedRecipes = await fetchRecipesFromCohere(inventory);

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

  return (
    <StyledView className="flex-1 bg-black p-5">
      <StyledText className="text-2xl font-bold text-white text-center mt-10 mb-5">Вашите рецепти</StyledText>

      {/* Generate Recipes Button */}
      <StyledTouchableOpacity className="bg-white p-4 rounded-lg mb-5 border border-green-500 flex-row items-center justify-center" onPress={generateRecipesFromInventory}>
        <Ionicons name="flask-outline" size={24} color="black" />
        <StyledText className="text-black text-center text-lg ml-2">
          {loading ? 'Генериране...' : 'Генерирайте рецепти'}
        </StyledText>
      </StyledTouchableOpacity>

      {/* Recipe List */}
      {recipes.length === 0 ? (
        <StyledText className="text-white text-center text-lg">Няма налични рецепти.</StyledText>
      ) : (
        <StyledFlatList
          data={recipes}
          renderItem={({ item }) => (
            <StyledView className="bg-black p-5 rounded-lg mb-4 border border-green-500">
              <View className="flex-row items-center">
                <Ionicons name="restaurant-outline" size={24} color="white" />
                <StyledText className="text-lg font-bold text-white flex-1 ml-3">{item.title}</StyledText>
              </View>
              <StyledText className="text-gray-400 mt-1 italic">{item.description}</StyledText>
              <StyledText className="text-yellow-400 mt-1">Оценка: {'⭐'.repeat(item.rating)}</StyledText>

              {/* Show Full Recipe Button */}
              <StyledTouchableOpacity className="mt-3 p-2 bg-white rounded-lg border border-green-500 flex-row items-center justify-center" onPress={() => handleRecipeClick(item)}>
                <Ionicons name="book-outline" size={20} color="black" />
                <StyledText className="text-black ml-2">Вижте рецептата</StyledText>
              </StyledTouchableOpacity>

              {/* Delete Recipe Button */}
              <StyledTouchableOpacity className="mt-3 p-2 bg-white rounded-lg border border-red-500 flex-row items-center justify-center" onPress={() => deleteRecipe(item.id)}>
                <Ionicons name="trash-outline" size={20} color="red" />
                <StyledText className="text-red-500 ml-2">Изтрийте рецептата</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Full Recipe Modal */}
      {selectedRecipe && (
        <StyledModal visible={true} animationType="slide" transparent={true}>
          <StyledView className="flex-1 justify-center items-center bg-black/80">
            <StyledView className="bg-black p-6 rounded-lg w-4/5 border border-green-500 max-h-[80%]">
              <StyledScrollView className="max-h-[70%]">
                <StyledText className="text-xl font-bold text-white mb-2">{selectedRecipe.title}</StyledText>
                <StyledText className="text-gray-400 italic mb-2">{selectedRecipe.description}</StyledText>
                <StyledText className="text-yellow-400 mb-4">Оценка: {'⭐'.repeat(selectedRecipe.rating)}</StyledText>

                {/* Formatted Recipe Steps */}
                <StyledText className="text-lg font-bold text-white mb-2">Инструкции:</StyledText>
                {Array.isArray(selectedRecipe.fullRecipe) ? (
                  selectedRecipe.fullRecipe.map((step, index) => (
                    <StyledText key={index} className="text-gray-300 leading-6 mb-2">
                      {index + 1}. {step.trim()}
                    </StyledText>
                  ))
                ) : (
                  <StyledText className="text-gray-300 leading-6">
                    {selectedRecipe.fullRecipe?.trim() || 'Няма налична рецепта.'}
                  </StyledText>
                )}
              </StyledScrollView>

              <StyledPressable className="bg-white p-3 rounded-lg border border-red-500 flex-row items-center justify-center mt-5" onPress={closeModal}>
                <Ionicons name="close-circle-outline" size={20} color="red" />
                <StyledText className="text-red-500 ml-2">Затворете</StyledText>
              </StyledPressable>
            </StyledView>
          </StyledView>
        </StyledModal>
      )}
    </StyledView>
  );
};

export default RecipesScreen;
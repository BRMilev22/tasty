import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ImageBackground, Modal, Pressable } from 'react-native';
import { collection, onSnapshot, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { fetchRecipesFromCohere } from '../../services/recipeService';
import { styled } from 'nativewind';

const auth = getAuth();

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImageBackground = styled(ImageBackground);
const StyledModal = styled(Modal);
const StyledPressable = styled(Pressable);

interface Recipe {
  id: string;
  title: string;
  description: string;
  fullRecipe: string; // Full recipe content
  rating: number;
}

const RecipesScreen = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null); // Selected recipe for modal

  // Load existing recipes from Firestore on component mount
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const unsubscribe = onSnapshot(
        collection(db, `users/${userId}/recipes`),
        (snapshot) => {
          const recipesData: Recipe[] = [];
          snapshot.forEach((doc) => {
            const recipeData = doc.data();
            // Ensure fullRecipe is available
            const recipe = { id: doc.id, ...recipeData } as Recipe;
            recipesData.push(recipe);
          });
          setRecipes(recipesData);
        }
      );

      return () => unsubscribe();
    }
  }, [auth.currentUser]);

  // Fetch inventory, send to AI, and save generated recipes
  const generateRecipesFromInventory = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Fetch user inventory
      const inventorySnapshot = await getDocs(collection(db, `users/${userId}/inventory`));
      const inventory = inventorySnapshot.docs.map((doc) => doc.data().name);

      if (inventory.length === 0) {
        Alert.alert('Няма съставки', 'Инвентарът Ви е празен.');
        return;
      }

      // Generate recipes from AI (using Cohere API)
      const generatedRecipes = await fetchRecipesFromCohere(inventory);

      // Save each recipe to Firestore
      for (const recipe of generatedRecipes) {
        await addDoc(collection(db, `users/${userId}/recipes`), recipe);
      }

      Alert.alert('Рецептите са генерирани', 'Рецептите, генерирани с изкуствен интелект, са добавени!');
    } catch (error) {
      console.error('Error generating recipes:', error);
      Alert.alert('Грешка', 'Рецептите не са създадени.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe); // Set the selected recipe to show in modal
  };

  const closeModal = () => {
    setSelectedRecipe(null); // Close modal by setting null
  };

  // Function to delete a recipe from Firestore
  const deleteRecipe = async (id: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await deleteDoc(doc(db, `users/${userId}/recipes`, id)); // Delete recipe from Firestore
      Alert.alert('Рецептата е изтрита', 'Рецептата бе изтрита успешно.');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert('Грешка', 'Рецептата не бе изтрита.');
    }
  };

  return (
    <StyledImageBackground
      source={{
        uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
      }}
      className="flex-1 bg-[#141e30]"
      blurRadius={20}
    >
      <StyledView className="flex-1 top-10 p-5">
        <StyledText className="text-2xl font-bold text-center text-blue-500 mb-5">
          Вашите рецепти
        </StyledText>

        <StyledTouchableOpacity
          className="bg-blue-500 p-4 rounded-lg bottom-5 mt-5"
          onPress={generateRecipesFromInventory}
        >
          <StyledText className="text-white text-center">
            {loading ? 'Рецептите се генерират...' : 'Генерирайте рецепти със съставките от инвентара'}
          </StyledText>
        </StyledTouchableOpacity>

        {/* List of recipes */}
        <StyledFlatList
          data={recipes}
          renderItem={({ item }) => (
            <StyledView className="bg-white p-5 rounded-lg mb-4 shadow-lg">
              <StyledText className="text-lg font-bold">{item.title}</StyledText>
              <StyledText className="text-gray-400">{item.description}</StyledText>
              <StyledText className="text-gray-600">Оценка: {'⭐'.repeat(item.rating)}</StyledText>

              {/* Show full recipe when clicked */}
              <StyledTouchableOpacity
                className="mt-3 p-2 bg-blue-500 rounded"
                onPress={() => {
                    const fullRecipeText = item.fullRecipe.join('\n\n');
                    Alert.alert(item.title, fullRecipeText, [{ text: 'Затворете' }], { cancelable: true });
                }}
              >
                <StyledText className="text-white text-center">Вижте цялата рецепта</StyledText>
              </StyledTouchableOpacity>

              {/* Delete Button */}
              <StyledTouchableOpacity
                className="mt-3 p-2 bg-red-500 rounded"
                onPress={() => {
                  // Ask for confirmation before deleting
                  Alert.alert(
                    'Потвърдете изтриването',
                    'Сигурни ли сте, че искате да изтриете рецептата?',
                    [
                      { text: 'Откажете' },
                      { text: 'Изтрийте', onPress: () => deleteRecipe(item.id) },
                    ],
                    { cancelable: true }
                  );
                }}
              >
                <StyledText className="text-white text-center">Изтрийте рецептата</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          )}
          keyExtractor={(item) => item.id}
        />
      </StyledView>

      {/* Modal for full recipe */}
      {selectedRecipe && (
        <StyledModal visible={true} animationType="slide" transparent={true}>
          <StyledView className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <StyledView className="bg-white p-5 rounded-lg w-4/5">
              <StyledText className="text-xl font-bold mb-4">{selectedRecipe.title}</StyledText>
              {/* Ensure fullRecipe is displayed */}
              <StyledText className="text-lg mb-4">{selectedRecipe.fullRecipe || "No full recipe available."}</StyledText>
              <StyledPressable onPress={closeModal} className="bg-red-500 p-2 rounded-md">
                <StyledText className="text-white text-center">Затворете</StyledText>
              </StyledPressable>
            </StyledView>
          </StyledView>
        </StyledModal>
      )}
    </StyledImageBackground>
  );
};

export default RecipesScreen;
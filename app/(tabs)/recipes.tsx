import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Modal, TextInput, TouchableOpacity, Pressable, Alert, ImageBackground } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';

const auth = getAuth();

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);
const StyledImageBackground = styled(ImageBackground);

// Interface for the recipe structure
interface Recipe {
  id: string;
  title: string;
  description: string;
  rating: number;
}

const RecipesScreen = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newRecipe, setNewRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const auth = getAuth(); // Get the current user's authentication state

  // Load existing recipes from Firestore on component mount
  useEffect(() => {
    const userId = auth.currentUser?.uid; // Get the current user's ID
    if (userId) {
      const unsubscribe = onSnapshot(
        collection(db, `users/${userId}/recipes`), // Load recipes specific to the user
        (snapshot) => {
          const recipesData: Recipe[] = [];
          snapshot.forEach((doc) => {
            recipesData.push({ id: doc.id, ...doc.data() } as Recipe); // Ensure correct typing
          });
          setRecipes(recipesData);
        }
      );

      return () => unsubscribe(); // Cleanup subscription on unmount
    }
  }, [auth.currentUser]);

  const handleRecipeSave = async () => {
    if (newRecipe && newRecipe.title.trim() && newRecipe.description.trim()) {
      const userId = auth.currentUser?.uid; // Get the current user's ID
      if (!userId) {
        Alert.alert('Authentication Error', 'You must be logged in to save recipes.');
        return;
      }

      try {
        const recipesRef = collection(db, `users/${userId}/recipes`); // Reference to the user's recipes collection
        if (isEditing) {
          // Update existing recipe
          const recipeDocRef = doc(db, `users/${userId}/recipes/${newRecipe.id}`);
          await updateDoc(recipeDocRef, {
            title: newRecipe.title,
            description: newRecipe.description,
            rating: newRecipe.rating,
          });
        } else {
          // Add new recipe
          await addDoc(recipesRef, {
            title: newRecipe.title,
            description: newRecipe.description,
            rating: newRecipe.rating
          });
        }
        setModalVisible(false);
        setNewRecipe(null);
        setIsEditing(false);
      } catch (error) {
        Alert.alert('Error', 'Could not save recipe. Please try again.');
      }
    } else {
      Alert.alert('Input Error', 'Please fill in both the title and description.');
    }
  };

  const deleteRecipe = async (id: string) => {
    const userId = auth.currentUser?.uid; // Get the current user's ID
    if (!userId) {
      Alert.alert('Authentication Error', 'You must be logged in to delete recipes.');
      return;
    }
    
    try {
      await deleteDoc(doc(db, `users/${userId}/recipes`, id)); // Reference to the user's specific recipe
      Alert.alert('Success', 'Recipe deleted successfully.');
    } catch (error) {
      Alert.alert('Error', 'Could not delete recipe. Please try again.');
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <StyledView className="bg-white p-5 rounded-lg mb-4 shadow-lg">
      <StyledText className="text-lg font-bold">{item.title}</StyledText>
      <StyledText className="text-gray-400">{item.description}</StyledText>
      <StyledText className="text-gray-600">Rating: {'⭐'.repeat(item.rating)}</StyledText>
      <StyledView className="flex-row justify-between mt-3">
        <StyledTouchableOpacity
          className="bg-blue-500 p-2 rounded-lg"
          onPress={() => {
            setNewRecipe(item);
            setIsEditing(true);
            setModalVisible(true);
          }}
        >
          <StyledText className="text-white">Edit</StyledText>
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          className="bg-red-500 p-2 rounded-lg"
          onPress={() => deleteRecipe(item.id)}
        >
          <StyledText className="text-white">Delete</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );

  return (
    <StyledImageBackground
      source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
      className="flex-1 justify-center items-center bg-[#141e30]"
      blurRadius={20}
    >
      <StyledView className="flex-1 justify-center items-center p-5">
        <StyledText className="text-2xl font-bold text-center text-blue-500 mb-5">Your Recipes</StyledText>

        <StyledTouchableOpacity
          className="bg-blue-500 p-4 rounded-lg mt-5"
          onPress={() => {
            setNewRecipe({ id: '', title: '', description: '', rating: 0 });
            setModalVisible(true);
            setIsEditing(false); // Ensure this is reset when opening the modal
          }}
        >
          <StyledText className="text-white text-center">Add New Recipe</StyledText>
        </StyledTouchableOpacity>

        {/* Modal for adding/editing recipes */}
        <StyledModal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <StyledView className="flex-1 justify-center items-center bg-black/50">
            <StyledView className="bg-white p-6 rounded-lg w-4/5">
              <StyledText className="text-xl font-bold mb-4">{isEditing ? 'Edit Recipe' : 'Add Recipe'}</StyledText>

              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Recipe Title"
                value={newRecipe?.title}
                onChangeText={(text) => setNewRecipe((prev) => (prev ? { ...prev, title: text } : prev))}
              />
              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Description"
                value={newRecipe?.description}
                onChangeText={(text) => setNewRecipe((prev) => (prev ? { ...prev, description: text } : prev))}
              />
              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Rating (1-5)"
                keyboardType="numeric"
                value={newRecipe?.rating?.toString()}
                onChangeText={(text) => {
                  const rating = parseInt(text, 10);
                  if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                    setNewRecipe((prev) => (prev ? { ...prev, rating } : prev));
                  }
                }}
              />

              <StyledView className="flex-row justify-between">
                <StyledPressable
                  className="bg-blue-500 p-3 rounded-lg flex-1 mr-2"
                  onPress={handleRecipeSave}
                >
                  <StyledText className="text-white text-center">Save</StyledText>
                </StyledPressable>

                <StyledPressable
                  className="bg-red-500 p-3 rounded-lg flex-1 ml-2"
                  onPress={() => {
                    setNewRecipe(null);
                    setModalVisible(false);
                  }}
                >
                  <StyledText className="text-white text-center">Cancel</StyledText>
                </StyledPressable>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledModal>
      </StyledView>
    </StyledImageBackground>
  );
};

export default RecipesScreen;
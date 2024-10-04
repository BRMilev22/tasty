import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';

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

  const openRecipeForm = () => {
    setNewRecipe({ id: Date.now().toString(), title: '', description: '', rating: 0 });
    setModalVisible(true);
  };

  const handleRecipeSave = () => {
    if (newRecipe && newRecipe.title.trim() && newRecipe.description.trim()) {
      setRecipes((prevRecipes) => {
        if (isEditing) {
          return prevRecipes.map((recipe) =>
            recipe.id === newRecipe.id ? newRecipe : recipe
          );
        }
        return [...prevRecipes, newRecipe];
      });
      setModalVisible(false);
      setNewRecipe(null);
      setIsEditing(false);
    } else {
      Alert.alert('Input Error', 'Please fill in both the title and description.');
    }
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prevRecipes) => prevRecipes.filter((recipe) => recipe.id !== id));
    setModalVisible(false);
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity style={styles.recipeContainer}>
      <Text style={styles.recipeText}>{item.title}</Text>
      <Text style={styles.recipeDescription}>{item.description}</Text>
      <Text style={styles.recipeRating}>Rating: {'⭐'.repeat(item.rating)}</Text>
      <TouchableOpacity onPress={() => {
        setNewRecipe(item);
        setIsEditing(true);
        setModalVisible(true);
      }}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteRecipe(item.id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Recipes</Text>
      <TouchableOpacity style={styles.addButton} onPress={openRecipeForm}>
        <Text style={styles.buttonText}>Add Recipe</Text>
      </TouchableOpacity>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {modalVisible && (
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Recipe' : 'Add Recipe'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Recipe Title"
                  value={newRecipe?.title}
                  onChangeText={(text) => setNewRecipe({ ...newRecipe!, title: text })}
                />
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Recipe Description"
                  value={newRecipe?.description}
                  onChangeText={(text) => setNewRecipe({ ...newRecipe!, description: text })}
                  multiline
                />
                <TextInput
                  style={styles.input}
                  placeholder="Rating (1-5)"
                  keyboardType="numeric"
                  value={newRecipe?.rating.toString()}
                  onChangeText={(text) => {
                    const rating = Math.max(1, Math.min(5, parseInt(text))) || 0;
                    setNewRecipe({ ...newRecipe!, rating });
                  }}
                />
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleRecipeSave}>
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  descriptionInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    height: 100, // Make the description input taller
    textAlignVertical: 'top', // Start text at the top
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  recipeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    flexDirection: 'column',
  },
  recipeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#555',
    marginVertical: 5,
  },
  recipeRating: {
    fontSize: 16,
    color: '#666',
  },
  editText: {
    color: '#1e90ff',
    marginTop: 5,
  },
  deleteText: {
    color: '#ff5722',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  closeButton: {
    backgroundColor: '#ff5722',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
});

export default RecipesScreen;
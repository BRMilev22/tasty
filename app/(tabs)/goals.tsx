import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';

const GoalsScreen = () => {
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);

  // Function to add a new goal
  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      setNewGoal(''); // Clear input after adding
    }
  };

  // Function to delete a goal
  const deleteGoal = (index: number) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: () => {
          setGoals((prevGoals) => prevGoals.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  // Function to edit a goal
  const editGoal = () => {
    if (selectedGoalIndex !== null && newGoal.trim()) {
      const updatedGoals = [...goals];
      updatedGoals[selectedGoalIndex] = newGoal;
      setGoals(updatedGoals);
      setModalVisible(false);
      setNewGoal(''); // Clear input after editing
      setSelectedGoalIndex(null);
    }
  };

  // Render each goal
  const renderGoal = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.goalContainer}>
      <Text style={styles.goalText}>{item}</Text>
      <View style={styles.goalActions}>
        <TouchableOpacity onPress={() => {
          setNewGoal(item);
          setSelectedGoalIndex(index);
          setModalVisible(true);
        }}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteGoal(index)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Goals</Text>
      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new goal"
          value={newGoal}
          onChangeText={setNewGoal}
        />
        <TouchableOpacity style={styles.button} onPress={addGoal}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for editing goals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Edit Goal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Update your goal"
              value={newGoal}
              onChangeText={setNewGoal}
            />
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={editGoal}
              >
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e90ff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  goalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    color: '#1e90ff',
    marginRight: 10,
  },
  deleteText: {
    color: '#ff4c4c',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexShrink: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1e90ff',
  },
  cancelButton: {
    backgroundColor: '#ff4c4c',
  },
});

export default GoalsScreen;
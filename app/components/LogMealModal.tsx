import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface LogMealModalProps {
  isVisible: boolean;
  onClose: () => void;
  onMealLogged: () => void;
}

const LogMealModal: React.FC<LogMealModalProps> = ({ isVisible, onClose, onMealLogged }) => {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  
  const auth = getAuth();
  const db = getFirestore();

  const handleSubmit = async () => {
    if (!mealName || !calories || !protein) {
      alert('Моля, попълнете всички полета');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const mealData = {
        name: mealName,
        calories: parseInt(calories),
        protein: parseInt(protein),
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'users', user.uid, 'meals'), mealData);
      
      // Reset form
      setMealName('');
      setCalories('');
      setProtein('');
      
      onMealLogged();
      onClose();
    } catch (error) {
      console.error('Error logging meal:', error);
      alert('Грешка при записване на храненето');
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Запишете хранене</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Име на храната"
            value={mealName}
            onChangeText={setMealName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Калории"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Протеини (грамове)"
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Отказ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSubmit]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Запиши</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#95a5a6',
  },
  buttonSubmit: {
    backgroundColor: '#00aaff',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogMealModal; 
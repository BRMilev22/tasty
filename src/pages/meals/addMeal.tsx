import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import MealSelector from '../../widgets/meal-cards/MealSelector';
import ManualMealInput from '../../features/meal-planning/ui/ManualMealInput';

const AddMealScreen = () => {
  const [showManualInput, setShowManualInput] = useState(false);
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  const handleMealSelect = async (meal: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const mealData = {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'users', user.uid, 'meals'), mealData);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Грешка при записване на храненето');
    }
  };

  return (
    <View style={styles.container}>
      <MealSelector 
        onSelect={handleMealSelect}
        onManualAdd={() => setShowManualInput(true)}
      />
      
      <Modal
        visible={showManualInput}
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <ManualMealInput
          onSubmit={handleMealSelect}
          onCancel={() => setShowManualInput(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
});

export default AddMealScreen; 
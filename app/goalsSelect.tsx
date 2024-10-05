import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // Firebase Auth import

const GoalSelectionScreen = () => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to handle goal selection
  const handleGoalSelection = async (goal: string) => {
    setSelectedGoal(goal);
    setLoading(true);

    if (user) {
      try {
        // Save the user's goal to Firestore
        await setDoc(
          doc(db, 'users', user.uid), // Reference to user's document
          {
            goal: goal, // Save goal field
          },
          { merge: true } // Merge with existing document fields
        );

        // Automatically log the user in and navigate to the dashboard
        //await signInWithEmailAndPassword(auth, user.email, user.password);

        // Navigate to the dashboard after saving
        router.replace('/dashboard');
      } catch (error) {
        console.error('Error saving goal or logging in: ', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Goal</Text>

      {/* Gain Weight Button */}
      <TouchableOpacity
        style={[styles.button, selectedGoal === 'Gain Weight' && styles.selectedButton]}
        onPress={() => handleGoalSelection('Gain Weight')}
        disabled={loading} // Disable button while loading
      >
        <Text style={styles.buttonText}>Gain Weight</Text>
      </TouchableOpacity>

      {/* Maintain Weight Button */}
      <TouchableOpacity
        style={[styles.button, selectedGoal === 'Maintain Weight' && styles.selectedButton]}
        onPress={() => handleGoalSelection('Maintain Weight')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Maintain Weight</Text>
      </TouchableOpacity>

      {/* Lose Weight Button */}
      <TouchableOpacity
        style={[styles.button, selectedGoal === 'Lose Weight' && styles.selectedButton]}
        onPress={() => handleGoalSelection('Lose Weight')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Lose Weight</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#0056b3', // Change color to indicate selected
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default GoalSelectionScreen;
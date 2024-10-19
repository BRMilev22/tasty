import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import

const GenderSelectionScreen = () => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to handle gender selection
  const handleGenderSelection = async (gender: string) => {
    setSelectedGender(gender);
    setLoading(true);

    if (user) {
      try {
        // Save the user's gender to Firestore
        await setDoc(
          doc(db, 'users', user.uid), // Reference to user's document
          {
            gender: gender, // Save gender field
          },
          { merge: true } // Merge with existing document fields
        );

        // Navigate to the next screen (e.g., GoalSelectionScreen)
        router.replace('/dashboard'); // Change to your next screen route
      } catch (error) {
        console.error('Error saving gender: ', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Gender</Text>

      {/* Male Button */}
      <TouchableOpacity
        style={[styles.button, selectedGender === 'Male' && styles.selectedButton]}
        onPress={() => handleGenderSelection('Male')}
        disabled={loading} // Disable button while loading
      >
        <Text style={styles.buttonText}>Male</Text>
      </TouchableOpacity>

      {/* Female Button */}
      <TouchableOpacity
        style={[styles.button, selectedGender === 'Female' && styles.selectedButton]}
        onPress={() => handleGenderSelection('Female')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Female</Text>
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

export default GenderSelectionScreen;
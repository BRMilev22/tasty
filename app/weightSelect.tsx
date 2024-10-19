import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { Picker } from '@react-native-picker/picker'; // Import Picker

const WeightSelectionScreen = () => {
  const [selectedWeight, setSelectedWeight] = useState<string>('70'); // Default weight 70 kg
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to handle weight selection
  const handleWeightSelection = async () => {
    setLoading(true);

    if (user) {
      try {
        // Save the user's weight to Firestore
        await setDoc(
          doc(db, 'users', user.uid), // Reference to user's document
          {
            weight: selectedWeight, // Save weight field
          },
          { merge: true } // Merge with existing document fields
        );

        // Navigate to the next screen (e.g., gender selection)
        router.replace('/genderSelect');
      } catch (error) {
        console.error('Error saving weight: ', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Weight (kg)</Text>

      {/* Weight Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedWeight}
          onValueChange={(itemValue) => setSelectedWeight(itemValue)}
          style={styles.picker}
        >
          {/* Generate weight values from 30 kg to 150 kg */}
          {Array.from({ length: 121 }, (_, i) => 30 + i).map((weight) => (
            <Picker.Item key={weight} label={`${weight} kg`} value={weight.toString()} />
          ))}
        </Picker>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleWeightSelection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Confirm Weight</Text>
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
  pickerContainer: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 10,
    marginVertical: 20,
    width: '80%',
  },
  picker: {
    height: 150,
    width: '100%',
    color: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default WeightSelectionScreen;
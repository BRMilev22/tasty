import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { Picker } from '@react-native-picker/picker'; // Import Picker

const HeightSelectionScreen = () => {
  const [selectedHeight, setSelectedHeight] = useState<string>('170'); // Default height 170cm
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to handle height selection
  const handleHeightSelection = async () => {
    setLoading(true);

    if (user) {
      try {
        // Save the user's height to Firestore
        await setDoc(
          doc(db, 'users', user.uid), // Reference to user's document
          {
            height: selectedHeight, // Save height field
          },
          { merge: true } // Merge with existing document fields
        );

        // Navigate to the next screen (e.g., dashboard or next registration step)
        router.replace('/weightSelect');
      } catch (error) {
        console.error('Error saving height: ', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Height (cm)</Text>

      {/* Height Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedHeight}
          onValueChange={(itemValue) => setSelectedHeight(itemValue)}
          style={styles.picker}
        >
          {/* Generate height values from 130cm to 220cm */}
          {Array.from({ length: 91 }, (_, i) => 130 + i).map((height) => (
            <Picker.Item key={height} label={`${height} cm`} value={height.toString()} />
          ))}
        </Picker>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleHeightSelection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Confirm Height</Text>
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

export default HeightSelectionScreen;
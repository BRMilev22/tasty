import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { styled } from 'nativewind';
import Logo from '../components/Logo';

const StyledImageBackground = styled(ImageBackground);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const theme = {
    colors: {
        primary: '#4CAF50',
        background: '#000000',
        surface: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#999999',
        accent: '#4CAF50',
    }
};

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
    <StyledImageBackground
      source={{ uri: 'https://i.imgur.com/8F9ZGpX.png' }}
      style={styles.backgroundImage}
      blurRadius={5}
    >
      <View style={styles.container}>
        <Logo/>

        <View style={styles.content}>
          <Text style={styles.title}>Изберете пол</Text>

          <TouchableOpacity
            style={[styles.genderButton, selectedGender === 'Male' && styles.selectedButton]}
            onPress={() => handleGenderSelection('Male')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Мъж</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderButton, selectedGender === 'Female' && styles.selectedButton]}
            onPress={() => handleGenderSelection('Female')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Жена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </StyledImageBackground>
  );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -100,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 30,
        textAlign: 'center',
    },
    genderButton: {
        backgroundColor: theme.colors.surface,
        width: '100%',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: theme.colors.primary,
    },
    buttonText: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '500',
    },
});

export default GenderSelectionScreen;
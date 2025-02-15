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

        // Navigate to the heightSelect after saving
        router.replace('/heightSelect');
      } catch (error) {
        console.error('Error saving goal: ', error);
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
          <Text style={styles.title}>Изберете цел</Text>

          <TouchableOpacity
            style={[styles.goalButton, selectedGoal === 'Gain Weight' && styles.selectedButton]}
            onPress={() => handleGoalSelection('Gain Weight')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Повишаване на теглото</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goalButton, selectedGoal === 'Maintain Weight' && styles.selectedButton]}
            onPress={() => handleGoalSelection('Maintain Weight')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Поддържане на теглото</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goalButton, selectedGoal === 'Lose Weight' && styles.selectedButton]}
            onPress={() => handleGoalSelection('Lose Weight')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Отслабване</Text>
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
    goalButton: {
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

export default GoalSelectionScreen;
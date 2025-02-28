import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/Logo';

const StyledImageBackground = styled(ImageBackground);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const theme = {
    colors: {
        primary: '#4CAF50',
        background: {
            dark: '#000000',
            card: 'rgba(30, 30, 30, 0.95)',
            input: 'rgba(40, 40, 40, 0.8)',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#AAAAAA',
            hint: '#666666',
        },
        border: {
            light: 'rgba(255, 255, 255, 0.1)',
            accent: 'rgba(76, 175, 80, 0.3)',
        }
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
      source={undefined}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Logo />
        </View>

        <View style={styles.content}>
          <View style={styles.formBox}>
            <Text style={styles.title}>Изберете цел</Text>
            <Text style={styles.subtitle}>Изберете целта, която искате да постигнете</Text>

            <TouchableOpacity
              style={[styles.goalButton, selectedGoal === 'Gain Weight' && styles.selectedButton]}
              onPress={() => handleGoalSelection('Gain Weight')}
              disabled={loading}
            >
              <Ionicons name="trending-up" size={24} color={selectedGoal === 'Gain Weight' ? theme.colors.text.primary : theme.colors.text.secondary} />
              <Text style={[styles.buttonText, selectedGoal === 'Gain Weight' && styles.selectedText]}>Повишаване на теглото</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, selectedGoal === 'Maintain Weight' && styles.selectedButton]}
              onPress={() => handleGoalSelection('Maintain Weight')}
              disabled={loading}
            >
              <Ionicons name="swap-horizontal" size={24} color={selectedGoal === 'Maintain Weight' ? theme.colors.text.primary : theme.colors.text.secondary} />
              <Text style={[styles.buttonText, selectedGoal === 'Maintain Weight' && styles.selectedText]}>Поддържане на теглото</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, selectedGoal === 'Lose Weight' && styles.selectedButton]}
              onPress={() => handleGoalSelection('Lose Weight')}
              disabled={loading}
            >
              <Ionicons name="trending-down" size={24} color={selectedGoal === 'Lose Weight' ? theme.colors.text.primary : theme.colors.text.secondary} />
              <Text style={[styles.buttonText, selectedGoal === 'Lose Weight' && styles.selectedText]}>Отслабване</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </StyledImageBackground>
  );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        backgroundColor: theme.colors.background.dark,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
    header: {
        paddingTop: 210,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 8,
        zIndex: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    formBox: {
        backgroundColor: theme.colors.background.card,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
        elevation: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    goalButton: {
        backgroundColor: theme.colors.background.input,
        width: '100%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    selectedButton: {
        backgroundColor: theme.colors.primary,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonText: {
        color: theme.colors.text.secondary,
        fontSize: 18,
        marginLeft: 12,
    },
    selectedText: {
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
});

export default GoalSelectionScreen;
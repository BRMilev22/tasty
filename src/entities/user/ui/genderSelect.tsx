import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../../../shared/config/firebaseConfig'; // Updated Firebase configuration path
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../../shared/ui/Logo';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../shared/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

const GenderSelectionScreen = () => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
        router.replace('/targetWeightSelect'); // Change to your next screen route
      } catch (error) {
        console.error('Error saving gender: ', error);
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
            <Text style={styles.title}>Изберете пол</Text>
            <Text style={styles.subtitle}>Изберете вашия пол за по-точни изчисления</Text>

            <TouchableOpacity
              style={[styles.genderButton, selectedGender === 'Male' && styles.selectedButton]}
              onPress={() => handleGenderSelection('Male')}
              disabled={loading}
            >
              <Ionicons 
                name="male" 
                size={24} 
                color={selectedGender === 'Male' ? theme.colors.text.primary : theme.colors.text.secondary} 
              />
              <Text style={[styles.buttonText, selectedGender === 'Male' && styles.selectedText]}>Мъж</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderButton, selectedGender === 'Female' && styles.selectedButton]}
              onPress={() => handleGenderSelection('Female')}
              disabled={loading}
            >
              <Ionicons 
                name="female" 
                size={24} 
                color={selectedGender === 'Female' ? theme.colors.text.primary : theme.colors.text.secondary} 
              />
              <Text style={[styles.buttonText, selectedGender === 'Female' && styles.selectedText]}>Жена</Text>
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
    genderButton: {
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

export default GenderSelectionScreen;
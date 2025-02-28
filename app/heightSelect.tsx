import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/Logo';

const StyledImageBackground = styled(ImageBackground);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledPickerContainer = styled(View);

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
            <Text style={styles.title}>Изберете височина</Text>
            <Text style={styles.subtitle}>Въведете вашата височина в сантиметри</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedHeight}
                onValueChange={(itemValue) => setSelectedHeight(itemValue as string)}
                style={styles.picker}
              >
                {Array.from({ length: 91 }, (_, i) => 130 + i).map((height) => (
                  <Picker.Item 
                    key={height} 
                    label={`${height} cm`} 
                    value={height.toString()}
                    color={theme.colors.text.primary}
                  />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleHeightSelection}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Продължете</Text>
              <Ionicons name="arrow-forward" size={24} color={theme.colors.text.primary} style={styles.buttonIcon} />
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
    pickerContainer: {
        backgroundColor: theme.colors.background.input,
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    picker: {
        width: '100%',
        backgroundColor: 'transparent',
        color: theme.colors.text.primary,
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonText: {
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: '500',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 8,
    },
});

export default HeightSelectionScreen;
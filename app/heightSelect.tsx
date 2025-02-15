import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { styled } from 'nativewind';
import Logo from '@/components/Logo';

const StyledImageBackground = styled(ImageBackground);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledPickerContainer = styled(View);

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
      source={{ uri: 'https://i.imgur.com/8F9ZGpX.png' }}
      style={styles.backgroundImage}
      blurRadius={5}
    >
      <View style={styles.container}>
        <Logo/>

        <View style={styles.content}>
          <Text style={styles.title}>Изберете височина (cm)</Text>

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
                  color={theme.colors.text}
                />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleHeightSelection}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Потвърдете височината</Text>
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
    pickerContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 15,
        width: '100%',
        marginBottom: 20,
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        backgroundColor: 'transparent',
        color: theme.colors.text,
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        width: '100%',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '500',
    },
});

export default HeightSelectionScreen;
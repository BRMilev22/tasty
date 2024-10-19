import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { styled } from 'nativewind';

const StyledImageBackground = styled(ImageBackground);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledPickerContainer = styled(View);

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
      source={{
        uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
      }}
      className="flex-1 justify-center items-center"
      blurRadius={20}
    >
      <StyledView className="flex-1 justify-center items-center p-6 w-full">
        <StyledText className="text-black text-3xl font-bold mb-6 text-center">Select Your Height (cm)</StyledText>

        {/* Height Picker */}
        <StyledPickerContainer className="bg-transparent mb-6 w-full">
          <Picker
            selectedValue={selectedHeight}
            onValueChange={(itemValue) => setSelectedHeight(itemValue as string)}
            style={{ height: 150, width: '100%', color: '#000' }} // Keep the picker transparent
          >
            {/* Generate height values from 130cm to 220cm */}
            {Array.from({ length: 91 }, (_, i) => 130 + i).map((height) => (
              <Picker.Item key={height} label={`${height} cm`} value={height.toString()} />
            ))}
          </Picker>
        </StyledPickerContainer>

        {/* Confirm Button */}
        <StyledTouchableOpacity
          className="bg-blue-600 p-4 rounded-lg w-full"
          onPress={handleHeightSelection}
          disabled={loading}
        >
          <StyledText className="text-white text-lg font-medium text-center">Confirm Height</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledImageBackground>
  );
};

export default HeightSelectionScreen;
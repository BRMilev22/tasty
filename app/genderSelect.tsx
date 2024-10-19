import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import
import { styled } from 'nativewind';

const StyledImageBackground = styled(ImageBackground);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

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
      source={{
        uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
      }}
      className="flex-1 justify-center items-center"
      blurRadius={20}
    >
      <StyledView className="flex-1 justify-center items-center p-6 w-full">
        <StyledText className="text-black text-3xl font-bold mb-6 text-center">Select Your Gender</StyledText>

        {/* Male Button */}
        <StyledTouchableOpacity
          className={`bg-blue-600 p-4 rounded-lg mb-4 w-full items-center ${
            selectedGender === 'Male' ? 'bg-blue-800' : ''
          }`}
          onPress={() => handleGenderSelection('Male')}
          disabled={loading} // Disable button while loading
        >
          <StyledText className="text-white text-lg font-semibold">Male</StyledText>
        </StyledTouchableOpacity>

        {/* Female Button */}
        <StyledTouchableOpacity
          className={`bg-blue-600 p-4 rounded-lg mb-4 w-full items-center ${
            selectedGender === 'Female' ? 'bg-blue-800' : ''
          }`}
          onPress={() => handleGenderSelection('Female')}
          disabled={loading}
        >
          <StyledText className="text-white text-lg font-semibold">Female</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledImageBackground>
  );
};

export default GenderSelectionScreen;
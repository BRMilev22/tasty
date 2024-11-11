import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
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
      source={{
        uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
      }}
      className="flex-1"
      blurRadius={20}
    >

      <Logo/>

      <StyledView className="flex-1 justify-center items-center px-4 bottom-44">

        <StyledText className="text-black text-3xl font-bold mb-6">Select Your Goal</StyledText>

        {/* Gain Weight Button */}
        <StyledTouchableOpacity
          className={`bg-blue-600 p-4 rounded-lg mb-4 w-full ${selectedGoal === 'Gain Weight' ? 'bg-blue-800' : ''}`}
          onPress={() => handleGoalSelection('Gain Weight')}
          disabled={loading} // Disable button while loading
        >
          <StyledText className="text-white text-lg font-medium">Gain Weight</StyledText>
        </StyledTouchableOpacity>

        {/* Maintain Weight Button */}
        <StyledTouchableOpacity
          className={`bg-blue-600 p-4 rounded-lg mb-4 w-full ${selectedGoal === 'Maintain Weight' ? 'bg-blue-800' : ''}`}
          onPress={() => handleGoalSelection('Maintain Weight')}
          disabled={loading}
        >
          <StyledText className="text-white text-lg font-medium">Maintain Weight</StyledText>
        </StyledTouchableOpacity>

        {/* Lose Weight Button */}
        <StyledTouchableOpacity
          className={`bg-blue-600 p-4 rounded-lg mb-4 w-full ${selectedGoal === 'Lose Weight' ? 'bg-blue-800' : ''}`}
          onPress={() => handleGoalSelection('Lose Weight')}
          disabled={loading}
        >
          <StyledText className="text-white text-lg font-medium">Lose Weight</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledImageBackground>
  );
};

export default GoalSelectionScreen;
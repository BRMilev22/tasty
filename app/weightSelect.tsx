import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
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

const WeightSelectionScreen = () => {
  const [selectedWeight, setSelectedWeight] = useState<string>('70'); // Default weight 70 kg
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to handle weight selection
  const handleWeightSelection = async () => {
    setLoading(true);

    if (user) {
      try {
        // Save the user's weight to Firestore
        await setDoc(
          doc(db, 'users', user.uid), // Reference to user's document
          {
            weight: selectedWeight, // Save weight field
          },
          { merge: true } // Merge with existing document fields
        );

        // Navigate to the next screen (e.g., gender selection)
        router.replace('/genderSelect');
      } catch (error) {
        console.error('Error saving weight: ', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <StyledImageBackground
      source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
      className="flex-1 justify-center items-center"
      blurRadius={20}
    >

      <Logo/>

      <StyledView className="flex-1 justify-center items-center p-6 w-full bottom-44">
        <StyledText className="text-black text-3xl font-bold mb-6 text-center">Select Your Weight (kg)</StyledText>

        {/* Weight Picker */}
        <StyledPickerContainer className="bg-transparent mb-6 w-full">
          <Picker
            selectedValue={selectedWeight}
            onValueChange={(itemValue) => setSelectedWeight(itemValue as string)} // Type assertion added here
            style={{ height: 150, width: '100%', color: '#000' }} // Keep the picker transparent
          >
            {/* Generate weight values from 30 kg to 150 kg */}
            {Array.from({ length: 121 }, (_, i) => 30 + i).map((weight) => (
              <Picker.Item key={weight} label={`${weight} kg`} value={weight.toString()} />
            ))}
          </Picker>
        </StyledPickerContainer>

        {/* Confirm Button */}
        <StyledTouchableOpacity
          className="bg-blue-600 p-4 rounded-lg w-full"
          onPress={handleWeightSelection}
          disabled={loading}
        >
          <StyledText className="text-white text-lg text-center">Confirm Weight</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledImageBackground>
  );
};

export default WeightSelectionScreen;
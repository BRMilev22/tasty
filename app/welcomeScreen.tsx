import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SvgUri } from 'react-native-svg';
import { StackNavigationProp } from '@react-navigation/stack';

interface WelcomeScreenProps {
  navigation: StackNavigationProp<any>;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <StyledView className="flex-1 bg-white">
      <StyledView className="flex-1 justify-end bg-black/20 p-6">
        <StyledView className="flex-1 items-center justify-center">
          <SvgUri width="100%" height="100%" uri="https://tasty-63fe0.web.app/logo.svg" />
        </StyledView>

        <StyledText className="text-black text-4xl font-extrabold text-center mb-2">
          Tasty
        </StyledText>
        <StyledText className="text-black text-lg text-center mb-8">
          Effortless meal planning and recipe recommendations
        </StyledText>
        
        <StyledTouchableOpacity
          className="bg-[#1e90ff] rounded-full px-8 py-4 mb-12 mt-2"
          onPress={() => navigation.replace('auth/RegisterScreen')} // Use the correct screen name
        >
          <StyledText className="text-white font-bold text-center">
            Start Now
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
};

export default WelcomeScreen;
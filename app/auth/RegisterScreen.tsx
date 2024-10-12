// app/auth/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { styled } from 'nativewind';
import { StackNavigationProp } from '@react-navigation/stack';

const StyledImageBackground = styled(ImageBackground);
const StyledAnimatedView = styled(Animated.View);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);

const auth = getAuth();

interface RegisterScreenProps {
    navigation: StackNavigationProp<any>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const opacity = useState(new Animated.Value(1))[0];

    const fadeOut = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            navigation.navigate('../dashboard');
        });
    };

    const handleRegister = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setError('');
            showMessage({
                message: 'Registration successful!',
                type: 'success',
            });
            fadeOut();
        } catch (err) {
            setError('Error registering. Please try again.');
            showMessage({
                message: 'Error registering. Please try again.',
                type: 'danger',
            });
        }
    };

    return (
        <StyledImageBackground
            source={{ uri: 'https://img.freepik.com/free-vector/gradient-particle-wave-background_23-2150517309.jpg' }}
            className="flex-1 justify-center items-center bg-[#141e30]"
            blurRadius={20}
        >
            <StyledAnimatedView style={{ opacity }} className="flex-1 justify-center items-center">
                <StyledView className="w-[90%] p-5 rounded-xl bg-white/10 border border-white/20 shadow-lg shadow-black/30 items-center">
                    <StyledText className="text-2xl font-bold text-[#f0eaff] mb-5">Create Account</StyledText>
                    {error ? <StyledText className="text-red-500 mb-2">{error}</StyledText> : null}

                    <StyledView className="flex-row items-center bg-white/20 rounded-lg p-3 mb-4 w-full">
                        <Ionicons name="mail-outline" size={24} color="#c0c0c0" />
                        <StyledTextInput
                            className="flex-1 ml-3 text-base text-[#f0eaff]"
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            placeholderTextColor="#c0c0c0"
                        />
                    </StyledView>

                    <StyledView className="flex-row items-center bg-white/20 rounded-lg p-3 mb-4 w-full">
                        <Ionicons name="lock-closed-outline" size={24} color="#c0c0c0" />
                        <StyledTextInput
                            className="flex-1 ml-3 text-base text-[#f0eaff]"
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#c0c0c0"
                        />
                    </StyledView>

                    <StyledTouchableOpacity
                        className="bg-gradient-to-r from-[#6a11cb] to-[#2575fc] rounded-lg py-3 w-full mb-4"
                        onPress={handleRegister}
                    >
                        <StyledText className="text-white text-center text-lg font-semibold">Sign Up</StyledText>
                    </StyledTouchableOpacity>

                    <FlashMessage position="top" />
                </StyledView>
            </StyledAnimatedView>
        </StyledImageBackground>
    );
};

export default RegisterScreen;
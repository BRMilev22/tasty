import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { styled } from 'nativewind';

const StyledImageBackground = styled(ImageBackground);
const StyledAnimatedView = styled(Animated.View);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);

const auth = getAuth();

interface AuthScreenProps {
    onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const opacity = useState(new Animated.Value(1))[0];

    const fadeOut = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            onLogin();
        });
    };

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setError('');
            showMessage({
                message: 'Login successful!',
                type: 'success',
            });
            fadeOut();
        } catch (err) {
            setError('Invalid credentials. Please try again.');
            showMessage({
                message: 'Invalid credentials. Please try again.',
                type: 'danger',
            });
        }
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
            source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
            className="flex-1 justify-center items-center"
            blurRadius={20}
        >
            <StyledAnimatedView style={{ opacity }} className="flex-1 justify-center items-center">
                <StyledView className="w-[90%] p-6 rounded-3xl bg-white/30 border border-white/20 shadow-md shadow-black/20 items-center backdrop-blur-lg">
                    <StyledText className="text-3xl font-bold text-gray-800 mb-6">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </StyledText>
                    {error ? <StyledText className="text-red-500 mb-3">{error}</StyledText> : null}

                    <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-4 mb-4 w-full">
                        <Ionicons name="mail-outline" size={24} color="#a0a0a0" />
                        <StyledTextInput
                            className="flex-1 ml-3 text-base text-gray-800"
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            placeholderTextColor="#a0a0a0"
                        />
                    </StyledView>

                    <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-4 mb-6 w-full">
                        <Ionicons name="lock-closed-outline" size={24} color="#a0a0a0" />
                        <StyledTextInput
                            className="flex-1 ml-3 text-base text-gray-800"
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#a0a0a0"
                        />
                    </StyledView>

                    <StyledTouchableOpacity
                        className="bg-gradient-to-r from-[#ffffff] to-[#e0e0e0] rounded-2xl py-4 w-full mb-4 shadow-md shadow-gray-400"
                        onPress={isRegistering ? handleRegister : handleLogin}
                    >
                        <StyledText className="text-gray-800 text-center text-lg font-semibold">
                            {isRegistering ? 'Sign Up' : 'Sign In'}
                        </StyledText>
                    </StyledTouchableOpacity>

                    <StyledTouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                        <StyledText className="text-[#a0a0a0] text-center font-bold">
                            {isRegistering ? 'Already have an account? Sign In' : 'Create an account'}
                        </StyledText>
                    </StyledTouchableOpacity>

                    <FlashMessage position="top" />
                </StyledView>
            </StyledAnimatedView>
        </StyledImageBackground>
    );
};

export default AuthScreen;
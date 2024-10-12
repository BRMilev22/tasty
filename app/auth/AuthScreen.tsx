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
    const router = useRouter();

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
            source={{ uri: 'https://img.freepik.com/free-vector/gradient-particle-wave-background_23-2150517309.jpg' }}
            className="flex-1 justify-center items-center bg-[#141e30]"
            blurRadius={20}
        >
            <StyledAnimatedView style={{ opacity }} className="flex-1 justify-center items-center">
                <StyledView className="w-[90%] p-5 rounded-xl bg-white/10 border border-white/20 shadow-lg shadow-black/30 items-center">
                    <StyledText className="text-2xl font-bold text-[#f0eaff] mb-5">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </StyledText>
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
                        onPress={isRegistering ? handleRegister : handleLogin}
                    >
                        <StyledText className="text-white text-center text-lg font-semibold">
                            {isRegistering ? 'Sign Up' : 'Sign In'}
                        </StyledText>
                    </StyledTouchableOpacity>

                    <StyledTouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                        <StyledText className="text-[#a5d6fd] text-center font-bold">
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
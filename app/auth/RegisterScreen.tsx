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
    const [didRegister, setDidRegister] = useState(false); // Add didRegister state
    const opacity = useState(new Animated.Value(1))[0];

    const fadeOut = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            setDidRegister(true); // Set didRegister to true before navigation
            navigation.navigate("welcomeScreen", { didRegister: true });
        });
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password: string) => {
        const containsNumber = /\d/.test(password);
        const containsLetter = /[a-zA-Z]/.test(password);
        const containsUpperCase = /[A-Z]/.test(password);
        const containsSpecialChar = /[!@?#$%&*]/.test(password);

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return false;
        }
        if (!containsLetter) {
            setError('Password must contain at least one letter.');
            return false;
        }
        if (!containsNumber) {
            setError('Password must contain at least one number.');
            return false;
        }
        if (!containsUpperCase) {
            setError('Password must contain at least one uppercase letter.');
            return false;
        }
        if (!containsSpecialChar) {
            setError('Password must contain at least one special character.');
            return false;
        }
        return true;
    };

    const validateInputs = () => {
        if (!email || !password) {
            setError('Email and password fields cannot be empty.');
            return false;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address.');
            return false;
        }

        if (!isValidPassword(password)) {
            return false;
        }

        setError('');
        return true;
    };

    const handleRegister = async () => {
        if (!validateInputs()) {
            return;
        }

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
                    <StyledText className="text-3xl font-bold text-gray-800 mb-6">Create Account</StyledText>
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
                        onPress={handleRegister}
                    >
                        <StyledText className="text-gray-800 text-center text-lg font-semibold">Sign Up</StyledText>
                    </StyledTouchableOpacity>

                    <FlashMessage position="top" />
                </StyledView>
            </StyledAnimatedView>
        </StyledImageBackground>
    );
};

export default RegisterScreen;
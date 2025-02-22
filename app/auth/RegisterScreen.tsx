import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground, ActivityIndicator } from 'react-native';
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

const theme = {
    colors: {
        primary: '#4CAF50',
        background: '#000000',
        surface: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#999999',
        accent: '#4CAF50',
        error: '#FF5252',
    }
};

interface RegisterScreenProps {
    navigation: StackNavigationProp<any>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [didRegister, setDidRegister] = useState(false);
    const opacity = useState(new Animated.Value(1))[0];

    const fadeOut = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            setDidRegister(true);
            navigation.navigate("(tabs)/dashboard");
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
            setError('Паролата трябва да е с дължина от поне 8 символа.');
            return false;
        }
        if (!containsLetter) {
            setError('Паролата трябва да съдържа поне една буква.');
            return false;
        }
        if (!containsNumber) {
            setError('Паролата трябва да съдържа поне едно число');
            return false;
        }
        if (!containsUpperCase) {
            setError('Паролата трябва да съдържа поне една главна буква.');
            return false;
        }
        if (!containsSpecialChar) {
            setError('Паролата трябва да съдържа поне един специален символ.');
            return false;
        }
        return true;
    };

    const validateInputs = () => {
        if (!email || !password) {
            setError('Полетата за имейл и парола не могат да бъдат празни.');
            return false;
        }

        if (!isValidEmail(email)) {
            setError('Моля, добавете валиден имейл.');
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

        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setError('');
            showMessage({
                message: 'Регистрацията бе успешна!',
                type: 'success',
            });
            fadeOut();
        } catch (err) {
            setError('Грешка при регистрирането. Моля, опитайте отново.');
            showMessage({
                message: 'Грешка при регистрирането. Моля, опитайте отново.',
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyledImageBackground
            source={null}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}
        >
            <StyledAnimatedView style={{ opacity }} className="flex-1 justify-center items-center">
                <StyledView className="w-[90%] p-6 rounded-3xl" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.textSecondary, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, alignItems: 'center' }}>
                    <StyledText className="text-3xl font-bold mb-6" style={{ color: theme.colors.text }}>Създайте профил</StyledText>
                    {error ? <StyledText className="text-red-500 mb-3" style={{ color: theme.colors.error }}>{error}</StyledText> : null}

                    <StyledView className="flex-row items-center rounded-2xl p-4 mb-4 w-full" style={{ backgroundColor: theme.colors.background }}>
                        <Ionicons name="mail-outline" size={24} color={theme.colors.textSecondary} />
                        <StyledTextInput
                            className="flex-1 ml-3 text-base"
                            style={{ color: theme.colors.text }}
                            placeholder="Имейл"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </StyledView>

                    <StyledView className="flex-row items-center rounded-2xl p-4 mb-6 w-full" style={{ backgroundColor: theme.colors.background }}>
                        <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textSecondary} />
                        <StyledTextInput
                            className="flex-1 ml-3 text-base"
                            style={{ color: theme.colors.text }}
                            placeholder="Парола"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </StyledView>

                    <StyledTouchableOpacity
                        className="rounded-2xl py-4 mb-4"
                        style={{ backgroundColor: theme.colors.accent, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, justifyContent: 'center', alignItems: 'center', width: '100%' }}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={theme.colors.text} />
                        ) : (
                            <StyledText className="text-center text-lg font-semibold" style={{ color: theme.colors.text }}>Създайте профил</StyledText>
                        )}
                    </StyledTouchableOpacity>

                    <FlashMessage position="top" />
                </StyledView>
            </StyledAnimatedView>
        </StyledImageBackground>
    );
};

export default RegisterScreen;
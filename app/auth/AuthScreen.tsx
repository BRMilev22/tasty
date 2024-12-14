import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { styled } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Logo from '../../components/Logo';

const firestore = getFirestore();

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
    const [step, setStep] = useState(1);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const opacity = useState(new Animated.Value(1))[0];

    const validateFirstName = (firstName: string) => {
        const nameRegex = /^(?=.*[A-Z])[A-Za-z]{2,}$/; // At least one capital letter, only letters, and at least 2 characters long
        return nameRegex.test(firstName);
    };

    const validateLastName = (lastName: string) => {
        const nameRegex = /^(?=.*[A-Z])[A-Za-z]{2,}$/; // At least one capital letter, only letters, and at least 2 characters long
        return nameRegex.test(lastName);
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

    const isValidDateOfBirth = (dob: Date) => {
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        const dayDifference = today.getDate() - dob.getDate();

        // Check if the user is at least 18 years old
        return (
            age > 18 ||
            (age === 18 && (monthDifference > 0 || (monthDifference === 0 && dayDifference >= 0)))
        );
    };

    const canProceedToNextStep = () => {
        if (!firstName || !lastName || !dateOfBirth) {
            setError('Моля, попълнете всички полета');
            showMessage({
                message: 'Моля, попълнете всички полета',
                type: 'danger',
            });
            return false;
        }

        if (!isValidDateOfBirth(dateOfBirth)) {
            setError('Трябва да бъдете минимум на 18-годишна възраст');
            showMessage({
                message: 'Трябва да бъдете минимум на 18-годишна възраст',
                type: 'danger',
            });
            return false;
        }

        if (!validateFirstName(firstName)) {
            setError('Невалидно име.');
            return false;
        }

        if (!validateLastName(lastName)) {
            setError('Невалидна фамилия.');
            return false;
        }

        setError('');
        return true;
    };

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError('Паролите не съвпадат.');
            showMessage({
                message: 'Паролите не съвпадат.',
                type: 'danger',
            });
            return;
        }

        if (!email || !password) {
            setError('Полетата за имейл и парола не могат да бъдат празни.');
            return false;
        }

        if (!isValidEmail(email)) {
            setError('Моля, въведете валиден имейл.');
            return false;
        }

        if (!isValidPassword(password)) {
            return false;
        }
        
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Get the user ID
            const userId = userCredential.user.uid;
    
            // Create a Firestore document for the user
            await setDoc(doc(firestore, 'users', userId), {
                firstName,
                lastName,
                dateOfBirth,
                email,
                createdAt: new Date(),
            });
    
            setError('');
            showMessage({
                message: 'Регистрацията бе успешна!',
                type: 'success',
            });
            onLogin();
        } catch (err) {
            setError('Грешка при регистрирането. Моля, опитайте отново.');
            showMessage({
                message: 'Грешка при регистрирането. Моля, опитайте отново.',
                type: 'danger',
            });
        }
    };

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setError('');
            showMessage({
                message: 'Вписването бе успешно!',
                type: 'success',
            });
            onLogin();
        } catch (err) {
            setError('Грешка при вписването. Моля, опитайте отново.');
            showMessage({
                message: 'Грешка при вписването. Моля, опитайте отново.',
                type: 'danger',
            });
        }
    };

    const fadeIn = () => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const fadeOut = (callback: () => void) => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            callback();
            fadeIn();
        });
    };

    const goToNextStep = () => {
        if (canProceedToNextStep()) {
            fadeOut(() => setStep(2));
        }
    };

    const goToPreviousStep = () => fadeOut(() => setStep(1));

    return (
        <StyledImageBackground
            source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
            className="flex-1 justify-center items-center"
            blurRadius={20}
        >

            <Logo/>

            <StyledAnimatedView style={{ opacity }} className="flex-1 bottom-28">
                <StyledView className="w-[90%] p-6 rounded-3xl bg-white/30 border border-white/20 shadow-md shadow-black/20 backdrop-blur-lg">
                    <StyledText className="text-3xl font-bold text-gray-800 mb-6 text-center">
                        {isLoginMode ? 'Впишете се' : step === 1 ? 'Създайте профил' : 'Информация за профила'}
                    </StyledText>
                    {error ? <StyledText className="text-red-500 mb-3">{error}</StyledText> : null}

                    {isLoginMode ? (
                        <>
                            <StyledTextInput
                                className="bg-white/50 rounded-2xl p-4 mb-4 text-gray-800"
                                placeholder="Имейл"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                placeholderTextColor="#a0a0a0"
                            />
                            <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-4 mb-4 w-full">
                                <Ionicons name="lock-closed-outline" size={24} color="#a0a0a0" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-base text-gray-800"
                                    placeholder="Парола"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholderTextColor="#a0a0a0"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#a0a0a0"
                                    />
                                </TouchableOpacity>
                            </StyledView>
                            <StyledTouchableOpacity
                                className="rounded-full w-12 h-12 mb-4 shadow-md shadow-gray-400 bg-blue-500 justify-center items-center self-end"
                                onPress={handleLogin}
                            >
                                <Ionicons name="arrow-forward-outline" size={24} color="#ffffff" />
                            </StyledTouchableOpacity>
                        </>
                    ) : step === 1 ? (
                        <>
                            <StyledTextInput
                                className="bg-white/50 rounded-2xl p-4 mb-4 text-gray-800"
                                placeholder="Име"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholderTextColor="#a0a0a0"
                            />
                            <StyledTextInput
                                className="bg-white/50 rounded-2xl p-4 mb-4 text-gray-800"
                                placeholder="Фамилия"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholderTextColor="#a0a0a0"
                            />
                            <StyledTouchableOpacity
                                className="bg-white/50 rounded-2xl p-4 mb-4 w-full flex-row justify-between items-center"
                                onPress={() => setDateOfBirth(new Date())}
                            >
                                <StyledText className="text-gray-800">
                                    {dateOfBirth ? dateOfBirth.toDateString() : 'Дата на раждане'}
                                </StyledText>
                                <Ionicons name="calendar-outline" size={24} color="#a0a0a0" />
                            </StyledTouchableOpacity>
                            {dateOfBirth && (
                                <DateTimePicker
                                    value={dateOfBirth}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => setDateOfBirth(selectedDate || dateOfBirth)}
                                />
                            )}
                            <StyledTouchableOpacity
                                className="rounded-full w-12 h-12 mb-4 shadow-md shadow-gray-400 bg-blue-500 justify-center items-center self-end"
                                onPress={goToNextStep}
                            >
                                <Ionicons name="arrow-forward-outline" size={24} color="#ffffff" />
                            </StyledTouchableOpacity>
                        </>
                    ) : (
                        <>
                            <StyledTextInput
                                className="bg-white/50 rounded-2xl p-4 mb-4 text-gray-800"
                                placeholder="Имейл"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                placeholderTextColor="#a0a0a0"
                            />
                            <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-4 mb-4 w-full">
                                <Ionicons name="lock-closed-outline" size={24} color="#a0a0a0" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-base text-gray-800"
                                    placeholder="Парола"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholderTextColor="#a0a0a0"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#a0a0a0"
                                    />
                                </TouchableOpacity>
                            </StyledView>
                            <StyledTextInput
                                className="bg-white/50 rounded-2xl p-4 mb-4 text-gray-800"
                                placeholder="Потвърдете паролата"
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholderTextColor="#a0a0a0"
                            />
                            <StyledTouchableOpacity
                                className="rounded-full w-12 h-12 mb-4 shadow-md shadow-gray-400 bg-blue-500 justify-center items-center self-end"
                                onPress={handleRegister}
                            >
                                <Ionicons name="arrow-forward-outline" size={24} color="#ffffff" />
                            </StyledTouchableOpacity>
                        </>
                    )}
                    {!isLoginMode && step > 1 && (
                        <StyledTouchableOpacity
                            className="absolute top-6 right-6"
                            onPress={goToPreviousStep}
                        >
                            <Ionicons name="arrow-back-outline" size={30} color="#a0a0a0" />
                        </StyledTouchableOpacity>
                    )}
                    <StyledTouchableOpacity
                        onPress={() => setIsLoginMode(!isLoginMode)}
                        className="mt-4"
                    >
                        <StyledText className="text-gray-800">
                            {isLoginMode ? 'Създайте профил' : 'Вече имате профил? Впишете се!'}
                        </StyledText>
                    </StyledTouchableOpacity>
                </StyledView>
            </StyledAnimatedView>
            <FlashMessage position="top" />
        </StyledImageBackground>
    );
};

export default AuthScreen;
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { styled } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Logo from '../../shared/ui/Logo';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const theme = {
    colors: {
        primary: '#4CAF50',
        background: {
            dark: '#000000',
            card: 'rgba(30, 30, 30, 0.95)',
            input: 'rgba(40, 40, 40, 0.8)',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#AAAAAA',
            hint: '#666666',
        },
        border: {
            light: 'rgba(255, 255, 255, 0.1)',
            accent: 'rgba(76, 175, 80, 0.3)',
        }
    }
};

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
    
            await AsyncStorage.setItem('userToken', userId);

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
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          await AsyncStorage.setItem('userToken', userCredential.user.uid); // Store user ID
          showMessage({ message: 'Вписването бе успешно!', type: 'success' });
          onLogin();
        } catch (err) {
          setError('Грешка при вписването. Моля, опитайте отново.');
          showMessage({ message: 'Грешка при вписването. Моля, опитайте отново.', type: 'danger' });
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
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <StyledImageBackground
                style={[styles.backgroundImage, { backgroundColor: theme.colors.background.dark }]}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Logo />
                            <Text style={styles.headerTitle}>
                                {isLoginMode ? 'Добре дошли обратно!' : step === 1 ? 'Създайте профил' : 'Информация за профила'}
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                {isLoginMode 
                                    ? 'Впишете се, за да продължите към вашия профил' 
                                    : 'Попълнете информацията по-долу, за да създадете профил'}
                            </Text>
                        </View>

                        <Animated.View style={[styles.formContainer, { opacity }]}>
                            <View style={styles.formBox}>
                                {error && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={24} color="#F44336" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                {isLoginMode ? (
                                    <>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="mail-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Имейл"
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                        </View>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="lock-closed-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Парола"
                                                secureTextEntry={!showPassword}
                                                value={password}
                                                onChangeText={setPassword}
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons
                                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                    size={24}
                                                    color="#999999"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={handleLogin}
                                        >
                                            <Text style={styles.actionButtonText}>Впишете се</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : step === 1 ? (
                                    <>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="person-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Име"
                                                value={firstName}
                                                onChangeText={setFirstName}
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                        </View>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="person-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Фамилия"
                                                value={lastName}
                                                onChangeText={setLastName}
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.inputWrapper}
                                            onPress={() => setDateOfBirth(new Date())}
                                        >
                                            <Ionicons name="calendar-outline" size={24} color="#999999" />
                                            <Text style={styles.dateText}>
                                                {dateOfBirth ? dateOfBirth.toDateString() : 'Дата на раждане'}
                                            </Text>
                                        </TouchableOpacity>
                                        {dateOfBirth && (
                                            <DateTimePicker
                                                value={dateOfBirth}
                                                mode="date"
                                                display="default"
                                                onChange={(event, selectedDate) => setDateOfBirth(selectedDate || dateOfBirth)}
                                            />
                                        )}
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={goToNextStep}
                                        >
                                            <Text style={styles.actionButtonText}>Напред</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="mail-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Имейл"
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                        </View>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="lock-closed-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Парола"
                                                secureTextEntry={!showPassword}
                                                value={password}
                                                onChangeText={setPassword}
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons
                                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                    size={24}
                                                    color="#999999"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="lock-closed-outline" size={24} color="#999999" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Потвърдете паролата"
                                                secureTextEntry={!showPassword}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                placeholderTextColor="#999999"
                                                selectionColor="#4CAF50"
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={handleRegister}
                                        >
                                            <Text style={styles.actionButtonText}>Регистрирайте се</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                {!isLoginMode && step > 1 && (
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={goToPreviousStep}
                                    >
                                        <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setIsLoginMode(!isLoginMode)}
                                    style={styles.switchModeButton}
                                >
                                    <Text style={styles.switchModeText}>
                                        {isLoginMode ? 'Нямате профил? Създайте сега!' : 'Вече имате профил? Впишете се!'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </ScrollView>
                <FlashMessage position="top" />
            </StyledImageBackground>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        backgroundColor: theme.colors.background.dark,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    formBox: {
        backgroundColor: theme.colors.background.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
        elevation: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorText: {
        flex: 1,
        color: '#F44336',
        marginLeft: 12,
        fontSize: 14,
    },
    inputWrapper: {
        backgroundColor: theme.colors.background.input,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: 16,
        marginLeft: 12,
    },
    dateText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        marginLeft: 12,
    },
    actionButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    actionButtonText: {
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 24,
        padding: 8,
        zIndex: 10,
        borderRadius: 8,
    },
    switchModeButton: {
        marginTop: 24,
        paddingVertical: 8,
        alignItems: 'center',
    },
    switchModeText: {
        color: theme.colors.text.secondary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
});

export default AuthScreen;
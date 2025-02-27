import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { styled } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Logo from '../../components/Logo';
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
        background: '#000000',
        surface: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#999999',
        accent: '#4CAF50',
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
                source={{ uri: 'https://i.imgur.com/8F9ZGpX.png' }}
                style={styles.backgroundImage}
                blurRadius={5}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.container}>
                        <Logo/>

                        <Animated.View style={[styles.formContainer, { opacity }]}>
                            <View style={styles.formBox}>
                                <Text style={styles.title}>
                                    {isLoginMode ? 'Впишете се' : step === 1 ? 'Създайте профил' : 'Информация за профила'}
                                </Text>
                                
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                                        {isLoginMode ? 'Създайте профил' : 'Вече имате профил? Впишете се!'}
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
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    formContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        marginTop: Platform.OS === 'ios' ? 100 : 50,
    },
    formBox: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    errorText: {
        color: '#e74c3c',
        marginBottom: 10,
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 16,
        marginLeft: 15,
    },
    dateText: {
        color: theme.colors.text,
        fontSize: 16,
        marginLeft: 15,
    },
    actionButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    actionButtonText: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 10,
    },
    switchModeButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchModeText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
});

export default AuthScreen;
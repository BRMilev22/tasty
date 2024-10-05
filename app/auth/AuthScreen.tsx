import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';  // Import useRouter for navigation
import { auth } from '../../firebaseConfig'; // Import Firebase authentication object
import FlashMessage, { showMessage } from 'react-native-flash-message'; // Import FlashMessage

interface AuthScreenProps {
    onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const opacity = useState(new Animated.Value(1))[0]; // Initialize animated value
    const router = useRouter(); // Initialize the router hook for navigation

    const fadeOut = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
        }).start(() => {
            onLogin(); // Call onLogin prop after animation is complete
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
            fadeOut(); // Start fade-out animation
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
                message: 'Registration successful! Please select your goal.',
                type: 'success',
            });
            router.replace('/goalsSelect'); // Navigate to the goal selection screen
        } catch (err) {
            setError('Error registering. Please try again.');
            showMessage({
                message: 'Error registering. Please try again.',
                type: 'danger',
            });
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <Text style={styles.title}>{isRegistering ? 'Register' : 'Login'}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
            </View>
            
            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={isRegistering ? handleRegister : handleLogin}>
                <Text style={styles.buttonText}>{isRegistering ? 'Register' : 'Login'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                <Text style={styles.toggleText}>
                    {isRegistering ? 'Already have an account? Login' : 'Don’t have an account? Register'}
                </Text>
            </TouchableOpacity>

            {/* Flash Message component */}
            <FlashMessage position="top" />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#f0f4f8',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 40,
    },
    button: {
        backgroundColor: '#1e90ff',
        borderRadius: 8,
        paddingVertical: 12,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggleText: {
        color: '#1e90ff',
        marginTop: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default AuthScreen;
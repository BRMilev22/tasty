import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WelcomeScreenProps {
    navigation: StackNavigationProp<any>;
    route?: {
        params?: {
            didRegister?: boolean;
        };
    };
    onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation, route, onLogin }) => {
    const didRegister = route?.params?.didRegister ?? false;

    useEffect(() => {
        const handleFirstLaunch = async () => {
            if (didRegister) {
                await AsyncStorage.setItem('isFirstLaunch', 'true');
                onLogin();
            }
        };
        handleFirstLaunch();
    }, [didRegister]);

    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <SvgUri 
                            width="80%" 
                            height="80%" 
                            uri="https://tasty-63fe0.web.app/logo.svg" 
                        />
                    </View>

                    <Text style={styles.title}>
                        Tasty
                    </Text>
                    <Text style={styles.subtitle}>
                        Безпроблемно планиране на хранене и препоръки за рецепти
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={() => navigation.navigate('auth/RegisterScreen')}
                        >
                            <Text style={styles.registerButtonText}>
                                Започнете сега
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => navigation.navigate('auth/AuthScreen')}
                        >
                            <Text style={styles.loginButtonText}>
                                Вече имате акаунт? Цъкнете тук.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 24,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#000000',
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        color: '#000000',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 32,
    },
    registerButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#4CAF50',
        fontSize: 16,
    },
});

export default WelcomeScreen;
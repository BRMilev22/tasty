import React, { useState } from 'react';
import { View, Image, StyleSheet, SafeAreaView } from 'react-native';
import AuthScreen from '../auth/AuthScreen';
import DashboardScreen from './dashboard';

const logo = require('../../assets/images/tasty-logo.png');

const AppLayout = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {isLoggedIn ? (
                <DashboardScreen onLogout={handleLogout} />
            ) : (
                <View style={styles.authContainer}>
                    <Image source={logo} style={styles.logo} resizeMode="contain" /> {/* Logo only appears here */}
                    <View style={styles.authContent}>
                        <AuthScreen onLogin={handleLogin} />
                    </View>
                </View>
            )}
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    authContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: '100%',
    },
    logo: {
        width: 170,
        height: 190,
        marginBottom: 20,
    },
    authContent: {
        flex: 1,
        width: '100%',
    },
 });

export default AppLayout;
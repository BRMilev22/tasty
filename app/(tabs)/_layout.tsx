import React, { useState } from 'react';
import { View } from 'react-native';
import AuthScreen from '../auth/AuthScreen';
import DashboardScreen from './dashboard'; // Correct import for the DashboardScreen

const AppLayout = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true); // Update the state to indicate the user is logged in
    };

    const handleLogout = () => {
        setIsLoggedIn(false); // Update the state to indicate the user is logged out
    };

    return (
        <View style={{ flex: 1 }}>
            {isLoggedIn ? (
                <DashboardScreen onLogout={handleLogout} /> // Pass the handleLogout prop to the DashboardScreen
            ) : (
                <AuthScreen onLogin={handleLogin} />
            )}
        </View>
    );
};

export default AppLayout;
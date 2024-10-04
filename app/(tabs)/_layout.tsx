// app/_layout.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import AuthScreen from '../auth/AuthScreen';
import Dashboard from './index'; // Replace with the actual path to your dashboard

const AppLayout = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true); // Update the state to indicate the user is logged in
    };

    return (
        <View style={{ flex: 1 }}>
            {isLoggedIn ? (
                <Dashboard /> // Render your main app content when logged in
            ) : (
                <AuthScreen onLogin={handleLogin} />
            )}
        </View>
    );
};

export default AppLayout;
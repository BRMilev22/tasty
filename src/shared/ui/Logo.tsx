// components/Logo.tsx
import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { Asset } from 'expo-asset';

const Logo = () => {
    const [isImageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const loadLogo = async () => {
            await Asset.loadAsync(require('../assets/images/tasty-logo.png'));
            setImageLoaded(true);
        };
        loadLogo();
    }, []);

    if (!isImageLoaded) return null;

    return (
        <View className="flex-1 justify-center items-center">
            <Image 
                source={require('../assets/images/tasty-logo.png')} 
                className="w-[155px] h-[204px] bottom-10"
            />
        </View>
    );
};

export default Logo;

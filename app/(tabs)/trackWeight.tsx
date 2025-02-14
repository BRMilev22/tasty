import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImageBackground = styled(ImageBackground);

const db = getFirestore();
const auth = getAuth();

const TrackWeightScreen = ({ navigation }) => {
    const [weight, setWeight] = useState('');

    const handleSaveWeight = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Update current weight in user profile
            await updateDoc(doc(db, 'users', user.uid), {
                weight: weight
            });

            // Add to weight history
            await addDoc(collection(db, 'users', user.uid, 'weightHistory'), {
                weight: Number(weight),
                date: new Date()
            });

            showMessage({
                message: 'Теглото е записано успешно!',
                type: 'success',
            });

            navigation.goBack();
        } catch (error) {
            console.error('Error saving weight:', error);
            showMessage({
                message: 'Грешка при записване на теглото',
                type: 'danger',
            });
        }
    };

    return (
        <StyledImageBackground
        source={{
            uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
          }}
            className="flex-1"
        >
            <StyledView className="flex-1 px-6 pt-12">
                <StyledView className="flex-row items-center mb-8">
                    <StyledTouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                    </StyledTouchableOpacity>
                    <StyledText className="text-2xl font-bold text-gray-800">
                        Запишете текущото си тегло
                    </StyledText>
                </StyledView>

                <StyledView className="bg-white/50 rounded-3xl p-6 shadow-md">
                    <StyledView className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-6">
                        <Ionicons name="barbell-outline" size={24} color="#a0a0a0" />
                        <StyledTextInput
                            className="flex-1 ml-3 text-lg text-gray-800"
                            placeholder="Тегло (kg)"
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                            placeholderTextColor="#a0a0a0"
                        />
                    </StyledView>

                    <StyledTouchableOpacity
                        className="bg-blue-500 rounded-2xl py-4 px-6"
                        onPress={handleSaveWeight}
                    >
                        <StyledText className="text-white text-center text-lg font-semibold">
                            Запазете
                        </StyledText>
                    </StyledTouchableOpacity>
                </StyledView>
            </StyledView>
        </StyledImageBackground>
    );
};

export default TrackWeightScreen; 
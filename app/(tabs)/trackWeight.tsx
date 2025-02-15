import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, updateDoc, doc } from 'firebase/firestore';
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
    const [errorMessage, setErrorMessage] = useState(''); // State for displaying errors

    const handleSaveWeight = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const numericWeight = Number(weight);

            // Check if weight is valid (between 30 and 500 kg)
            if (isNaN(numericWeight) || numericWeight < 30 || numericWeight > 500) {
                setErrorMessage('Моля, въведете тегло между 30 и 500 kg!'); // Show error message on screen
                return;
            }

            // Clear error if input is valid
            setErrorMessage('');

            // Save weight if it's valid
            await updateDoc(doc(db, 'users', user.uid), {
                weight: numericWeight
            });

            await addDoc(collection(db, 'users', user.uid, 'weightHistory'), {
                weight: numericWeight,
                date: new Date()
            });

            navigation.goBack();
        } catch (error) {
            console.error('Error saving weight:', error);
            setErrorMessage('Грешка при записване на теглото. Опитайте отново.');
        }
    };

    return (
        <StyledImageBackground
            source={{
                uri: 'https://i.imgur.com/8F9ZGpX.png',
            }}
            style={{ flex: 1 }}
            blurRadius={5}
        >
            <View style={{ backgroundColor: '#000000', flex: 1 }}>
                <View style={styles.headerBackground}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            Запишете текущото си тегло
                        </Text>
                    </View>
                </View>

                <View style={styles.container}>
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="barbell-outline" size={24} color="#999999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Тегло (kg)"
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                                placeholderTextColor="#999999"
                                selectionColor="#4CAF50"
                            />
                        </View>

                        {/* Show error message if validation fails */}
                        {errorMessage !== '' && (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveWeight}
                        >
                            <Text style={styles.saveButtonText}>
                                Запазете
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </StyledImageBackground>
    );
};

const styles = StyleSheet.create({
    headerBackground: {
        backgroundColor: '#000000',
        paddingBottom: 15,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 15,
        backgroundColor: '#000000',
    },
    backButton: {
        padding: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '300',
        color: '#FFFFFF',
        marginLeft: 15,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    inputContainer: {
        backgroundColor: '#1A1A1A',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 15,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default TrackWeightScreen;

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ImageBackground, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledImageBackground = styled(ImageBackground);

const db = getFirestore();
const auth = getAuth();

const PlanMealScreen = ({ navigation, route }) => {
    const editingMeal = route.params?.meal;
    const [mealName, setMealName] = useState(editingMeal?.name || '');
    const [calories, setCalories] = useState(editingMeal?.calories?.toString() || '');
    const [protein, setProtein] = useState(editingMeal?.protein?.toString() || '');
    const [carbs, setCarbs] = useState(editingMeal?.carbs?.toString() || '');
    const [fats, setFats] = useState(editingMeal?.fats?.toString() || '');
    const [plannedFor, setPlannedFor] = useState(editingMeal?.plannedFor || new Date());
    const [error, setError] = useState('');

    const validateInputs = () => {
        const numericCalories = Number(calories);
        const numericProtein = Number(protein);
        const numericCarbs = Number(carbs);
        const numericFats = Number(fats);

        if (!mealName.trim()) return 'Моля, въведете име на ястието!';
        if (isNaN(numericCalories) || numericCalories < 100 || numericCalories > 5000)
            return 'Калориите трябва да бъдат между 100 и 5000!';
        if (isNaN(numericProtein) || numericProtein < 5 || numericProtein > 500)
            return 'Протеинът трябва да бъде между 5 и 500 g!';
        if (isNaN(numericCarbs) || numericCarbs < 10 || numericCarbs > 1000)
            return 'Въглехидратите трябва да бъдат между 10 и 1000 g!';
        if (isNaN(numericFats) || numericFats < 5 || numericFats > 300)
            return 'Мазнините трябва да бъдат между 5 и 300 g!';
        return '';
    };

    const handleSaveMeal = async () => {
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) return;

            const mealData = {
                name: mealName,
                calories: Number(calories),
                protein: Number(protein),
                carbs: Number(carbs),
                fats: Number(fats),
                plannedFor: Timestamp.fromDate(plannedFor),
                createdAt: editingMeal ? editingMeal.createdAt : Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
                status: editingMeal?.status || 'planned',
            };

            if (editingMeal) {
                await updateDoc(doc(db, 'users', user.uid, 'plannedMeals', editingMeal.id), mealData);
                showMessage({ message: 'Ястието е обновено успешно!', type: 'success' });
            } else {
                await addDoc(collection(db, 'users', user.uid, 'plannedMeals'), mealData);
                showMessage({ message: 'Ястието е планирано успешно!', type: 'success' });
            }

            navigation.goBack();
        } catch (error) {
            console.error('Error saving planned meal:', error);
            showMessage({ message: 'Грешка при запазване на ястието', type: 'danger' });
        }
    };

    return (
        <StyledImageBackground
            source={{ uri: 'https://i.imgur.com/8F9ZGpX.png' }}
            style={{ flex: 1 }}
            blurRadius={5}
        >
            <View style={{ backgroundColor: '#000000', flex: 1 }}>
                <StyledScrollView>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {editingMeal ? 'Редактирайте ястие' : 'Планирайте ястие'}
                        </Text>
                    </View>

                    <View style={styles.container}>
                        <View style={styles.inputContainer}>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <View style={styles.inputWrapper}>
                                <Ionicons name="restaurant-outline" size={24} color="#999999" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Име на ястието"
                                    value={mealName}
                                    onChangeText={setMealName}
                                    placeholderTextColor="#999999"
                                    selectionColor="#4CAF50"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="flame-outline" size={24} color="#999999" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Калории"
                                    value={calories}
                                    onChangeText={setCalories}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999999"
                                    selectionColor="#4CAF50"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="fitness-outline" size={24} color="#999999" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Протеини (g)"
                                    value={protein}
                                    onChangeText={setProtein}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999999"
                                    selectionColor="#4CAF50"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="leaf-outline" size={24} color="#999999" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Въглехидрати (g)"
                                    value={carbs}
                                    onChangeText={setCarbs}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999999"
                                    selectionColor="#4CAF50"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="water-outline" size={24} color="#999999" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Мазнини (g)"
                                    value={fats}
                                    onChangeText={setFats}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999999"
                                    selectionColor="#4CAF50"
                                />
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
                                <Text style={styles.saveButtonText}>{editingMeal ? 'Обновете' : 'Запазете'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </StyledScrollView>
            </View>
        </StyledImageBackground>
    );
};

const styles = StyleSheet.create({
    headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 15 },
    backButton: { padding: 10 },
    headerTitle: { fontSize: 24, fontWeight: '300', color: '#FFFFFF', marginLeft: 15 },
    container: { flex: 1, padding: 20 },
    inputContainer: { backgroundColor: '#1A1A1A', borderRadius: 15, padding: 20, marginBottom: 20 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000', borderRadius: 10, padding: 15, marginBottom: 15 },
    input: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 15 },
    errorText: { color: 'red', fontSize: 16, marginBottom: 10, textAlign: 'center' },
    saveButton: { backgroundColor: '#4CAF50', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default PlanMealScreen;
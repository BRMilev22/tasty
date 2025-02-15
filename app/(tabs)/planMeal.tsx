import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, Timestamp, updateDoc, doc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const PlanMealScreen = ({ navigation, route }) => {
    const editingMeal = route.params?.meal;
    const [mealName, setMealName] = useState(editingMeal?.name || '');
    const [calories, setCalories] = useState(editingMeal?.calories?.toString() || '');
    const [protein, setProtein] = useState(editingMeal?.protein?.toString() || '');
    const [carbs, setCarbs] = useState(editingMeal?.carbs?.toString() || '');
    const [fats, setFats] = useState(editingMeal?.fats?.toString() || '');
    const [plannedFor, setPlannedFor] = useState(editingMeal?.plannedFor || new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSaveMeal = async () => {
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
                // Update existing meal
                await updateDoc(
                    doc(db, 'users', user.uid, 'plannedMeals', editingMeal.id),
                    mealData
                );
                showMessage({
                    message: 'Ястието е обновено успешно!',
                    type: 'success',
                });
            } else {
                // Create new meal
                await addDoc(collection(db, 'users', user.uid, 'plannedMeals'), mealData);
                showMessage({
                    message: 'Ястието е планирано успешно!',
                    type: 'success',
                });
            }

            navigation.goBack();
        } catch (error) {
            console.error('Error saving planned meal:', error);
            showMessage({
                message: 'Грешка при запазване на ястието',
                type: 'danger',
            });
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
                <StyledScrollView>
                    <View style={styles.headerBackground}>
                        <View style={styles.headerContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>
                                {editingMeal ? 'Редактирайте ястие' : 'Планирайте ястие'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.container}>
                        <View style={styles.inputContainer}>
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

                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={24} color="#999999" />
                                <Text style={styles.dateText}>
                                    {plannedFor.toLocaleString('bg-BG')}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={plannedFor}
                                    mode="datetime"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            setPlannedFor(selectedDate);
                                        }
                                    }}
                                />
                            )}

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveMeal}
                            >
                                <Text style={styles.saveButtonText}>
                                    {editingMeal ? 'Обновете' : 'Запазете'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </StyledScrollView>
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    dateText: {
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
});

export default PlanMealScreen; 
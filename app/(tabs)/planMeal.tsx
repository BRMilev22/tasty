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
            uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg',
          }}
            className="flex-1"
        >
            <StyledScrollView className="flex-1">
                <StyledView className="flex-1 px-6 pt-12">
                    <StyledView className="flex-row items-center mb-8">
                        <StyledTouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="mr-4"
                        >
                            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                        </StyledTouchableOpacity>
                        <StyledText className="text-2xl font-bold text-gray-800">
                            {editingMeal ? 'Редактирайте ястие' : 'Планирайте ястие'}
                        </StyledText>
                    </StyledView>

                    <StyledView className="bg-white/50 rounded-3xl p-6 shadow-md">
                        <StyledView className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-4">
                            <Ionicons name="restaurant-outline" size={24} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-lg text-gray-800"
                                placeholder="Име на ястието"
                                value={mealName}
                                onChangeText={setMealName}
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        <StyledView className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-4">
                            <Ionicons name="flame-outline" size={24} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-lg text-gray-800"
                                placeholder="Калории"
                                value={calories}
                                onChangeText={setCalories}
                                keyboardType="numeric"
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        <StyledView className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-4">
                            <Ionicons name="fitness-outline" size={24} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-lg text-gray-800"
                                placeholder="Протеини (g)"
                                value={protein}
                                onChangeText={setProtein}
                                keyboardType="numeric"
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        <StyledView className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-4">
                            <Ionicons name="leaf-outline" size={24} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-lg text-gray-800"
                                placeholder="Въглехидрати (g)"
                                value={carbs}
                                onChangeText={setCarbs}
                                keyboardType="numeric"
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        <StyledView className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-4">
                            <Ionicons name="water-outline" size={24} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-lg text-gray-800"
                                placeholder="Мазнини (g)"
                                value={fats}
                                onChangeText={setFats}
                                keyboardType="numeric"
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        <StyledTouchableOpacity
                            className="flex-row items-center bg-white/70 rounded-2xl p-4 mb-6"
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={24} color="#a0a0a0" />
                            <StyledText className="ml-3 text-lg text-gray-800">
                                {plannedFor.toLocaleString('bg-BG')}
                            </StyledText>
                        </StyledTouchableOpacity>

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

                        <StyledTouchableOpacity
                            className="bg-blue-500 rounded-2xl py-4 px-6"
                            onPress={handleSaveMeal}
                        >
                            <StyledText className="text-white text-center text-lg font-semibold">
                                {editingMeal ? 'Обновете' : 'Запазете'}
                            </StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledView>
            </StyledScrollView>
        </StyledImageBackground>
    );
};

export default PlanMealScreen; 
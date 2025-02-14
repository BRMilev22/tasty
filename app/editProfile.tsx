import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground, Image, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { styled } from 'nativewind';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

const storage = getStorage();
const firestore = getFirestore();

const StyledImageBackground = styled(ImageBackground);
const StyledAnimatedView = styled(Animated.View);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);

const EditProfileScreen = () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.error('User is not logged in.');
        return null;
    }

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [goal, setGoal] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [profileImage, setProfileImage] = useState(user?.photoURL || '');
    const [error, setError] = useState('');
    const [showGoalPicker, setShowGoalPicker] = useState(false);
    const [activityLevel, setActivityLevel] = useState<number>(1.55);
    const [showActivityPicker, setShowActivityPicker] = useState(false);
    const [goalWeight, setGoalWeight] = useState('');
    
    const availableGoals = [
        'Maintain Weight',
        'Lose Weight',
        'Gain Weight'
    ];

    const availableActivityLevels = [
        { label: 'Заседнал начин на живот', value: 1.2 },
        { label: 'Леко активен (1-3 пъти седмично)', value: 1.375 },
        { label: 'Умерено активен (3-5 пъти седмично)', value: 1.55 },
        { label: 'Много активен (6-7 пъти седмично)', value: 1.725 },
        { label: 'Изключително активен', value: 1.9 }
    ];

    // First, let's create a translation map for the goals
    const goalTranslations: { [key: string]: string } = {
        'Maintain Weight': 'Поддържане на тегло',
        'Lose Weight': 'Отслабване',
        'Gain Weight': 'Качване на тегло'
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setFirstName(userData.firstName || '');
                    setLastName(userData.lastName || '');
                    setHeight(userData.height || '');
                    setWeight(userData.weight || '');
                    setGoal(userData.goal || '');
                    setProfileImage(userData.profileImage || user.photoURL || '');
                    setGoalWeight(userData.goalWeight || '');
                    
                    // Make sure we handle the activity level as a number
                    const savedActivityLevel = userData.activityLevel;
                    if (typeof savedActivityLevel === 'number' && !isNaN(savedActivityLevel)) {
                        setActivityLevel(savedActivityLevel);
                    } else {
                        setActivityLevel(1.55); // Default value
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [user]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password: string) => {
        const containsNumber = /\d/.test(password);
        const containsLetter = /[a-zA-Z]/.test(password);
        const containsUpperCase = /[A-Z]/.test(password);
        const containsSpecialChar = /[!@?#$%&*]/.test(password);

        if (password.length < 8) {
            setError('Паролата трябва да е с дължина от поне 8 символа.');
            return false;
        }
        if (!containsLetter) {
            setError('Паролата трябва да съдържа поне една буква.');
            return false;
        }
        if (!containsNumber) {
            setError('Паролата трябва да съдържа поне едно число');
            return false;
        }
        if (!containsUpperCase) {
            setError('Паролата трябва да съдържа поне една главна буква.');
            return false;
        }
        if (!containsSpecialChar) {
            setError('Паролата трябва да съдържа поне един специален символ.');
            return false;
        }
        return true;
    };

    const isValidHeight = (height: string) => {
        if (!height.trim()) return true;
        const heightNum = Number(height);
        if (isNaN(heightNum) || heightNum <= 0 || heightNum < 30 || heightNum > 300) {
            setError('Височината трябва да бъде положително число между 30 cm и 300 cm.');
            return false;
        }
        return true;
    };

    const isValidWeight = (weight: string) => {
        if (!weight.trim()) return true;
        const weightNum = Number(weight);
        if (isNaN(weightNum) || weightNum <= 0 || weightNum < 30 || weightNum > 500) {
            setError('Теглото трябва да бъде положително число между 30 kg и 500 kg.');
            return false;
        }
        return true;
    };

    const isValidGoalWeight = (weight: string) => {
        if (!weight.trim()) return true;
        const weightNum = Number(weight);
        if (isNaN(weightNum) || weightNum <= 0 || weightNum < 30 || weightNum > 500) {
            setError('Целевото тегло трябва да бъде между 30 kg и 500 kg.');
            return false;
        }
        return true;
    };

    const validateFirstName = (firstName: string) => {
        const nameRegex = /^(?=.*[A-Z])[A-Za-z]{2,}$/;
        return nameRegex.test(firstName);
    };

    const validateLastName = (lastName: string) => {
        const nameRegex = /^(?=.*[A-Z])[A-Za-z]{2,}$/;
        return nameRegex.test(lastName);
    };

    const validateInputs = () => {
        if (email.trim() && !isValidEmail(email)) {
            setError('Моля, добавете валиден имейл.');
            return false;
        }

        if (password && !isValidPassword(password)) {
            return false;
        }

        if (firstName.trim() && !validateFirstName(firstName)) {
            setError('Невалидно име.');
            return false;
        }

        if (lastName.trim() && !validateLastName(lastName)) {
            setError('Невалидна фамилия.');
            return false;
        }

        if (!isValidHeight(height)) {
            return false;
        }

        if (!isValidWeight(weight)) {
            return false;
        }

        if (!isValidGoalWeight(goalWeight)) {
            return false;
        }

        setError('');
        return true;
    };

    const handleSaveChanges = async () => {
        if (!validateInputs()) {
            return;
        }

        if (password && password !== confirmPassword) {
            setError('Паролите не съвпадат');
            return;
        }

        try {
            if (email && email !== user?.email) {
                await updateEmail(user!, email);
            }

            if (password) {
                await updatePassword(user!, password);
            }

            const profileUpdates: { displayName?: string; photoURL?: string } = {};
            if (firstName.trim() || lastName.trim()) {
                profileUpdates.displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
            }
            if (profileImage) {
                profileUpdates.photoURL = profileImage;
            }

            if (Object.keys(profileUpdates).length > 0) {
                await updateProfile(user!, profileUpdates);
            }

            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
                firstName,
                lastName,
                height,
                weight,
                goal,
                goalWeight,
                activityLevel,
                profileImage,
                // ... other user data ...
            }, { merge: true });

            showMessage({
                message: 'Профилът бе актуализиран успешно!',
                type: 'success',
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Грешка при актуализирането на профила. Моля, опитайте отново');
            showMessage({
                message: 'Грешка при актуализирането на профила.',
                type: 'danger',
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
        >
            <StyledImageBackground
                source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
                className="flex-1 justify-center items-center"
                blurRadius={20}
            >
                <StyledAnimatedView className="flex-1 justify-center items-center">
                    <StyledView className="w-[85%] p-4 rounded-2xl bg-white/30 border border-white/20 shadow-md shadow-black/20 items-center backdrop-blur-lg">
                        <StyledText className="text-2xl font-bold text-gray-800 mb-4">Редактирайте профила</StyledText>
                        {error ? <StyledText className="text-red-500 mb-2">{error}</StyledText> : null}

                        <TouchableOpacity onPress={handlePickImage} style={{ marginBottom: 8 }}>
                            {profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 60,
                                        borderWidth: 2,
                                        borderColor: 'white',
                                    }}
                                />
                            ) : (
                                <Ionicons name="person-circle-outline" size={80} color="#a0a0a0" />
                            )}
                        </TouchableOpacity>

                        {/* First Name Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="person-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Име"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholderTextColor="#a0a0a0"
                                style={{ height: 25 }}
                            />
                        </StyledView>

                        {/* Last Name Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="person-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Фамилия"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholderTextColor="#a0a0a0"
                                style={{ height: 25 }}
                            />
                        </StyledView>

                        {/* Email Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="mail-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Имейл"
                                value={email}
                                onChangeText={setEmail}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="email-address"
                                style={{ height: 25 }}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />
                        </StyledView>

                        {/* Password Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="lock-closed-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Нова парола"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor="#a0a0a0"
                                style={{ height: 25 }}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#a0a0a0"
                                    />
                                </TouchableOpacity>
                        </StyledView>
                        

                        {/* Confirm Password Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="lock-closed-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Потвърдете новата парола"
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholderTextColor="#a0a0a0"
                                style={{ height: 25 }}
                            />
                        </StyledView>

                        {/* Height Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="resize-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Височина (cm)"
                                value={height}
                                onChangeText={setHeight}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="numeric"
                                style={{ height: 25 }}
                            />
                        </StyledView>

                        {/* Weight Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-4 w-full">
                            <Ionicons name="barbell-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Маса (kg)"
                                value={weight}
                                onChangeText={setWeight}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="numeric"
                                style={{ height: 25 }}
                            />
                        </StyledView>
                        
                        {/* Goal Weight Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="trending-up-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800 h-10"
                                placeholder="Целево тегло (kg)"
                                value={goalWeight}
                                onChangeText={setGoalWeight}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="numeric"
                                style={{ height: 25 }}
                            />
                        </StyledView>

                        {/* Goal Selection */}
                        <StyledTouchableOpacity 
                            className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full"
                            onPress={() => setShowGoalPicker(true)}
                        >
                            <Ionicons name="battery-half-outline" size={20} color="#a0a0a0" />
                            <StyledText className="flex-1 ml-2 text-base text-gray-800 h-10">
                                {goal ? goalTranslations[goal] : "Изберете цел"}
                            </StyledText>
                        </StyledTouchableOpacity>

                        {/* Goal Picker Modal */}
                        <Modal
                            visible={showGoalPicker}
                            transparent={true}
                            animationType="slide"
                        >
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => setShowGoalPicker(false)}
                                activeOpacity={1}
                            >
                                <View className="flex-1 justify-end bg-black/50">
                                    <View className="bg-white rounded-t-3xl">
                                        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                                            <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                                                <StyledText className="text-gray-500 font-semibold text-lg">Отказ</StyledText>
                                            </TouchableOpacity>
                                            <StyledText className="text-gray-800 font-bold text-lg">Изберете цел</StyledText>
                                            <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                                                <StyledText className="text-blue-500 font-semibold text-lg">Готово</StyledText>
                                            </TouchableOpacity>
                                        </View>
                                        <View className="px-4 bg-white">
                                            <Picker
                                                selectedValue={goal}
                                                onValueChange={(itemValue) => {
                                                    setGoal(itemValue);
                                                    setShowGoalPicker(false);
                                                }}
                                                style={{ height: 215, color: '#000000' }}
                                            >
                                                {availableGoals.map((g) => (
                                                    <Picker.Item 
                                                        key={g} 
                                                        label={g} 
                                                        value={g}
                                                        style={{
                                                            fontSize: 18,
                                                            color: '#000000'
                                                        }}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        {/* Activity Level Selection */}
                        <StyledTouchableOpacity 
                            className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full"
                            onPress={() => setShowActivityPicker(true)}
                        >
                            <Ionicons name="fitness-outline" size={20} color="#a0a0a0" />
                            <StyledText className="flex-1 ml-2 text-base text-gray-800 h-10">
                                {activityLevel ? 
                                    availableActivityLevels.find(level => Math.abs(level.value - activityLevel) < 0.01)?.label || 'Изберете активност'
                                    : 'Изберете активност'
                                }
                            </StyledText>
                        </StyledTouchableOpacity>

                        {/* Activity Level Picker Modal */}
                        <Modal
                            visible={showActivityPicker}
                            transparent={true}
                            animationType="slide"
                        >
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => setShowActivityPicker(false)}
                                activeOpacity={1}
                            >
                                <View className="flex-1 justify-end bg-black/50">
                                    <View className="bg-white rounded-t-3xl">
                                        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                                            <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                                                <StyledText className="text-gray-500 font-semibold text-lg">Отказ</StyledText>
                                            </TouchableOpacity>
                                            <StyledText className="text-gray-800 font-bold text-lg">Изберете активност</StyledText>
                                            <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                                                <StyledText className="text-blue-500 font-semibold text-lg">Готово</StyledText>
                                            </TouchableOpacity>
                                        </View>
                                        <View className="px-4 bg-white">
                                            <Picker
                                                selectedValue={activityLevel}
                                                onValueChange={(itemValue) => {
                                                    setActivityLevel(itemValue);
                                                    setShowActivityPicker(false);
                                                }}
                                                style={{ height: 215, color: '#000000' }}
                                            >
                                                {availableActivityLevels.map((level) => (
                                                    <Picker.Item 
                                                        key={level.value.toString()} 
                                                        label={level.label} 
                                                        value={level.value}
                                                        style={{
                                                            fontSize: 18,
                                                            color: '#000000'
                                                        }}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        <StyledTouchableOpacity
                            className="bg-gradient-to-r from-[#ffffff] to-[#e0e0e0] rounded-2xl py-3 w-full mb-4 shadow-md shadow-gray-400"
                            onPress={handleSaveChanges}
                        >
                            <StyledText className="text-gray-800 text-center text-lg font-semibold">Потвърдете промените</StyledText>
                        </StyledTouchableOpacity>

                        </StyledView>
                    </StyledAnimatedView>
                </StyledImageBackground>
            <FlashMessage position="top" />
        </KeyboardAvoidingView>
    );
};

export default EditProfileScreen;
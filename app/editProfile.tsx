import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { styled } from 'nativewind';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Import Firestore functions

const storage = getStorage();
const firestore = getFirestore(); // Initialize Firestore

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

    // State variables for user details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [profileImage, setProfileImage] = useState(user?.photoURL || '');
    const [error, setError] = useState('');

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

    const handleSaveChanges = async () => {
        if (password && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
    
        try {
            // Update email if it's not empty and different from the current email
            if (email && email !== user?.email) {
                await updateEmail(user!, email);
            }
    
            // Update password if it's not empty
            if (password) {
                await updatePassword(user!, password);
            }
    
            // Prepare profile updates, ignoring empty displayName and photoURL
            const profileUpdates: { displayName?: string; photoURL?: string } = {};
            if (firstName.trim() || lastName.trim()) {
                profileUpdates.displayName = `${firstName.trim()} ${lastName.trim()}`.trim(); // Concatenate names if at least one is provided
            }
            if (profileImage) {
                profileUpdates.photoURL = profileImage; // Update photoURL only if an image is provided
            }
    
            // Update Firebase profile only if there are changes
            if (Object.keys(profileUpdates).length > 0) {
                await updateProfile(user!, profileUpdates);
            }
    
            // Prepare Firestore updates, ignoring empty fields for height, weight, firstName, and lastName
            const firestoreUpdates: Record<string, any> = {}; // Use Record<string, any> for flexible object
            if (firstName.trim()) {
                firestoreUpdates.firstName = firstName.trim();
            }
            if (lastName.trim()) {
                firestoreUpdates.lastName = lastName.trim();
            }
            if (height.trim()) {
                firestoreUpdates.height = height.trim();
            }
            if (weight.trim()) {
                firestoreUpdates.weight = weight.trim();
            }
            if (profileImage) {
                firestoreUpdates.profileImage = profileImage;
            }
    
            // Update Firestore only if there are valid updates
            if (Object.keys(firestoreUpdates).length > 0) {
                await setDoc(doc(firestore, 'users', user.uid), firestoreUpdates, { merge: true });
            }
    
            showMessage({
                message: 'Profile updated successfully!',
                type: 'success',
            });
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Error updating profile, please try again');
            showMessage({
                message: 'Error updating profile',
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
                        <StyledText className="text-2xl font-bold text-gray-800 mb-4">Edit Profile</StyledText>
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
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="First Name"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        {/* Last Name Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="person-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Last Name"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        {/* Email Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="mail-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="email-address"
                            />
                        </StyledView>

                        {/* Password Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="lock-closed-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="New Password"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        {/* Confirm Password Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="lock-closed-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Confirm Password"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholderTextColor="#a0a0a0"
                            />
                        </StyledView>

                        {/* Height Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-2 w-full">
                            <Ionicons name="resize-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Height (cm)"
                                value={height}
                                onChangeText={setHeight}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="numeric"
                            />
                        </StyledView>

                        {/* Weight Input */}
                        <StyledView className="flex-row items-center bg-white/50 rounded-2xl p-2 mb-4 w-full">
                            <Ionicons name="barbell-outline" size={20} color="#a0a0a0" />
                            <StyledTextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Weight (kg)"
                                value={weight}
                                onChangeText={setWeight}
                                placeholderTextColor="#a0a0a0"
                                keyboardType="numeric"
                            />
                        </StyledView>

                        <StyledTouchableOpacity
                            className="bg-gradient-to-r from-[#ffffff] to-[#e0e0e0] rounded-2xl py-4 w-full mb-4 shadow-md shadow-gray-400"
                            onPress={handleSaveChanges}
                        >
                            <StyledText className="text-gray-800 text-center text-lg font-semibold">Confirm Changes</StyledText>
                        </StyledTouchableOpacity>

                        <FlashMessage position="top" />
                    </StyledView>
                </StyledAnimatedView>
            </StyledImageBackground>
        </KeyboardAvoidingView>
    );
};

export default EditProfileScreen;
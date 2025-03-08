import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, ImageBackground, Image, KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, updateEmail, updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginTop: 44,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    lineHeight: 22,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  changePhotoButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  pickerButton: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    marginHorizontal: 8,
    marginBottom: 16,
    width: '95%',
    alignSelf: 'center',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerContent: {
    paddingHorizontal: 8,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingBottom: 16,
  },
  pickerItemStyle: {
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  profileCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  securitySection: {
    marginBottom: 20,
  },
  securityLabel: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  updateSecurityButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  updateSecurityButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reauthDialog: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reauthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reauthSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  reauthButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  reauthCancelButton: {
    padding: 12,
    marginRight: 12,
  },
  reauthConfirmButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  reauthCancelButtonText: {
    color: '#999999',
    fontSize: 16,
  },
  reauthConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

interface ReauthDialogProps {
  visible: boolean;
  currentPassword: string;
  onPasswordChange: (password: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ReauthenticationDialog: React.FC<ReauthDialogProps> = ({
  visible,
  currentPassword,
  onPasswordChange,
  onCancel,
  onConfirm
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
  >
    <View style={styles.modalOverlay}>
      <View style={styles.reauthDialog}>
        <Text style={styles.reauthTitle}>Потвърдете самоличността си</Text>
        <Text style={styles.reauthSubtitle}>
          Моля, въведете текущата си парола, за да продължите
        </Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999999" />
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={onPasswordChange}
            placeholder="Текуща парола"
            placeholderTextColor="#999999"
            secureTextEntry={true}
          />
        </View>

        <View style={styles.reauthButtons}>
          <TouchableOpacity 
            style={styles.reauthCancelButton}
            onPress={onCancel}
          >
            <Text style={styles.reauthCancelButtonText}>Отказ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reauthConfirmButton}
            onPress={onConfirm}
          >
            <Text style={styles.reauthConfirmButtonText}>Потвърди</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

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
    const [showReauthDialog, setShowReauthDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [pendingSecurityAction, setPendingSecurityAction] = useState<'email' | 'password' | null>(null);
    
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
    ] as const;

    const goalTranslations: { [key: string]: string } = {
        'Maintain Weight': 'Поддържане на тегло',
        'Lose Weight': 'Отслабване',
        'Gain Weight': 'Качване на тегло',
        'Поддържане на тегло': 'Maintain Weight',
        'Отслабване': 'Lose Weight',
        'Качване на тегло': 'Gain Weight'
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
                activityLevel: Number(activityLevel),
                profileImage,
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

    const handleUpdateSecurity = async () => {
        if (!user) return;

        try {
            if (email !== user.email) {
                setPendingSecurityAction('email');
                setShowReauthDialog(true);
                return;
            }

            if (password) {
                if (password !== confirmPassword) {
                    showMessage({
                        message: 'Паролите не съвпадат',
                        type: 'danger',
                    });
                    return;
                }
                if (password.length < 6) {
                    showMessage({
                        message: 'Паролата трябва да е поне 6 символа',
                        type: 'danger',
                    });
                    return;
                }
                setPendingSecurityAction('password');
                setShowReauthDialog(true);
                return;
            }
        } catch (error) {
            console.error('Error updating security:', error);
            showMessage({
                message: 'Грешка при обновяването на сигурността',
                description: 'Моля, опитайте отново по-късно',
                type: 'danger',
            });
        }
    };

    const handleReauthenticate = async () => {
        if (!user || !user.email) return;

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            if (pendingSecurityAction === 'email') {
                await updateEmail(user, email);
                showMessage({
                    message: 'Имейлът е обновен успешно',
                    type: 'success',
                });
            } else if (pendingSecurityAction === 'password') {
                await updatePassword(user, password);
                setPassword('');
                setConfirmPassword('');
                showMessage({
                    message: 'Паролата е обновена успешно',
                    type: 'success',
                });
            }

            setShowReauthDialog(false);
            setCurrentPassword('');
            setPendingSecurityAction(null);
        } catch (error) {
            console.error('Error during reauthentication:', error);
            showMessage({
                message: 'Грешна парола',
                description: 'Моля, проверете паролата си и опитайте отново',
                type: 'danger',
            });
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Редактиране на профил</Text>
                    <Text style={styles.headerSubtitle}>Променете вашите лични данни</Text>
                </View>

                {/* Profile Image Card */}
                <View style={styles.profileCard}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.profileImageContainer}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Ionicons name="person-circle-outline" size={60} color="#999999" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
                            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.changePhotoText}>Променете снимката</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>

                {/* Personal Info Card */}
                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Лична информация</Text>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Ionicons name="person-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Име"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholderTextColor="#999999"
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Ionicons name="person-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Фамилия"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholderTextColor="#999999"
                            />
                        </View>
                    </View>
                </View>

                {/* Security Card */}
                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Сигурност</Text>
                    
                    {/* Email Section */}
                    <View style={styles.securitySection}>
                        <Text style={styles.securityLabel}>Имейл адрес</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Нов имейл адрес"
                                placeholderTextColor="#999999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Password Section */}
                    <View style={styles.securitySection}>
                        <Text style={styles.securityLabel}>Промяна на парола</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Нова парола"
                                placeholderTextColor="#999999"
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color="#999999" 
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Потвърдете новата парола"
                                placeholderTextColor="#999999"
                                secureTextEntry={!showPassword}
                            />
                        </View>
                    </View>

                    {/* Update Security Button */}
                    <TouchableOpacity 
                        style={styles.updateSecurityButton}
                        onPress={handleUpdateSecurity}
                    >
                        <Text style={styles.updateSecurityButtonText}>Обновете сигурността</Text>
                    </TouchableOpacity>
                </View>

                {/* Physical Info Card */}
                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Физически данни</Text>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Ionicons name="resize-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Височина (cm)"
                                value={height}
                                onChangeText={setHeight}
                                placeholderTextColor="#999999"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Ionicons name="barbell-outline" size={20} color="#999999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Тегло (kg)"
                                value={weight}
                                onChangeText={setWeight}
                                placeholderTextColor="#999999"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="trending-up-outline" size={20} color="#999999" />
                        <TextInput
                            style={styles.input}
                            placeholder="Целево тегло (kg)"
                            value={goalWeight}
                            onChangeText={setGoalWeight}
                            placeholderTextColor="#999999"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Goals Card */}
                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Цели и активност</Text>
                    <TouchableOpacity 
                        style={styles.pickerButton}
                        onPress={() => setShowGoalPicker(true)}
                    >
                        <Ionicons name="flag-outline" size={20} color="#999999" />
                        <Text style={styles.pickerButtonText}>
                            {goal ? goalTranslations[goal] : 'Изберете цел'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#999999" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.pickerButton}
                        onPress={() => setShowActivityPicker(true)}
                    >
                        <Ionicons name="fitness-outline" size={20} color="#999999" />
                        <Text style={styles.pickerButtonText}>
                            {activityLevel ? 
                                availableActivityLevels.find(level => level.value === activityLevel)?.label || 'Изберете активност'
                                : 'Изберете активност'
                            }
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#999999" />
                    </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                    <Text style={styles.saveButtonText}>Запазете промените</Text>
                </TouchableOpacity>

                {/* Goal Picker Modal */}
                <Modal
                    visible={showGoalPicker}
                    transparent={true}
                    animationType="slide"
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        onPress={() => setShowGoalPicker(false)}
                        activeOpacity={1}
                    >
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>Изберете цел</Text>
                            </View>
                            <View style={styles.pickerContent}>
                                <Picker
                                    selectedValue={goal}
                                    onValueChange={(itemValue) => {
                                        setGoal(itemValue);
                                        setShowGoalPicker(false);
                                    }}
                                    style={{ color: '#FFFFFF' }}
                                    itemStyle={styles.pickerItemStyle}
                                >
                                    {availableGoals.map((g) => (
                                        <Picker.Item 
                                            key={g} 
                                            label={goalTranslations[g]} 
                                            value={g}
                                            color="#FFFFFF"
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Activity Level Picker Modal */}
                <Modal
                    visible={showActivityPicker}
                    transparent={true}
                    animationType="slide"
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        onPress={() => setShowActivityPicker(false)}
                        activeOpacity={1}
                    >
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>Изберете активност</Text>
                            </View>
                            <View style={styles.pickerContent}>
                                <Picker
                                    selectedValue={activityLevel}
                                    onValueChange={(itemValue) => {
                                        setActivityLevel(Number(itemValue));
                                        setShowActivityPicker(false);
                                    }}
                                    style={{ color: '#FFFFFF' }}
                                    itemStyle={styles.pickerItemStyle}
                                >
                                    {availableActivityLevels.map((level) => (
                                        <Picker.Item
                                            key={level.value.toString()}
                                            label={level.label}
                                            value={level.value}
                                            color="#FFFFFF"
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </ScrollView>
            <ReauthenticationDialog 
                visible={showReauthDialog}
                currentPassword={currentPassword}
                onPasswordChange={setCurrentPassword}
                onCancel={() => {
                    setShowReauthDialog(false);
                    setCurrentPassword('');
                    setPendingSecurityAction(null);
                }}
                onConfirm={handleReauthenticate}
            />
            <FlashMessage position="top" />
        </KeyboardAvoidingView>
    );
};

export default EditProfileScreen;
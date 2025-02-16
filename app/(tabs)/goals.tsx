import React, { useState } from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { styled } from 'nativewind';
import Ionicons from 'react-native-vector-icons/Ionicons';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);

const GoalsScreen = () => {
  const [goals, setGoals] = useState<{ text: string; fadeAnim: Animated.Value }[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);

  // Function to add a new goal
  const addGoal = () => {
    if (newGoal.trim()) {
      const newGoalItem = { text: newGoal, fadeAnim: new Animated.Value(0) };
      setGoals((prevGoals) => [...prevGoals, newGoalItem]);
      Animated.timing(newGoalItem.fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setNewGoal('');
    }
  };

  // Function to delete a goal
  const deleteGoal = (index: number) => {
    Alert.alert('Изтриване', 'Сигурни ли сте, че искате да изтриете тази цел?', [
      { text: 'Откажете', style: 'cancel' },
      {
        text: 'Изтрийте',
        onPress: () => {
          Animated.timing(goals[index].fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setGoals((prevGoals) => prevGoals.filter((_, i) => i !== index));
          });
        },
      },
    ]);
  };

  // Function to edit a goal
  const editGoal = () => {
    if (selectedGoalIndex !== null && newGoal.trim()) {
      const updatedGoals = [...goals];
      updatedGoals[selectedGoalIndex].text = newGoal;
      setGoals(updatedGoals);
      setModalVisible(false);
      setNewGoal('');
      setSelectedGoalIndex(null);
    }
  };

  const renderGoal = ({ item, index }: { item: { text: string; fadeAnim: Animated.Value }; index: number }) => (
    <Animated.View style={{ opacity: item.fadeAnim }}>
      <StyledView className="bg-black p-4 rounded-lg mb-3 border border-green-500 flex-row items-center">
        <Text className="text-lg">🎯</Text>
        <StyledText className="text-lg font-bold text-white flex-1 ml-3">{item.text}</StyledText>
        <StyledTouchableOpacity 
          className="bg-transparent p-2 rounded-lg border border-green-500 mr-2" 
          onPress={() => {
            setNewGoal(item.text);
            setSelectedGoalIndex(index);
            setModalVisible(true);
          }}
        >
          <Ionicons name="pencil-outline" size={20} color="white" />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity 
          className="bg-transparent p-2 rounded-lg border border-red-500" 
          onPress={() => deleteGoal(index)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </StyledTouchableOpacity>
      </StyledView>
    </Animated.View>
  );

  return (
    <StyledView className="flex-1 bg-black p-5">
      <StyledText className="text-2xl font-bold text-white text-center mt-10 mb-5">Вашите цели</StyledText>

      {/* Goal Input Field with Icon */}
      <StyledView className="flex-row items-center border border-green-500 px-3 py-3 rounded-lg mb-4">
        <Ionicons name="flag-outline" size={24} color="white" />
        <StyledTextInput
          className="flex-1 text-white ml-3 text-lg py-5"
          placeholder="Добавете нова цел"
          placeholderTextColor="#a0a0a0"
          value={newGoal}
          onChangeText={setNewGoal}
        />
        <StyledTouchableOpacity 
          className="bg-[#1A1A1A] p-3 rounded-lg border border-green-500" 
          onPress={addGoal}
        >
          <Ionicons name="add" size={24} color="white" />
        </StyledTouchableOpacity>
      </StyledView>

      {goals.length === 0 ? (
        <StyledText className="text-white text-center text-lg">🤔 Няма добавени цели...</StyledText>
      ) : (
        <StyledFlatList data={goals} renderItem={renderGoal} keyExtractor={(item, index) => index.toString()} />
      )}

      {/* Edit Goal Modal */}
      <StyledModal animationType="slide" transparent={true} visible={isModalVisible}>
        <StyledView className="flex-1 justify-center items-center bg-black/80">
          <StyledView className="bg-black p-6 rounded-lg w-4/5 border border-green-500">
            <StyledText className="text-2xl font-bold text-white mb-4">📝 Редактирайте цел</StyledText>
            
            {/* Input field inside modal */}
            <StyledView className="flex-row items-center border border-green-500 px-3 py-2 rounded-lg mb-4">
              <Ionicons name="flag-outline" size={24} color="white" />
              <StyledTextInput
                className="flex-1 text-white ml-3 text-lg py-2"
                value={newGoal}
                onChangeText={setNewGoal}
              />
            </StyledView>

            <StyledView className="flex-row justify-between">
              <StyledPressable className="bg-white p-3 rounded-lg flex-1 mr-2 border border-green-500" onPress={editGoal}>
                <StyledText className="text-black font-bold">✅ Запазете</StyledText>
              </StyledPressable>
              <StyledPressable className="bg-white p-3 rounded-lg flex-1 ml-2 border border-green-500" onPress={() => setModalVisible(false)}>
                <StyledText className="text-black font-bold">❌ Откажете</StyledText>
              </StyledPressable>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledModal>
    </StyledView>
  );
};

export default GoalsScreen;
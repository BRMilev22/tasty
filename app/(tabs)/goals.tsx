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
  ImageBackground,
} from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);
const StyledImageBackground = styled(ImageBackground);

const GoalsScreen = () => {
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);

  // Function to add a new goal
  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      setNewGoal(''); // Clear input after adding
    }
  };

  // Function to delete a goal
  const deleteGoal = (index: number) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: () => {
          setGoals((prevGoals) => prevGoals.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  // Function to edit a goal
  const editGoal = () => {
    if (selectedGoalIndex !== null && newGoal.trim()) {
      const updatedGoals = [...goals];
      updatedGoals[selectedGoalIndex] = newGoal;
      setGoals(updatedGoals);
      setModalVisible(false);
      setNewGoal(''); // Clear input after editing
      setSelectedGoalIndex(null);
    }
  };

  // Render each goal
  const renderGoal = ({ item, index }: { item: string; index: number }) => (
    <StyledView className="bg-white p-5 rounded-lg mb-4 shadow-lg">
      <StyledText className="text-lg font-bold">{item}</StyledText>
      <StyledView className="flex-row justify-between mt-3">
        <StyledTouchableOpacity
          className="bg-blue-500 p-2 rounded-lg"
          onPress={() => {
            setNewGoal(item);
            setSelectedGoalIndex(index);
            setModalVisible(true);
          }}
        >
          <StyledText className="text-white">Edit</StyledText>
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          className="bg-red-500 p-2 rounded-lg"
          onPress={() => deleteGoal(index)}
        >
          <StyledText className="text-white">Delete</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );

  return (
    <StyledImageBackground
      source={{
        uri: 'https://img.freepik.com/free-vector/gradient-particle-wave-background_23-2150517309.jpg',
      }}
      className="flex-1 justify-center items-center bg-[#141e30]"
      blurRadius={20}
    >
      {/* Main content container */}
      <StyledView className="flex-1 justify-center items-center p-5">
        {/* Title and input section, vertically centered */}
        <StyledView className="flex justify-center items-center mb-5">
          <StyledText className="text-2xl font-bold text-center text-blue-500 mb-5">
            Your Goals
          </StyledText>
  
          <StyledView className="flex-row items-center mb-5">
            <StyledTextInput
              className="flex-1 border border-gray-300 rounded-lg p-3 mr-3"
              placeholder="Add a new goal"
              value={newGoal}
              onChangeText={setNewGoal}
            />
            <StyledTouchableOpacity
              className="bg-blue-500 p-3 rounded-lg items-center"
              onPress={addGoal}
            >
              <StyledText className="text-white font-bold">Add</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
  
        {/* List of goals */}
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            justifyContent: 'flex-start', // Align the list to start below the input fields
          }}
        />
  
        {/* Modal for editing goals */}
        <StyledModal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <StyledView className="flex-1 justify-center items-center bg-black/50">
            <StyledView className="bg-white p-6 rounded-lg w-4/5">
              <StyledText className="text-2xl font-bold mb-4">Edit Goal</StyledText>
              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Update your goal"
                value={newGoal}
                onChangeText={setNewGoal}
              />
              <StyledView className="flex-row justify-between">
                <StyledPressable
                  className="bg-blue-500 p-3 rounded-lg flex-1 mr-2 items-center"
                  onPress={editGoal}
                >
                  <StyledText className="text-white font-bold">Save</StyledText>
                </StyledPressable>
                <StyledPressable
                  className="bg-red-500 p-3 rounded-lg flex-1 ml-2 items-center"
                  onPress={() => setModalVisible(false)}
                >
                  <StyledText className="text-white font-bold">Cancel</StyledText>
                </StyledPressable>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledModal>
      </StyledView>
    </StyledImageBackground>
  );  
};

export default GoalsScreen;
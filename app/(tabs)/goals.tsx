import React, { useState, useEffect } from 'react';
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
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { styled } from 'nativewind';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);

// Initialize Firebase
const auth = getAuth();
const db = getFirestore();

// Define goal interface
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  userId: string;
  fadeAnim: Animated.Value;
  category: 'weight' | 'nutrition' | 'exercise' | 'other';
  targetDate?: Date;
  progress: number; // 0-100
  notes?: string;
}

// Add category icons mapping
const categoryIcons = {
  weight: 'scale-outline',
  nutrition: 'nutrition-outline',
  exercise: 'fitness-outline',
  other: 'flag-outline'
} as const;

const GoalsScreen = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = auth.currentUser;
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [category, setCategory] = useState<Goal['category']>('other');
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');

  // Fetch goals from Firestore
  useEffect(() => {
    if (!user) return;

    const goalsRef = collection(db, 'users', user.uid, 'goals');
    const q = query(goalsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData: Goal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        goalsData.push({
          id: doc.id,
          text: data.text,
          completed: data.completed || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          userId: data.userId,
          fadeAnim: new Animated.Value(1),
          category: data.category || 'other',
          targetDate: data.targetDate?.toDate(),
          progress: data.progress || 0,
          notes: data.notes,
        });
      });
      setGoals(goalsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Function to add a new goal
  const addGoal = async () => {
    if (!user) return;
    if (newGoal.trim()) {
      try {
        setIsLoading(true);
        await addDoc(collection(db, 'users', user.uid, 'goals'), {
          text: newGoal,
          completed: false,
          createdAt: new Date(),
          userId: user.uid,
          category: 'other',
          progress: 0,
        });
        setNewGoal('');
        setIsLoading(false);
      } catch (error) {
        console.error('Error adding goal:', error);
        Alert.alert('Грешка', 'Възникна проблем при добавянето на целта.');
        setIsLoading(false);
      }
    }
  };

  // Function to delete a goal
  const deleteGoal = (goal: Goal) => {
    if (!user) return;
    
    Alert.alert('Изтриване', 'Сигурни ли сте, че искате да изтриете тази цел?', [
      { text: 'Откажете', style: 'cancel' },
      {
        text: 'Изтрийте',
        onPress: async () => {
          try {
            Animated.timing(goal.fadeAnim, { 
              toValue: 0, 
              duration: 300, 
              useNativeDriver: true 
            }).start(async () => {
              await deleteDoc(doc(db, 'users', user.uid, 'goals', goal.id));
            });
          } catch (error) {
            console.error('Error deleting goal:', error);
            Alert.alert('Грешка', 'Възникна проблем при изтриването на целта.');
          }
        },
      },
    ]);
  };

  // Function to toggle goal completion
  const toggleGoalCompletion = async (goal: Goal) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
        completed: !goal.completed
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Грешка', 'Възникна проблем при обновяването на целта.');
    }
  };

  // Function to edit a goal
  const editGoal = async () => {
    if (!user || selectedGoalIndex === null || !newGoal.trim()) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', goals[selectedGoalIndex].id), {
        text: newGoal
      });
      setModalVisible(false);
      setNewGoal('');
      setSelectedGoalIndex(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Грешка', 'Възникна проблем при обновяването на целта.');
    }
  };

  const renderGoal = ({ item, index }: { item: Goal; index: number }) => (
    <Animated.View style={{ opacity: item.fadeAnim }}>
      <StyledView style={[styles.goalCard, item.completed && styles.completedGoalCard]}>
        {/* Category Icon */}
        <StyledView style={styles.categoryIcon}>
          <Ionicons 
            name={categoryIcons[item.category]} 
            size={24} 
            color="#FFFFFF" 
          />
        </StyledView>

        <StyledView style={styles.goalContent}>
          {/* Goal Text and Progress */}
          <StyledView style={styles.goalHeader}>
            <StyledText style={[styles.goalText, item.completed && styles.completedGoalText]}>
              {item.text}
            </StyledText>
            <StyledText style={styles.progressText}>
              {item.progress}%
            </StyledText>
          </StyledView>

          {/* Progress Bar */}
          <StyledView style={styles.progressBarContainer}>
            <StyledView 
              style={[
                styles.progressBar, 
                { width: `${item.progress}%` }
              ]} 
            />
          </StyledView>

          {/* Target Date if exists */}
          {item.targetDate && (
            <StyledText style={styles.dateText}>
              Due: {item.targetDate.toLocaleDateString()}
            </StyledText>
          )}
        </StyledView>

        {/* Actions */}
        <StyledView style={styles.actionsContainer}>
          <StyledTouchableOpacity 
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
          </StyledTouchableOpacity>
          
          <StyledTouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteGoal(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </Animated.View>
  );

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setNewGoal(goal.text);
    setCategory(goal.category);
    setProgress(goal.progress);
    setNotes(goal.notes || '');
    setTargetDate(goal.targetDate);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewGoal('');
    setCategory('other');
    setTargetDate(undefined);
    setProgress(0);
    setNotes('');
    setSelectedGoal(null);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const goalData = {
        text: newGoal,
        category: category,
        progress: progress,
        notes: notes?.trim() || null,
        // Only add these fields for new goals
        ...(selectedGoal ? {} : {
          completed: false,
          createdAt: new Date(),
          userId: user.uid,
        })
      };

      if (targetDate) {
        goalData.targetDate = targetDate;
      }

      if (selectedGoal) {
        // Update existing goal
        await updateDoc(doc(db, 'users', user.uid, 'goals', selectedGoal.id), goalData);
      } else {
        // Create new goal
        await addDoc(collection(db, 'users', user.uid, 'goals'), goalData);
      }
      
      // Reset form
      setNewGoal('');
      setCategory('other');
      setTargetDate(undefined);
      setProgress(0);
      setNotes('');
      setSelectedGoal(null);
      setModalVisible(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Грешка', 'Възникна проблем при запазването на целта.');
      setIsLoading(false);
    }
  };

  return (
    <StyledView style={styles.container}>
      <StyledView style={styles.header}>
        <StyledText style={styles.headerTitle}>Вашите цели</StyledText>
        <StyledText style={styles.headerSubtitle}>
          Поставете си цели и следете напредъка си
        </StyledText>
      </StyledView>

      {/* Goal Input Field with Icon */}
      <StyledView style={styles.inputContainer}>
        <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
        <StyledTextInput
          style={styles.input}
          placeholder="Добавете нова цел"
          placeholderTextColor="#a0a0a0"
          value={newGoal}
          onChangeText={setNewGoal}
        />
        <StyledTouchableOpacity 
          style={styles.addButton}
          onPress={addGoal}
        >
          <Ionicons name="add" size={24} color="white" />
        </StyledTouchableOpacity>
      </StyledView>

      {isLoading ? (
        <StyledView style={styles.loadingContainer}>
          <StyledText style={styles.loadingText}>Зареждане...</StyledText>
        </StyledView>
      ) : goals.length === 0 ? (
        <StyledView style={styles.emptyContainer}>
          <Ionicons name="flag" size={60} color="#333333" />
          <StyledText style={styles.emptyText}>Няма добавени цели</StyledText>
          <StyledText style={styles.emptySubtext}>
            Добавете нова цел, за да започнете да следите напредъка си
          </StyledText>
        </StyledView>
      ) : (
        <StyledFlatList 
          data={goals} 
          renderItem={renderGoal} 
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.goalsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Edit Goal Modal */}
      <StyledModal animationType="slide" transparent={true} visible={isModalVisible}>
        <StyledView style={styles.modalOverlay}>
          <StyledView style={styles.modalContainer}>
            <StyledText style={styles.modalTitle}>
              {selectedGoal ? 'Edit Goal' : 'New Goal'}
            </StyledText>
            
            {/* Category Selector */}
            <StyledView style={styles.categorySelector}>
              {Object.entries(categoryIcons).map(([cat, icon]) => (
                <StyledTouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.selectedCategory
                  ]}
                  onPress={() => setCategory(cat as Goal['category'])}
                >
                  <Ionicons name={icon} size={24} color="#FFFFFF" />
                </StyledTouchableOpacity>
              ))}
            </StyledView>

            {/* Goal Text Input */}
            <StyledTextInput
              style={styles.modalInput}
              value={newGoal}
              onChangeText={setNewGoal}
              placeholder="Enter your goal"
              placeholderTextColor="#AAAAAA"
            />

            {/* Progress Slider */}
            <StyledView style={styles.progressInput}>
              <StyledText style={styles.inputLabel}>Progress</StyledText>
              <Slider
                value={progress}
                onValueChange={setProgress}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#AAAAAA"
              />
              <StyledText style={styles.progressValue}>{progress}%</StyledText>
            </StyledView>

            {/* Buttons */}
            <StyledView style={styles.modalButtonsContainer}>
              <StyledTouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={closeModal}
              >
                <StyledText style={styles.modalButtonText}>Cancel</StyledText>
              </StyledTouchableOpacity>
              
              <StyledTouchableOpacity 
                style={[styles.modalButton, styles.modalSaveButton]} 
                onPress={handleSaveGoal}
              >
                <StyledText style={styles.modalButtonText}>Save</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledModal>
    </StyledView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  header: {
    marginTop: 50,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    padding: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  goalsList: {
    paddingBottom: 100,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  completedGoalCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  checkboxContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
  },
  completedCheckbox: {
    backgroundColor: '#4CAF50',
  },
  emptyCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  goalText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  completedGoalText: {
    textDecorationLine: 'line-through',
    color: '#AAAAAA',
  },
  actionButton: {
    backgroundColor: 'rgba(60, 60, 60, 0.6)',
    borderRadius: 12,
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#AAAAAA',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  modalInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  progressInput: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
  },
  modalCancelButton: {
    backgroundColor: 'rgba(60, 60, 60, 0.6)',
    marginRight: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSaveButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    marginLeft: 8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  dateText: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginLeft: 12,
  },
});

export default GoalsScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Modal, TextInput, TouchableOpacity, Pressable, Alert, ImageBackground } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';

const auth = getAuth();

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);
const StyledImageBackground = styled(ImageBackground);

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState<InventoryItem>({ id: '', name: '', quantity: 0, unit: '' });
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const inventoryCollection = collection(db, 'users', user.uid, 'inventory');
      const unsubscribe = onSnapshot(inventoryCollection, (snapshot) => {
        const items: InventoryItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as InventoryItem[];
        setInventoryItems(items);
      });

      return () => unsubscribe();
    } else {
      Alert.alert('Error', 'User is not logged in.');
    }
  }, [user]);

  const addNewItem = async () => {
    if (newItem.name.trim() && newItem.quantity > 0 && newItem.unit.trim()) {
      try {
        await addDoc(collection(db, 'users', user!.uid, 'inventory'), {
          name: newItem.name,
          quantity: newItem.quantity,
          unit: newItem.unit,
        });

        setNewItem({ id: '', name: '', quantity: 0, unit: '' });
        setModalVisible(false);
      } catch (error) {
        console.error('Error adding item: ', error);
        Alert.alert('Error', 'Failed to add item.');
      }
    } else {
      Alert.alert('Please fill in all fields correctly!');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user!.uid, 'inventory', id));
    } catch (error) {
      console.error('Error deleting item: ', error);
      Alert.alert('Error', 'Failed to delete item.');
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <StyledView className="bg-white p-5 rounded-lg mb-4 shadow-lg">
      <StyledText className="text-lg font-bold">{item.name}</StyledText>
      <StyledText className="text-gray-400">Quantity: {item.quantity} {item.unit}</StyledText>
      <StyledView className="flex-row justify-between mt-3">
        <StyledTouchableOpacity
          className="bg-blue-500 p-2 rounded-lg"
          onPress={() => {
            setNewItem(item);
            setModalVisible(true);
          }}
        >
          <StyledText className="text-white">Edit</StyledText>
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          className="bg-red-500 p-2 rounded-lg"
          onPress={() => deleteItem(item.id)}
        >
          <StyledText className="text-white">Delete</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );

  return (
    <StyledImageBackground
      source={{ uri: 'https://img.freepik.com/free-vector/gradient-particle-wave-background_23-2150517309.jpg' }}
      className="flex-1 justify-center items-center bg-[#141e30]"
      blurRadius={20}
    >
      <StyledView className="flex-1 justify-center items-center p-5">
        <StyledText className="text-2xl font-bold text-center text-blue-500 mb-5">Your Inventory</StyledText>

        <StyledTouchableOpacity
          className="bg-blue-500 p-4 rounded-lg mt-5"
          onPress={() => setModalVisible(true)}
        >
          <StyledText className="text-white text-center">Add New Item</StyledText>
        </StyledTouchableOpacity>

        {/* Modal for adding/editing items */}
        <StyledModal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <StyledView className="flex-1 justify-center items-center bg-black/50">
            <StyledView className="bg-white p-6 rounded-lg w-4/5">
              <StyledText className="text-xl font-bold mb-4">Add/Edit Item</StyledText>

              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Item Name"
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Quantity"
                keyboardType="numeric"
                value={newItem.quantity ? newItem.quantity.toString() : ''}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: Number(text) })}
              />
              <StyledTextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Unit"
                value={newItem.unit}
                onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
              />

              <StyledView className="flex-row justify-between">
                <StyledPressable
                  className="bg-blue-500 p-3 rounded-lg flex-1 mr-2"
                  onPress={addNewItem}
                >
                  <StyledText className="text-white text-center">Save</StyledText>
                </StyledPressable>

                <StyledPressable
                  className="bg-red-500 p-3 rounded-lg flex-1 ml-2"
                  onPress={() => {
                    setNewItem({ id: '', name: '', quantity: 0, unit: '' });
                    setModalVisible(false);
                  }}
                >
                  <StyledText className="text-white text-center">Cancel</StyledText>
                </StyledPressable>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledModal>
      </StyledView>
    </StyledImageBackground>
  );
};

export default InventoryScreen;
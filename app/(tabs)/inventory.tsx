import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, Modal, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, addDoc } from 'firebase/firestore';
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
const StyledImageBackground = styled(ImageBackground);

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
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

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user!.uid, 'inventory', id));
    } catch (error) {
      console.error('Error deleting item: ', error);
      Alert.alert('Error', 'Failed to delete item.');
    }
  };

  const addItem = async () => {
    if (!itemName || !itemQuantity || !itemUnit) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const newItem = {
        name: itemName,
        quantity: parseInt(itemQuantity),
        unit: itemUnit,
      };

      await addDoc(collection(db, 'users', user!.uid, 'inventory'), newItem);
      setItemName('');
      setItemQuantity('');
      setItemUnit('');
      setIsModalVisible(false); // Close the modal after adding the item
    } catch (error) {
      console.error('Error adding item: ', error);
      Alert.alert('Error', 'Failed to add item.');
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <StyledView className="bg-white p-4 rounded-lg mb-4 shadow-lg">
      <StyledText className="text-lg font-bold text-left">{item.name}</StyledText>
      <StyledText className="text-gray-400 text-left">Quantity: {item.quantity} {item.unit}</StyledText>
      <StyledView className="flex-row justify-start mt-3">
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
      source={{ uri: 'https://static.vecteezy.com/system/resources/previews/020/580/331/non_2x/abstract-smooth-blur-blue-color-gradient-mesh-texture-lighting-effect-background-with-blank-space-for-website-banner-and-paper-card-decorative-modern-graphic-design-vector.jpg' }}
      className="flex-1 bg-[#141e30]"
      blurRadius={20}
    >
      <StyledView className="flex-1 p-5 top-10">
        {/* Add Item Button */}
        <StyledTouchableOpacity
          className="bg-blue-500 p-3 rounded-lg mb-5"
          onPress={() => setIsModalVisible(true)}
        >
          <StyledText className="text-white text-center text-lg">Add New Item</StyledText>
        </StyledTouchableOpacity>

        {/* Inventory List */}
        <StyledText className="text-2xl font-bold text-blue-500 mb-5">Your Inventory</StyledText>
        <StyledFlatList
          data={inventoryItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />

        {/* Add Item Modal */}
        <StyledModal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <StyledView className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <StyledView className="bg-white p-6 rounded-lg w-80">
              <StyledText className="text-lg font-bold text-center mb-4">Add New Item</StyledText>
              
              <StyledTextInput
                value={itemName}
                onChangeText={setItemName}
                placeholder="Item Name"
                className="bg-gray-200 p-2 mb-3 rounded"
              />
              
              <StyledTextInput
                value={itemQuantity}
                onChangeText={setItemQuantity}
                placeholder="Quantity"
                keyboardType="numeric"
                className="bg-gray-200 p-2 mb-3 rounded"
              />
              
              <StyledTextInput
                value={itemUnit}
                onChangeText={setItemUnit}
                placeholder="Unit"
                className="bg-gray-200 p-2 mb-3 rounded"
              />
              
              <StyledView className="flex-row justify-between">
                <StyledTouchableOpacity
                  className="bg-gray-400 p-2 rounded-lg"
                  onPress={() => setIsModalVisible(false)}
                >
                  <StyledText className="text-white">Cancel</StyledText>
                </StyledTouchableOpacity>
                <StyledTouchableOpacity
                  className="bg-green-500 p-2 rounded-lg"
                  onPress={addItem}
                >
                  <StyledText className="text-white">Add</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledModal>
      </StyledView>
    </StyledImageBackground>
  );
};

export default InventoryScreen;

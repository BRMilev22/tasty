import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';
import Ionicons from 'react-native-vector-icons/Ionicons';

const auth = getAuth();

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledModal = styled(Modal);
const StyledTextInput = styled(TextInput);

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  nutriments: {
    energy: number;
    fat: number;
    carbohydrates: number;
    proteins: number;
  };
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
          name: doc.data().name,
          quantity: doc.data().quantity,
          unit: doc.data().unit,
          nutriments: doc.data().nutriments,
        }));
        setInventoryItems(items);
      });

      return () => unsubscribe();
    } else {
      Alert.alert('Грешка', 'Потребителят не е вписан.');
    }
  }, [user]);

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user!.uid, 'inventory', id));
    } catch (error) {
      console.error('Error deleting item: ', error);
      Alert.alert('Грешка', 'Артикулът не бе изтрит.');
    }
  };

  const addItem = async () => {
    if (!itemName || !itemQuantity || !itemUnit) {
      Alert.alert('Грешка', 'Моля, попълнете всички полета.');
      return;
    }

    try {
      const newItem = {
        name: itemName,
        quantity: parseInt(itemQuantity),
        unit: itemUnit,
        nutriments: { energy: 0, fat: 0, carbohydrates: 0, proteins: 0 },
      };

      await addDoc(collection(db, 'users', user!.uid, 'inventory'), newItem);
      setItemName('');
      setItemQuantity('');
      setItemUnit('');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Грешка', 'Артикулът не бе добавен.');
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <StyledView className="bg-black p-4 rounded-lg mb-4 border border-green-500 flex-row items-center">
      <Text className="text-lg">📦</Text>
      <StyledText className="text-lg font-bold text-white flex-1 ml-3">{item.name}</StyledText>
      <StyledText className="text-gray-400">{item.quantity} {item.unit}</StyledText>
      <StyledTouchableOpacity 
        className="bg-transparent p-2 rounded-lg border border-red-500 ml-2" 
        onPress={() => deleteItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </StyledTouchableOpacity>
    </StyledView>
  );

  return (
    <StyledView className="flex-1 bg-black p-5">
      <StyledText className="text-2xl font-bold text-white text-center mt-10 mb-5">Вашият инвентар</StyledText>

      {/* Add Item Button */}
      <StyledTouchableOpacity 
        className="bg-[#1A1A1A] p-3 rounded-lg mb-5 border border-green-500" 
        onPress={() => setIsModalVisible(true)}
      >
        <StyledText className="text-white text-center text-lg">➕ Добавете нов артикул</StyledText>
      </StyledTouchableOpacity>

      {/* Inventory List */}
      <StyledFlatList data={inventoryItems} renderItem={renderItem} keyExtractor={(item) => item.id} />

      {/* Add Item Modal */}
      <StyledModal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <StyledView className="flex-1 justify-center items-center bg-black/80">
          <StyledView className="bg-black p-6 rounded-lg w-80 border border-green-500">
            <StyledText className="text-lg font-bold text-white text-center mb-4">📋 Добавете нов артикул</StyledText>

            {/* Input Fields with Icons */}
            <StyledView className="flex-row items-center border border-green-500 p-3 rounded-lg mb-3">
              <Ionicons name="cube-outline" size={24} color="white" />
              <StyledTextInput className="flex-1 text-white ml-3 text-lg p-2" value={itemName} onChangeText={setItemName} placeholder="Име на артикула" placeholderTextColor="#B0B0B0" />
            </StyledView>

            <StyledView className="flex-row items-center border border-green-500 p-3 rounded-lg mb-3">
              <Ionicons name="list-outline" size={24} color="white" />
              <StyledTextInput className="flex-1 text-white ml-3 text-lg p-2" value={itemQuantity} onChangeText={setItemQuantity} placeholder="Количество" keyboardType="numeric" placeholderTextColor="#B0B0B0" />
            </StyledView>

            <StyledView className="flex-row items-center border border-green-500 p-3 rounded-lg mb-3">
              <Ionicons name="speedometer-outline" size={24} color="white" />
              <StyledTextInput className="flex-1 text-white ml-3 text-lg p-2" value={itemUnit} onChangeText={setItemUnit} placeholder="Единица (бр, L)" placeholderTextColor="#B0B0B0" />
            </StyledView>

            {/* Modal Buttons */}
            <StyledView className="flex-row justify-between">
              <StyledTouchableOpacity className="bg-white p-3 rounded-lg border border-green-500" onPress={() => setIsModalVisible(false)}>
                <StyledText className="text-black">❌ Откажете</StyledText>
              </StyledTouchableOpacity>
              <StyledTouchableOpacity className="bg-white p-3 rounded-lg border border-green-500" onPress={addItem}>
                <StyledText className="text-black">✅ Добавете</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledModal>
    </StyledView>
  );
};

export default InventoryScreen;
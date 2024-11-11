import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ImageBackground, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';

const auth = getAuth();

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledFlatList = styled(FlatList);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImageBackground = styled(ImageBackground);

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
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

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <StyledView className="bg-white p-5 rounded-lg mb-4 shadow-lg">
      <StyledText className="text-lg font-bold">{item.name}</StyledText>
      <StyledText className="text-gray-400">Quantity: {item.quantity} {item.unit}</StyledText>
      <StyledView className="flex-row justify-between mt-3">
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
        <StyledText className="text-2xl font-bold text-center text-blue-500 mb-5">Your Inventory</StyledText>
        <StyledFlatList
          data={inventoryItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      </StyledView>
    </StyledImageBackground>
  );
};

export default InventoryScreen;

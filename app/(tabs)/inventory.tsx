import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: '1', name: 'Chicken Breast', quantity: 2, unit: 'kg' },
    { id: '2', name: 'Broccoli', quantity: 1, unit: 'kg' },
    { id: '3', name: 'Rice', quantity: 5, unit: 'kg' },
    { id: '4', name: 'Eggs', quantity: 12, unit: 'pcs' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState<InventoryItem>({
    id: '',
    name: '',
    quantity: 0,
    unit: '',
  });

  // Function to add new item to inventory
  const addNewItem = () => {
    if (newItem.name.trim() && newItem.quantity > 0 && newItem.unit.trim()) {
      const itemId = (inventoryItems.length + 1).toString();
      setInventoryItems((prevItems) => [
        ...prevItems,
        { ...newItem, id: itemId },
      ]);
      setNewItem({ id: '', name: '', quantity: 0, unit: '' });
      setModalVisible(false);
    } else {
      Alert.alert('Please fill in all fields correctly!');
    }
  };

  // Render each item in the inventory
  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>
        Quantity: {item.quantity} {item.unit}
      </Text>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setNewItem(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const deleteItem = (id: string) => {
    setInventoryItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Inventory</Text>
      <FlatList
        data={inventoryItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Add New Item</Text>
      </TouchableOpacity>

      {/* Modal for adding/editing items */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Add/Edit Item</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item Name"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Quantity"
              keyboardType="numeric"
              value={newItem.quantity ? newItem.quantity.toString() : ''}
              onChangeText={(text) =>
                setNewItem({ ...newItem, quantity: Number(text) })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Unit"
              value={newItem.unit}
              onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
            />
            <View style={styles.modalButtonContainer}>
              <Pressable style={[styles.modalButton, styles.saveButton]} onPress={addNewItem}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewItem({ id: '', name: '', quantity: 0, unit: '' });
                  setModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e90ff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemDetails: {
    fontSize: 16,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1e90ff',
  },
  cancelButton: {
    backgroundColor: '#ff4c4c',
  },
});

export default InventoryScreen;
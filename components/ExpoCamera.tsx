import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ScrollView } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore import
import { db } from '../firebaseConfig'; // Your Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth import

const ExpoCamera = () => {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<any | null>(null); // Store product data

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    setScanned(true);
    setScannedData(data);
    try {
      // Fetch product data from Open Food Facts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const productData = await response.json();

      // Check if product exists
      if (productData.product) {
        setProductInfo(productData.product); // Save the product data for display
      } else {
        Alert.alert('Грешка', 'Продуктът не е намерен.');
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      Alert.alert('Грешка', 'Неуспешно извличане на данни за продукта.');
    }
  };

  // Function to add the product to Firestore inventory collection
  const addToInventory = async (barcode: string, userId: string, productName: string) => {
    const itemQuantity = 1; // Default quantity
    const itemUnit = 'бр'; // Default unit

    try {
      await setDoc(
        doc(db, 'users', userId, 'inventory', barcode), // Adding to specific user inventory
        {
          name: productName,
          quantity: itemQuantity,
          unit: itemUnit,
          barcode: barcode,
          createdAt: new Date(),
        },
        { merge: true } // Merge the document if it already exists
      );
      Alert.alert('Успешно добавяне', 'Продуктът е добавен в инвентара.');
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Грешка', 'Неуспешно добавяне на продукта.');
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && productInfo && (
        <View style={styles.resultContainer}>
          <ScrollView>
            <Text style={styles.resultText}>Продукт: {productInfo.product_name || 'Непознат продукт'}</Text>
            <Text style={styles.resultText}>Калории: {productInfo.nutriments?.energy_kcal || 'Няма данни'}</Text>
            <Text style={styles.resultText}>Протеини: {productInfo.nutriments?.proteins || 'Няма данни'}</Text>
            <Text style={styles.resultText}>Въглехидрати: {productInfo.nutriments?.carbohydrates || 'Няма данни'}</Text>
            <Text style={styles.resultText}>Мазнини: {productInfo.nutriments?.fat || 'Няма данни'}</Text>

            <Button
              title={'Добавяне в инвентара'}
              onPress={() => addToInventory(scannedData!, user!.uid, productInfo.product_name)}
            />
            <Button title={'Сканирай отново'} onPress={() => setScanned(false)} />
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContainer: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ExpoCamera;
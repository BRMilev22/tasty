import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const ExpoCamera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string | null>(null); // Store product title

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
      // Fetch product title from the barcode URL
      const titleResponse = await fetch(`https://barcode.bg/barcode/BG/%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%B1%D0%B0%D1%80%D0%BA%D0%BE%D0%B4.htm?barcode=${data}`);
      const htmlContent = await titleResponse.text();

      // Extract title from the HTML content
      const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        setProductTitle(titleMatch[1]);
      } else {
        setProductTitle('No title found');
      }

    } catch (error) {
      console.error('Error fetching product data:', error);
      Alert.alert('Error', 'Failed to retrieve product data.');
    }
  };

  const addToInventory = async (barcode: string) => {
    const itemDocRef = doc(db, 'users', user!.uid, 'inventory', barcode);
  
    try {
      const itemDoc = await getDoc(itemDocRef);
      const currentQuantity = itemDoc.exists() ? itemDoc.data().quantity || 0 : 0;
  
      // Remove the barcode part from the product name using regex
      const cleanedProductName = productTitle ? productTitle.replace(/ - Баркод: \d+$/, '') : 'Unknown Product';
  
      await setDoc(
        itemDocRef,
        {
          name: cleanedProductName, // Use the cleaned product name
          quantity: currentQuantity + 1,
          unit: 'pcs',
          barcode,
          createdAt: itemDoc.exists() ? itemDoc.data().createdAt : new Date(),
        },
        { merge: true }
      );
  
      Alert.alert('Success', 'Product added to inventory.');
      setScannedData(null); // Clear the barcode input field
      setProductTitle(null); // Clear the title
      setScanned(false); // Reset scanning state
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Failed to add product to inventory.');
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
      <Text style={styles.title}>Scan Barcode</Text>
      <Text style={styles.instructions}>Hold your device over a barcode to scan it.</Text>

      <View style={styles.barcodeScannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.barcodeScanner}
        />
      </View>

      <TextInput
        style={styles.barcodeInput}
        value={scannedData || ''}
        editable={false}
        placeholder="Scanned Barcode"
      />

      {productTitle && (
        <View style={styles.productInfoContainer}>
          <ScrollView>
            <Text style={styles.productInfoText}>Title: {productTitle || 'No title available'}</Text>
          </ScrollView>
          <TouchableOpacity onPress={() => addToInventory(scannedData!)} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add to Inventory</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => setScanned(false)} style={styles.scanButton}>
        <Text style={styles.scanButtonText}>{scanned ? 'Scan Again' : 'Scan'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  barcodeScannerContainer: {
    width: '80%',
    height: '40%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  barcodeScanner: {
    width: '100%',
    height: '100%',
  },
  barcodeInput: {
    width: '80%',
    padding: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  productInfoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    marginBottom: 20,
  },
  productInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExpoCamera;

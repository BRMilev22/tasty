import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Make sure you import your Firebase config
import { getAuth } from 'firebase/auth';

const ExpoCamera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Request camera permissions when the component mounts
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Function to handle barcode scanning
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setBarcode(data);

    try {
      // Fetch product information from your API based on the scanned barcode
      const titleResponse = await fetch(
        `https://barcode.bg/barcode/BG/%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%B1%D0%B0%D1%80%D0%BA%D0%BE%D0%B4.htm?barcode=${data}`
      );
      const htmlContent = await titleResponse.text();
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

  const handleAddToInventory = async () => {
    if (user && barcode && productTitle) {
      const itemDocRef = doc(db, 'users', user.uid, 'inventory', barcode);

      // Get the current item details (if any)
      const itemDoc = await getDoc(itemDocRef);
      const currentQuantity = itemDoc.exists() ? itemDoc.data().quantity || 0 : 0;

      const cleanedProductName = productTitle.replace(/ - Баркод: \d+$/, '') || 'Unknown Product';

      // Add or update the product in Firestore
      await setDoc(
        itemDocRef,
        {
          name: cleanedProductName,
          quantity: currentQuantity + 1,
          unit: 'pcs',
          barcode: barcode,
          createdAt: itemDoc.exists() ? itemDoc.data().createdAt : new Date(),
        },
        { merge: true }
      );

      Alert.alert('Success', 'Product added to inventory.');
      setIsConfirming(false); // Reset confirming state
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setBarcode(null);
    setProductTitle(null);
    setIsConfirming(false);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          {scanned && barcode ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>Scanned Code: {barcode}</Text>
              <Text style={styles.resultText}>Product: {productTitle || 'No title available'}</Text>
              <Text style={styles.confirmText}>Do you want to add this item to your inventory?</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleAddToInventory} style={styles.button}>
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleScanAgain} style={styles.button}>
                  <Text style={styles.buttonText}>No, Scan Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.instructions}>Scan a barcode to get started</Text>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    position: 'relative', // Ensures the camera is behind other elements
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adds transparency for better visibility of the buttons
    position: 'absolute', // Positioned on top of the camera
    width: '100%',
    height: '100%',
    zIndex: 2, // Ensures overlay is on top of the camera
  },
  resultContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
    zIndex: 3, // Ensures the result container is above the overlay
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    width: '45%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  confirmButton: {
    fontSize: 16,
    color: 'blue',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  instructions: {
    color: 'white',
    fontSize: 18,
  },
});

export default ExpoCamera;

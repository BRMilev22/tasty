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
  const [nutritionalInfo, setNutritionalInfo] = useState<any>(null); // To store nutritional info
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
      // First try to get product information from Open Food Facts API
      const openFoodFactsResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const openFoodFactsData = await openFoodFactsResponse.json();

      if (openFoodFactsData.status === 1 && openFoodFactsData.product) {
        // If product is found, use the product name from the Open Food Facts API
        const productName = openFoodFactsData.product.product_name || 'Няма име на продукта';
        setProductTitle(productName);

        // Extracting nutritional information if available
        const productNutritionalInfo = {
          energy: openFoodFactsData.product.nutriments?.['energy-kcal'] || 'Не е налично',
          fat: openFoodFactsData.product.nutriments?.fat || 'Не е налично',
          //fatValue: openFoodFactsData.product.nutriments?.fat_value || 'Не е налично',
          carbohydrates: openFoodFactsData.product.nutriments?.carbohydrates || 'Не е налично',
          proteins: openFoodFactsData.product.nutriments?.proteins || 'Не е налично',
          //proteinsValue: openFoodFactsData.product.nutriments?.proteins_value || 'Не е налично',
        };
        setNutritionalInfo(productNutritionalInfo); // Store the nutritional information
      } else {
        // If not found, fall back to the current logic
        const titleResponse = await fetch(
          `https://barcode.bg/barcode/BG/%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%B1%D0%B0%D1%80%D0%BA%D0%BE%D0%B4.htm?barcode=${data}`
        );
        if (titleResponse.status === 404) {
          setProductTitle('Името на продукта не бе намерено');
          setNutritionalInfo(null); // Clear nutritional info if not found
        } else {
          const htmlContent = await titleResponse.text();
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            setProductTitle(titleMatch[1]);
            setNutritionalInfo(null); // No nutritional info available in fallback
          } else {
            setProductTitle('Името на продукта не бе намерено');
            setNutritionalInfo(null); // Clear nutritional info if not found
          }
        }
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      Alert.alert('Грешка', 'Данните за продукта не бяха извлечени.');
    }
  };

  const handleAddToInventory = async () => {
    if (user && barcode && productTitle) {
      const itemDocRef = doc(db, 'users', user.uid, 'inventory', barcode);
  
      // Get the current item details (if any)
      const itemDoc = await getDoc(itemDocRef);
      const currentQuantity = itemDoc.exists() ? itemDoc.data().quantity || 0 : 0;
  
      const cleanedProductName = productTitle.replace(/ - Баркод: \d+$/, '') || 'Непознат продукт';
  
      // Add or update the product in Firestore, including nutritional info
      await setDoc(
        itemDocRef,
        {
          name: cleanedProductName,
          quantity: currentQuantity + 1,
          unit: 'бр',
          barcode: barcode,
          createdAt: itemDoc.exists() ? itemDoc.data().createdAt : new Date(),
          nutriments: nutritionalInfo || {}, // Save nutritional info
        },
        { merge: true } // Merge data, so we don't overwrite other fields
      );
  
      Alert.alert('Добавянето бе успешно', 'Продуктът бе добавен в инвентара.');
      setIsConfirming(false); // Reset confirming state
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setBarcode(null);
    setProductTitle(null);
    setNutritionalInfo(null); // Clear nutritional info on rescan
    setIsConfirming(false);
  };

  if (hasPermission === null) {
    return <Text>Искане за позволение за използване на камерата...</Text>;
  }

  if (hasPermission === false) {
    return <Text>Липса на достъп до камерата</Text>;
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
              <Text style={styles.resultText}>Сканиран баркод: {barcode}</Text>
              <Text style={styles.resultText}>Продукт: {productTitle || 'Непознато име'}</Text>
              {nutritionalInfo && (
                <View>
                  <Text style={styles.nutritionalText}>Енергийност: {nutritionalInfo.energy} kcal</Text>
                  <Text style={styles.nutritionalText}>
                    Мазнини: {nutritionalInfo.fat} {nutritionalInfo.fatValue && nutritionalInfo.fat !== nutritionalInfo.fatValue ? `(${nutritionalInfo.fatValue})` : ''}
                  </Text>
                  <Text style={styles.nutritionalText}>Въглехидрати: {nutritionalInfo.carbohydrates}</Text>
                  <Text style={styles.nutritionalText}>
                    Протеини: {nutritionalInfo.proteins} {nutritionalInfo.proteinsValue && nutritionalInfo.proteins !== nutritionalInfo.proteinsValue ? `(${nutritionalInfo.proteinsValue})` : ''}
                  </Text>
                </View>
              )}
              <Text style={styles.confirmText}>Искате ли да добавите този продукт в инвентара?</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleAddToInventory} style={styles.button}>
                  <Text style={styles.buttonText}>Да</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleScanAgain} style={styles.button}>
                  <Text style={styles.buttonText}>Не, сканирай отново</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.instructions}>Сканирайте баркод, за да започнете</Text>
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
  nutritionalText: {
    fontSize: 16,
    marginBottom: 5,
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
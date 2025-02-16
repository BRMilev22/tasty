import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { styled } from 'nativewind';
import Ionicons from 'react-native-vector-icons/Ionicons';

const auth = getAuth();
const user = auth.currentUser;

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

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
    <StyledView className="flex-1 bg-black items-center justify-center">
      <CameraView style={styles.camera} onBarcodeScanned={scanned ? undefined : handleBarcodeScanned} />

      {/* Product Details Container - Centered */}
      {scanned && barcode ? (
        <StyledView className="absolute bottom-36 bg-black p-5 rounded-lg border border-green-500 w-4/5 items-center">
          <StyledText className="text-lg font-bold text-white text-center mb-3">Сканиран продукт</StyledText>
          <StyledText className="text-gray-400 text-center">Баркод: {barcode}</StyledText>
          <StyledText className="text-green-400 text-center font-bold">{productTitle || 'Непознато име'}</StyledText>

          {nutritionalInfo && (
            <StyledView className="mt-3">
              <StyledText className="text-gray-300">🔥 Енергийност: {nutritionalInfo.energy} kcal</StyledText>
              <StyledText className="text-gray-300">🍔 Мазнини: {nutritionalInfo.fat} g</StyledText>
              <StyledText className="text-gray-300">🍞 Въглехидрати: {nutritionalInfo.carbohydrates} g</StyledText>
              <StyledText className="text-gray-300">🥩 Протеини: {nutritionalInfo.proteins} g</StyledText>
            </StyledView>
          )}

          <StyledView className="flex-row justify-between mt-4">
            <StyledTouchableOpacity onPress={handleAddToInventory} className="bg-white p-3 rounded-lg border border-green-500 flex-1 mr-2 items-center">
              <Ionicons name="checkmark-outline" size={24} color="green" />
              <StyledText className="text-black font-bold">Добави</StyledText>
            </StyledTouchableOpacity>
            <StyledTouchableOpacity onPress={handleScanAgain} className="bg-white p-3 rounded-lg border border-red-500 flex-1 ml-2 items-center">
              <Ionicons name="close-outline" size={24} color="red" />
              <StyledText className="text-red-500 font-bold">Откажи</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      ) : null}

      {/* "Scan Again" Button - Centered & Always Visible */}
      <StyledView className="absolute bottom-12 items-center">
      <StyledText className="text-white text-center text-lg mb-3">📸 Насочете камерата към баркода</StyledText>
        <StyledTouchableOpacity onPress={handleScanAgain} className="bg-white p-3 rounded-lg border border-green-500 flex-row items-center">
          <Ionicons name="camera-outline" size={24} color="black" />
          <StyledText className="text-black ml-2">Сканирай отново</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
});

export default ExpoCamera;
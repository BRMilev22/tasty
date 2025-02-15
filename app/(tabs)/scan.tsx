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
  const [nutritionalInfo, setNutritionalInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setBarcode(data);

    try {
      const openFoodFactsResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const openFoodFactsData = await openFoodFactsResponse.json();

      if (openFoodFactsData.status === 1 && openFoodFactsData.product) {
        const productName = openFoodFactsData.product.product_name || 'Няма име на продукта';
        setProductTitle(productName);

        const productNutritionalInfo = {
          energy: openFoodFactsData.product.nutriments?.['energy-kcal'] || 'Не е налично',
          fat: openFoodFactsData.product.nutriments?.fat || 'Не е налично',
          carbohydrates: openFoodFactsData.product.nutriments?.carbohydrates || 'Не е налично',
          proteins: openFoodFactsData.product.nutriments?.proteins || 'Не е налично',
        };
        setNutritionalInfo(productNutritionalInfo);
      } else {
        setProductTitle('Името на продукта не бе намерено');
        setNutritionalInfo(null);
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      Alert.alert('Грешка', 'Данните за продукта не бяха извлечени.');
    }
  };

  const handleAddToInventory = async () => {
    if (user && barcode && productTitle) {
      const itemDocRef = doc(db, 'users', user.uid, 'inventory', barcode);
      const itemDoc = await getDoc(itemDocRef);
      const currentQuantity = itemDoc.exists() ? itemDoc.data().quantity || 0 : 0;

      const cleanedProductName = productTitle.replace(/ - Баркод: \d+$/, '') || 'Непознат продукт';

      await setDoc(
        itemDocRef,
        {
          name: cleanedProductName,
          quantity: currentQuantity + 1,
          unit: 'бр',
          barcode: barcode,
          createdAt: itemDoc.exists() ? itemDoc.data().createdAt : new Date(),
          nutriments: nutritionalInfo || {},
        },
        { merge: true }
      );

      Alert.alert('Добавянето бе успешно', 'Продуктът бе добавен в инвентара.');
      setScanned(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setBarcode(null);
    setProductTitle(null);
    setNutritionalInfo(null);
  };

  if (hasPermission === null) {
    return <StyledText className="text-white text-center mt-10">Искане за достъп до камерата...</StyledText>;
  }

  if (hasPermission === false) {
    return <StyledText className="text-red-500 text-center mt-10">Липса на достъп до камерата</StyledText>;
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
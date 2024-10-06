// app/ExpoCamera.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { firebase, auth } from '../firebaseConfig'; // Import auth and firebase

const ExpoCamera = () => {
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
        setScanned(true);
        setScannedData(data);

        // Get the current user's ID
        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert('Грешка', 'Потребителят не е автентикиран.');
            return;
        }

        // Show alert to confirm adding the item to inventory
        Alert.alert(
            'Добавяне в инвентара',
            `Искате ли да добавите продукта с баркод ${data} в инвентара?`,
            [
                {
                    text: 'Не',
                    style: 'cancel',
                },
                {
                    text: 'Да',
                    onPress: async () => {
                        await addToInventory(data, userId); // Call the function to add item to inventory
                        // Navigate to ProductDetail with the barcode value after adding to inventory
                        router.push({
                            pathname: '/ProductDetail',
                            params: { barcode: data },
                        });
                    },
                },
            ],
        );
    };

    const addToInventory = async (barcode: string, userId: string) => {
        const itemName = `Продукт с баркод ${barcode}`; // Example name (you can replace this with actual product name if available)
        const itemQuantity = 1; // Default quantity
        const itemUnit = 'бр'; // Default unit (pieces)

        // Add to Firebase
        try {
            await firebase.firestore().collection('users').doc(userId).collection('inventory').add({
                name: itemName,
                quantity: itemQuantity,
                unit: itemUnit,
                barcode: barcode,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
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
            {scanned && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>Scanned Data: {scannedData}</Text>
                    <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
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
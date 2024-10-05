import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';

const BarcodeScanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);  // State to store camera permission status
  const [scannedData, setScannedData] = useState<string>('');  // State to store scanned data
  const [isScanning, setIsScanning] = useState<boolean>(true); // State to manage scanning on/off

  useEffect(() => {
    // Asynchronous function to request camera permission
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();  // Request permission for camera access
      setHasPermission(status === 'granted');  // Update state based on permission result
    })();
  }, []);  // Empty dependency array ensures this runs once when component mounts

  const handleBarCodeScanned = ({ type, data }: BarCodeScannerResult) => {
    setScannedData(`Type: ${type}\nData: ${data}`);  // Update the scanned data
    setIsScanning(false);  // Disable scanner after a successful scan
  };

  const handleScanAgain = () => {
    setScannedData('');  // Reset scanned data
    setIsScanning(true);  // Re-enable scanner
  };

  // Show this while permission is being requested
  if (hasPermission === null) {
    return <Text>Requesting for camera permission...</Text>;
  }

  // Handle when permission is denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Text>Please grant camera access from your device settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning ? (
        <BarCodeScanner
          onBarCodeScanned={scannedData ? undefined : handleBarCodeScanned}  // Disable scanning if data is already scanned
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={styles.scannedContainer}>
          <Text style={styles.scannedText}>{scannedData}</Text>
          <Button title="Scan Again" onPress={handleScanAgain} />  // Button to re-enable scanning
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
  scannedContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    fontSize: 18,
    color: '#000',
  },
});

export default BarcodeScanner;
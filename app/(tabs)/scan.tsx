import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import BarcodeScanner from '../../components/BarcodeScanner';

const Scan = () => {
  return (
    <SafeAreaView style={styles.container}>
      <BarcodeScanner />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Scan;
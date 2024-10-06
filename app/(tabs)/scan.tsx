import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import ExpoCamera from '../../components/ExpoCamera';

const Scan = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ExpoCamera />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Scan;
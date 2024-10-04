// goals.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const GoalsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Your Goals</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default GoalsScreen;
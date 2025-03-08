import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import Layout from './_layout';

/**
 * Main App component that wraps the entire application
 */
export default function App() {
  return (
    <NavigationContainer>
      <Layout />
    </NavigationContainer>
  );
} 
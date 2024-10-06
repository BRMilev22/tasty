import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

interface Product {
    product_name?: string;
    brands?: string;
    nutriments?: Record<string, any>;
}

const ProductDetail = () => {
    const params = useLocalSearchParams();
    console.log('Received params:', params); // Debugging line
    
    const product = params.product as Product | undefined; // Updated type assertion
    const scannedData = params.scannedData as string | undefined; // Updated type assertion

    // Check if product data is available
    if (!product || !product.product_name) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No product data available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{product.product_name || 'Unknown Product'}</Text>
            <Text style={styles.details}>Brand: {product.brands || 'N/A'}</Text>
            <Text style={styles.details}>
                Nutriments: {product.nutriments ? JSON.stringify(product.nutriments, null, 2) : 'N/A'}
            </Text>
            {scannedData && (
                <Text style={styles.details}>Scanned Data: {scannedData}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    details: {
        fontSize: 16,
        marginVertical: 5,
    },
    errorText: {
        color: 'red',
        fontSize: 18,
    },
});

export default ProductDetail;
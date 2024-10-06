import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';

type RootStackParamList = {
  ProductDetail: { barcode: string };
};

type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const ProductDetail = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { barcode } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        console.log('API response:', JSON.stringify(data, null, 2)); // Log the full API response
        if (data.product) {
          setProduct(data.product);
        } else {
          setError('Продуктът не е намерен');
        }
      } catch (err) {
        setError('Неуспешно извличане на данни за продукта');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [barcode]);

  if (loading) {
    return <Text>Зареждане...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {product.image_url && (
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
      )}
      <Text style={styles.productName}>{product.product_name_bg || product.product_name || 'Непознат продукт'}</Text>
      <Text style={styles.productBrand}>{product.brands || 'Непозната марка'}</Text>
      <Text style={styles.productCategories}>{product.categories || 'Няма категории'}</Text>
      <Text style={styles.productIngredients}>
        Съставки: {product.ingredients_text || 'Няма налични съставки'}
      </Text>
      <Text style={styles.productAllergens}>
        Алергени: {product.allergens || 'Няма информация за алергени'}
      </Text>
      <Text style={styles.productAdditives}>
        Добавки: {product.additives || 'Няма информация за добавки'}
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Калории: {product.nutriments?.['energy-kcal_100g'] || 'Няма информация за калории'} ккал
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Протеини: {product.nutriments?.['proteins_100g'] || product.nutriments?.['proteins'] || 'Няма информация за протеини'} г
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Мазнини: {product.nutriments?.['fat_100g'] || 'Няма информация за мазнини'} г
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Въглехидрати: {product.nutriments?.['carbohydrates_100g'] || 'Няма информация за въглехидрати'} г
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '80%',  
    height: 250,
    resizeMode: 'contain',  
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    alignSelf: 'center',  
  },
  productName: {
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 8,
    color: '#2C3E50',
  },
  productBrand: {
    fontSize: 24,
    color: '#2980B9',
    marginVertical: 4,
    fontWeight: '600',
  },
  productCategories: {
    fontSize: 18,
    color: '#8E44AD',
    marginVertical: 4,
    fontStyle: 'italic',
  },
  productIngredients: {
    fontSize: 16,
    marginVertical: 4,
    color: '#333',
  },
  productAllergens: {
    fontSize: 16,
    marginVertical: 4,
    color: '#C0392B',
  },
  productAdditives: {
    fontSize: 16,
    marginVertical: 4,
    color: '#E67E22',
  },
  productNutritionalInfo: {
    fontSize: 16,
    marginVertical: 4,
    color: '#333',
  },
});

export default ProductDetail;
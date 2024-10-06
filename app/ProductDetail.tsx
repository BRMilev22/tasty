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
        Калории: {product.nutrition_grade_fr === 'a' ? 'Ниско' : product.nutrition_grade_fr === 'b' ? 'Умерено' : 'Високо'}
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Протеини: {product.proteins || 'Няма информация за протеини'} г
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Мазнини: {product.fat || 'Няма информация за мазнини'} г
      </Text>
      <Text style={styles.productNutritionalInfo}>
        Въглехидрати: {product.carbohydrates || 'Няма информация за въглехидрати'} г
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  productBrand: {
    fontSize: 20,
    color: '#555',
    marginVertical: 4,
  },
  productCategories: {
    fontSize: 16,
    color: '#777',
    marginVertical: 4,
  },
  productIngredients: {
    fontSize: 16,
    marginVertical: 4,
  },
  productAllergens: {
    fontSize: 16,
    marginVertical: 4,
  },
  productAdditives: {
    fontSize: 16,
    marginVertical: 4,
  },
  productNutritionalInfo: {
    fontSize: 16,
    marginVertical: 4,
  },
});

export default ProductDetail;
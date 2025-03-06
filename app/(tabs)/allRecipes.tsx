import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Recipe {
  id: string;
  name: string;
  calories: number;
  kcal?: number;
  image?: string;
  thumbnail?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  category?: string;
}

const AllRecipesScreen = () => {
  const navigation = useNavigation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showAllRecipes, setShowAllRecipes] = useState(true);

  // Fetch recipes from the API
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      // Using specific endpoint to get all recipes (352)
      const apiUrl = `http://${process.env.EXPO_PUBLIC_IPADDRESS || 'localhost'}:3000/recipes/all`;
      
      console.log('Fetching recipes from:', apiUrl);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.meals) {
        console.log(`Fetched ${data.meals.length} recipes`);
        
        const formattedRecipes = data.meals.map((meal: any) => ({
          id: meal.id.toString(),
          name: meal.name,
          calories: meal.calories || 0,
          image: meal.image || meal.thumbnail,
          thumbnail: meal.image || meal.thumbnail,
          protein: meal.macros?.protein || meal.protein || 0,
          carbs: meal.macros?.carbs || meal.carbs || 0,
          fats: meal.macros?.fat || meal.fats || 0,
          category: meal.category,
        }));
        
        setRecipes(formattedRecipes);
        setFilteredRecipes(formattedRecipes);
        
        // Extract unique categories and sort them
        const uniqueCategories = Array.from(
          new Set(formattedRecipes.map(recipe => recipe.category || 'Други'))
        ).filter(Boolean).sort();
        
        setCategories(uniqueCategories);
      } else {
        // Fallback to random endpoint if the all endpoint doesn't exist or doesn't work
        console.log('Falling back to random endpoint');
        const randomApiUrl = `http://${process.env.EXPO_PUBLIC_IPADDRESS || 'localhost'}:3000/recipes/random`;
        const randomResponse = await fetch(randomApiUrl);
        
        if (!randomResponse.ok) {
          throw new Error('Network response was not ok for random endpoint');
        }
        
        const randomData = await randomResponse.json();
        
        if (randomData && randomData.meals) {
          console.log(`Fetched ${randomData.meals.length} recipes from random endpoint`);
          
          const formattedRecipes = randomData.meals.map((meal: any) => ({
            id: meal.id.toString(),
            name: meal.name,
            calories: meal.calories || 0,
            image: meal.image,
            thumbnail: meal.image,
            protein: meal.macros?.protein || 0,
            carbs: meal.macros?.carbs || 0,
            fats: meal.macros?.fat || 0,
            category: meal.category,
          }));
          
          setRecipes(formattedRecipes);
          setFilteredRecipes(formattedRecipes);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(formattedRecipes.map(recipe => recipe.category || 'Други'))
          ).filter(Boolean).sort();
          
          setCategories(uniqueCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle search and category filter
  useEffect(() => {
    let filtered = recipes;
    
    // Apply category filter if selected
    if (selectedCategory) {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
      setShowAllRecipes(false);
    } else {
      setShowAllRecipes(true);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setShowAllRecipes(false);
    } else if (!selectedCategory) {
      setShowAllRecipes(true);
    }
    
    setFilteredRecipes(filtered);
  }, [searchQuery, recipes, selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    setSelectedCategory(null);
    fetchRecipes();
  };
  
  const handleCategoryPress = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  const handleAllRecipesPress = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setShowAllRecipes(true);
    setFilteredRecipes(recipes);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('mealDetail', {
      meal: {
        name: recipe.name,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fats: recipe.fats,
        image: recipe.image,
        thumbnail: recipe.thumbnail,
        category: recipe.category,
        servings: 1,
      },
      mealType: recipe.category
    });
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem, 
        selectedCategory === item && styles.categoryItemSelected
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.categoryTextSelected
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    // Properly encode the image URL to avoid URI parsing errors
    const getEncodedImageUrl = (url?: string) => {
      if (!url) return 'https://via.placeholder.com/150';
      
      try {
        // Handle URLs with spaces, Cyrillic characters, or special symbols
        const baseUrl = url.split('?')[0]; // Remove any query parameters
        const encodedUrl = encodeURI(baseUrl);
        
        // Check if URL already has a protocol
        if (!encodedUrl.startsWith('http')) {
          // If it's a relative path, ensure it has a protocol
          return `http://${process.env.EXPO_PUBLIC_IPADDRESS || 'localhost'}:3000${encodedUrl.startsWith('/') ? '' : '/'}${encodedUrl}`;
        }
        
        return encodedUrl;
      } catch (error) {
        console.error('Error encoding image URL:', error, url);
        return 'https://via.placeholder.com/150';
      }
    };

    return (
      <TouchableOpacity 
        style={styles.recipeItem}
        onPress={() => handleRecipePress(item)}
      >
        <Image 
          source={{ 
            uri: getEncodedImageUrl(item.image),
            cache: 'force-cache' // Use caching to avoid repeated failures
          }}
          onError={(e) => {
            console.log('Image loading failed:', e.nativeEvent.error, item.name);
            // Image loading errors are already handled by getEncodedImageUrl returning a fallback
          }}
          style={styles.recipeImage}
        />
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{item.name}</Text>
          <Text style={styles.recipeCalories}>{item.calories} kcal</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Всички рецепти</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Търсене на рецепти..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Categories section */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          <TouchableOpacity 
            style={[
              styles.categoryItem, 
              showAllRecipes && styles.categoryItemSelected
            ]}
            onPress={handleAllRecipesPress}
          >
            <Text style={[
              styles.categoryText,
              showAllRecipes && styles.categoryTextSelected
            ]}>
              Всички
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity 
              key={category}
              style={[
                styles.categoryItem, 
                selectedCategory === category && styles.categoryItemSelected
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextSelected
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'рецепта' : 'рецепти'}
            </Text>
            
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recipeList}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            initialNumToRender={20}
            maxToRenderPerBatch={30}
            windowSize={10}
            numColumns={1}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    color: '#999',
  },
  refreshButton: {
    padding: 5,
  },
  recipeList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    marginBottom: 12,
    padding: 12,
    overflow: 'hidden',
  },
  recipeImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  recipeCalories: {
    fontSize: 14,
    color: '#999',
  },
});

export default AllRecipesScreen; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Animated from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SavedMealsScreen = () => {
  const [meals, setMeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'blocked'>('saved');
  const auth = getAuth();
  const db = getFirestore();
  const navigation = useNavigation();

  useEffect(() => {
    fetchMeals();
  }, [activeTab]);

  const fetchMeals = async () => {
    if (!auth.currentUser) return;
    
    const mealsRef = collection(db, 'users', auth.currentUser.uid, 'meals');
    const q = query(mealsRef, where('status', '==', activeTab));
    
    const querySnapshot = await getDocs(q);
    const mealsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setMeals(mealsList);
  };

  const showNotification = (title: string, message: string, type: 'success' | 'error') => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
      props: {
        onPress: () => Toast.hide()
      }
    });
  };

  const handleStatusChange = async (mealId: string, newStatus: string | null) => {
    try {
      if (!auth.currentUser) return;
      
      const mealRef = doc(db, 'users', auth.currentUser.uid, 'meals', mealId);
      
      setMeals(currentMeals => currentMeals.filter(meal => meal.id !== mealId));
      
      if (newStatus === null) {
        setTimeout(async () => {
          await deleteDoc(mealRef);
          showNotification(
            activeTab === 'saved' ? 'Премахнато ястие' : 'Отблокирано ястие',
            activeTab === 'saved' 
              ? 'Ястието е премахнато от запазени' 
              : 'Ястието вече ще се показва в препоръките',
            'success'
          );
        }, 300);
      } else {
        await updateDoc(mealRef, { status: newStatus });
        showNotification(
          'Статусът е променен',
          'Успешно променихте статуса на ястието',
          'success'
        );
      }
      
      setTimeout(() => {
        fetchMeals();
      }, 500);
    } catch (error) {
      console.error('Error changing meal status:', error);
      showNotification(
        'Грешка',
        'Неуспешна промяна на статуса',
        'error'
      );
    }
  };

  const renderMealItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.mealCard}
      onPress={() => navigation.navigate('mealDetail', { meal: item })}
    >
      <Image source={{ uri: item.image }} style={styles.mealImage} />
      <View style={styles.mealOverlay}>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.mealStats}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color="#FF6B6B" />
              <Text style={styles.statText}>{item.calories} kcal</Text>
            </View>
            {item.protein && (
              <View style={styles.statItem}>
                <Ionicons name="barbell" size={16} color="#4ECDC4" />
                <Text style={styles.statText}>{item.protein}g</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleStatusChange(item.id, null)}
        >
          <Animated.View style={styles.actionButtonInner}>
            {activeTab === 'saved' ? (
              <Ionicons name="heart-dislike" size={22} color="#FF4444" />
            ) : (
              <Ionicons name="lock-open" size={22} color="#4CAF50" />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === 'saved' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'saved' && styles.activeTabText
          ]}>Запазени</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
          onPress={() => setActiveTab('blocked')}
        >
          <Ionicons 
            name="lock-closed" 
            size={20} 
            color={activeTab === 'blocked' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'blocked' && styles.activeTabText
          ]}>Блокирани</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={meals}
        renderItem={renderMealItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    color: '#666666',
    fontSize: 16,
    marginLeft: 8,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContainer: {
    padding: 8,
  },
  mealCard: {
    width: (width - 48) / 2,
    height: 200,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    justifyContent: 'space-between',
  },
  mealInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mealName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginLeft: 4,
  },
  actionButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  actionButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SavedMealsScreen; 
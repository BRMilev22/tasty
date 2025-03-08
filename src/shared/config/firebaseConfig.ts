import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native'; // Check platform
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage for React Native

// Your Firebase config object
const firebaseConfig = {
    apiKey: `${process.env.EXPO_PUBLIC_FIREBASE_API_KEY}`,
    authDomain: "tasty-63fe0.firebaseapp.com",
    projectId: "tasty-63fe0",
    storageBucket: "tasty-63fe0",
    messagingSenderId: `${process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}`,
    appId: `${process.env.EXPO_PUBLIC_FIREBASE_APP_ID}`,
    measurementId: `${process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID}`
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let auth;

if (Platform.OS === 'web') {
    // For web, use browser persistence
    auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence); // Set web persistence
} else {
    // For React Native (mobile), use AsyncStorage for persistence
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
}

// Initialize Firestore
const db = getFirestore(app); // Declare db only once

// Exporting auth and db
export { auth, db };
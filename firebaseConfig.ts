import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native'; // Check platform
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage for React Native

// Your Firebase config object
const firebaseConfig = {
    apiKey: "AIzaSyAw0lS-Hs2TD8S-_LLfMMqDRIVLx9l2-bQ",
    authDomain: "tasty-63fe0.firebaseapp.com",
    projectId: "tasty-63fe0",
    storageBucket: "tasty-63fe0",
    messagingSenderId: "925857000407",
    appId: "1:925857000407:web:e8c255bfbd67cc2132b992",
    measurementId: "G-1RWWK1JZ1L"
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
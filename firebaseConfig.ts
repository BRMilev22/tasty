// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth'; // Make sure this is the correct import
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Your Firebase config object
const firebaseConfig = {
    apiKey: "AIzaSyAw0lS-Hs2TD8S-_LLfMMqDRIVLx9l2-bQ",
    authDomain: "tasty-63fe0.firebaseapp.com",
    projectId: "tasty-63fe0",
    storageBucket: "tasty-63fe0.appspot.com",
    messagingSenderId: "925857000407",
    appId: "1:925857000407:web:e8c255bfbd67cc2132b992",
    measurementId: "G-1RWWK1JZ1L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage) // Correctly use AsyncStorage for persistence
});

// Optionally, initialize Firestore if needed
// import { getFirestore } from 'firebase/firestore';
// const db = getFirestore(app);

export const db = getFirestore(app);

export { auth };
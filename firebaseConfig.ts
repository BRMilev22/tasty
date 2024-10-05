// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Removed getReactNativePersistence
// import { getReactNativePersistence } from 'firebase/auth'; 
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

// Initialize Firebase Auth without persistence (defaults to session)
const auth = initializeAuth(app);

// Initialize Firestore
const db = getFirestore(app); // Declare db only once

// Exporting auth and db
export { auth, db }; // Only export once
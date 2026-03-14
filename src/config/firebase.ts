import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD-yggkFLlbng_DwEqJMYYFxQeltgJmtQQ",
  authDomain: "attendance-ce4b0.firebaseapp.com",
  projectId: "attendance-ce4b0",
  storageBucket: "attendance-ce4b0.firebasestorage.app",
  messagingSenderId: "548114127037",
  appId: "1:548114127037:web:f6858c4ff099e992f07fd4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = (() => {
  const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence;
  
  if (getReactNativePersistence) {
    try {
      return FirebaseAuth.initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      return FirebaseAuth.getAuth(app);
    }
  }
  return FirebaseAuth.getAuth(app);
})();
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };


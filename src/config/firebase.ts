import { initializeApp, getApps, getApp } from "firebase/app";
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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = (() => {
  try {
    // Disabling persistence as requested so the user must login every time
    return FirebaseAuth.initializeAuth(app, {
      persistence: FirebaseAuth.inMemoryPersistence,
    });
  } catch (error) {
    // Fallback if auth is already initialized (important for hot-reloads)
    return FirebaseAuth.getAuth(app);
  }
})();
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };


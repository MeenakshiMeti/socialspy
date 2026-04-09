import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAsOF9B6p5IbjhnoAxdKt8GjoQWofo0vOI",
  authDomain: "socialspy-ca526.firebaseapp.com",
  projectId: "socialspy-ca526",
  storageBucket: "socialspy-ca526.firebasestorage.app",
  messagingSenderId: "225611540269",
  appId: "1:225611540269:web:a7dda145d536ae810015a4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);


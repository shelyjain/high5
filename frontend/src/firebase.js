// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDv-fpeRgUVgBdzhrmLygFDE0g3Qm25vfg",
  authDomain: "fiveai-f5703.firebaseapp.com",
  projectId: "fiveai-f5703",
  storageBucket: "fiveai-f5703.firebasestorage.app",
  messagingSenderId: "863983093693",
  appId: "1:863983093693:web:a1ce733fff8ba7d8cdb4d4",
  measurementId: "G-QG3HWPXL2L" // optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

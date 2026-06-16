// File: src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Konfigurasi Firebase milikmu
const firebaseConfig = {
  apiKey: "REMOVED_FOR_SECURITY",
  authDomain: "REMOVED_FOR_SECURITY",
  projectId: "myquranplan", // Ini adalah Project ID Firebase Anda
  storageBucket: "REMOVED_FOR_SECURITY",
  messagingSenderId: "REMOVED_FOR_SECURITY",
  appId: "REMOVED_FOR_SECURITY"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ID Aplikasi untuk memisahkan data jika nantinya ada banyak aplikasi di 1 database
export const appId = 'app-quran-alfityan';
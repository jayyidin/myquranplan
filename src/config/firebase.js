// File: src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';

// Konfigurasi Firebase milikmu
const firebaseConfig = {
  apiKey: "AIzaSyDmlufgIku6oN7eFTRP7tlRDGrIVmICTiM",
  authDomain: "myquranplan.firebaseapp.com",
  projectId: "myquranplan",
  storageBucket: "myquranplan.firebasestorage.app",
  messagingSenderId: "896025622141",
  appId: "1:896025622141:web:1a6964fcfe3bfea827e314"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ID Aplikasi untuk memisahkan data jika nantinya ada banyak aplikasi di 1 database
export const appId = 'app-quran-alfityan';
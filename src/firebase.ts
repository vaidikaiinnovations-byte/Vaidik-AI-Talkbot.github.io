import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvGII8rmok0ce9MJ-IfiuHNPwmU_SW5a4",
  authDomain: "primal-orb-674w7.firebaseapp.com",
  projectId: "primal-orb-674w7",
  storageBucket: "primal-orb-674w7.firebasestorage.app",
  messagingSenderId: "308092126833",
  appId: "1:308092126833:web:ea28d56b42883bfcaffdd0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
};
export type { FirebaseUser };

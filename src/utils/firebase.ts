import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// The config will be loaded from the environment or from our config JSON
const firebaseConfig = {
  apiKey: "AIzaSyDFR-5I-PKhld7rykNnZA47B3E6gKT-EVk",
  authDomain: "gen-lang-client-0181314929.firebaseapp.com",
  projectId: "gen-lang-client-0181314929",
  storageBucket: "gen-lang-client-0181314929.firebasestorage.app",
  messagingSenderId: "917074438810",
  appId: "1:917074438810:web:9a815d0287a08432380d23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

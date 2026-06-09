// ==========================================
// TEMPEPLAY - FIREBASE CONFIG
// Ganti dengan config Firebase lo sendiri!
// https://console.firebase.google.com
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyDh12M_e5CbL11OtooEcpw6pJqJxJ0cA9Q",
  authDomain: "tempeanimeplay.firebaseapp.com",
  projectId: "tempeanimeplay",
  storageBucket: "tempeanimeplay.firebasestorage.app",
  messagingSenderId: "1086648525854",
  appId: "1:1086648525854:web:3d2e8befa554d11b903a0f"
};

// Import Firebase (CDN)
const firebaseScript = document.createElement('script');
firebaseScript.type = 'module';
firebaseScript.textContent = `
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  const app = initializeApp(${JSON.stringify(firebaseConfig)});
  window.firebaseApp = app;
  window.firebaseAuth = getAuth(app);
  window.firebaseDB = getFirestore(app);
  window.firebaseFns = {
    onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, updateProfile,
    doc, setDoc, getDoc, updateDoc, collection, addDoc,
    onSnapshot, serverTimestamp, query, orderBy, limit
  };
  window.dispatchEvent(new Event('firebase-ready'));
`;
document.head.appendChild(firebaseScript);

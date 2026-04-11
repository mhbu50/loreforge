import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD8XsmbkEp6KRUG4tIcKw7WsIgKSzSg29U",
  authDomain: "versehost.firebaseapp.com",
  projectId: "versehost",
  storageBucket: "versehost.firebasestorage.app",
  messagingSenderId: "157513862772",
  appId: "1:157513862772:web:92d02d4c9abe68e490cb21",
  measurementId: "G-P3DG425VBN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

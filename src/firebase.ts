import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

// Analytics is optional — only initialize if supported (requires it to be enabled in Firebase Console)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {
  // Analytics not available — not critical, continue without it
});

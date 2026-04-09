import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA4Oc3e3lPQnb8rdhEbPCS_lT_gytWMx3k',
  authDomain: 'hostel-d4b6a.firebaseapp.com',
  projectId: 'hostel-d4b6a',
  storageBucket: 'hostel-d4b6a.firebasestorage.app',
  messagingSenderId: '44595820778',
  appId: '1:44595820778:web:74a9159fa7533d270bff93',
  measurementId: 'G-G4M9KR0DSW',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

export default app;

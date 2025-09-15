import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "studio-2256766213-a72a9",
  "appId": "1:61192697258:web:bf831e7c2af081d773a7d3",
  "storageBucket": "studio-2256766213-a72a9.appspot.com",
  "apiKey": "AIzaSyAxBUBV8IsPagKwwPETsxdIXbjdFjfIT4s",
  "authDomain": "studio-2256766213-a72a9.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "61192697258"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app, firebaseConfig.storageBucket);
const auth = getAuth(app);

export { db, storage, auth };

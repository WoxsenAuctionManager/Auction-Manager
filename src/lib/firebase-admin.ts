// src/lib/firebase-admin.ts
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error(
    "Missing Firebase environment variable FIREBASE_SERVICE_ACCOUNT_JSON"
  );
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app).bucket();

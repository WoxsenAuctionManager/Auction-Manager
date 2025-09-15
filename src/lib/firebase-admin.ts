// src/lib/firebase-admin.ts
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  throw new Error(
    "Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set."
  );
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "studio-2256766213-a72a9.firebasestorage.app", // Corrected bucket name
    });

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app).bucket();

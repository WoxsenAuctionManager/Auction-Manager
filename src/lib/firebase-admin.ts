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
    "Missing Firebase environment variables. Check your .env file."
  );
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process
    .env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
};

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    });

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app).bucket();

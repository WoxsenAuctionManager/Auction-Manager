import * as admin from 'firebase-admin';

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  // This check is important. If these are not set, the app will crash.
  // It's better to have a clear error message.
  if (process.env.NODE_ENV === 'development') {
    console.error("Firebase environment variables are not set. Please check your .env file.");
  }
  // In production, you'd want this to be a hard error.
  throw new Error(
    'Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set.'
  );
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key from the .env file needs to have its newlines correctly formatted.
  // The `replace` function is crucial for this.
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.projectId}.appspot.com`,
  });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

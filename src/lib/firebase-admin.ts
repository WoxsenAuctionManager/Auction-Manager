import * as admin from 'firebase-admin';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
}

let serviceAccount;
try {
  // Try parsing the variable, in case it's a JSON string.
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (e) {
  // If parsing fails, it might be because the variable is not a JSON string.
  // In some environments, it might already be an object or needs to be handled differently.
  // For this specific error, we assume it's a string that was malformed due to newlines.
  // A simple check is to see if it starts with '{', if not, something is wrong.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON.startsWith('{')) {
     console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. The JSON string might be malformed.");
  }
  // The most common issue is the format of the private_key. Let's re-read it assuming it's an object.
  // However, with Next.js, env vars are strings. So the error is almost certainly in the .env file.
  // The fix below in the .env file should resolve this. This is a fallback.
  throw new Error('Could not parse FIREBASE_SERVICE_ACCOUNT_JSON. Please ensure it is a valid, single-line JSON string in your .env file.');
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

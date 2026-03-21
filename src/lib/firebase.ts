import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount: ServiceAccount = {
  projectId: import.meta.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (import.meta.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

const app = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);

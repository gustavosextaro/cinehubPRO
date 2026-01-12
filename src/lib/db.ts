import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firestoreInstance: Firestore | null = null;

// Lazy initialization - only runs when actually needed, not during build
function initializeFirebase(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Validate environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID environment variable');
  }
  if (!clientEmail) {
    throw new Error('Missing FIREBASE_CLIENT_EMAIL environment variable');
  }
  if (!privateKey) {
    throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

// Getter function that initializes on first use
export function getDb(): Firestore {
  if (!firestoreInstance) {
    initializeFirebase();
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}

// Backward compatibility - will initialize on first access
export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

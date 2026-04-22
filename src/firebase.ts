import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Standard Node-style process check
const getProcessEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return undefined;
};

// Vite-style env check (must handle env object carefully)
const getViteEnv = (key: string): string | undefined => {
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}
  return undefined;
};

// Get config from either environment (EC2 Node or Build-time Vite)
const apiKey = getProcessEnv('VITE_FIREBASE_API_KEY') || getViteEnv('VITE_FIREBASE_API_KEY');
const authDomain = getProcessEnv('VITE_FIREBASE_AUTH_DOMAIN') || getViteEnv('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = getProcessEnv('VITE_FIREBASE_PROJECT_ID') || getViteEnv('VITE_FIREBASE_PROJECT_ID');
const storageBucket = getProcessEnv('VITE_FIREBASE_STORAGE_BUCKET') || getViteEnv('VITE_FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getProcessEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID');
const appId = getProcessEnv('VITE_FIREBASE_APP_ID') || getViteEnv('VITE_FIREBASE_APP_ID');
const envDatabaseId = getProcessEnv('VITE_FIREBASE_DATABASE_ID') || getViteEnv('VITE_FIREBASE_DATABASE_ID');

// Import AI Studio fallback config
import defaultFirebaseConfig from '../firebase-applet-config.json';

const finalConfig = {
  apiKey: apiKey || (defaultFirebaseConfig as any).apiKey,
  authDomain: authDomain || (defaultFirebaseConfig as any).authDomain,
  projectId: projectId || (defaultFirebaseConfig as any).projectId,
  storageBucket: storageBucket || (defaultFirebaseConfig as any).storageBucket,
  messagingSenderId: messagingSenderId || (defaultFirebaseConfig as any).messagingSenderId,
  appId: appId || (defaultFirebaseConfig as any).appId,
};

// Defensive check for initialization
const databaseId = envDatabaseId || (defaultFirebaseConfig as any).firestoreDatabaseId;
const dbId = (!databaseId || databaseId === "(default)") ? undefined : databaseId;

// Defensive check for initialization
const hasMinimumConfig = !!finalConfig.projectId && !!finalConfig.apiKey;

console.log("[Firebase] Booting with project:", finalConfig.projectId || "MISSING");

const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(hasMinimumConfig ? finalConfig : {
      apiKey: "unset",
      authDomain: "unset",
      projectId: "unset",
      appId: "unset"
    });

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
console.log("[Firebase] Services ready");

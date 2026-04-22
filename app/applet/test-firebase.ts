import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    console.log('Testing Client SDK access to:', firebaseConfig.firestoreDatabaseId);
    const q = query(collection(db, 'users'), limit(1));
    await getDocs(q);
    console.log('Success!');
  } catch (e: any) {
    console.log('Error code:', e.code);
    console.log('Error message:', e.message);
  }
}

test();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    console.log('Testing Client SDK access to:', firebaseConfig.firestoreDatabaseId);
    const q = query(collection(db, 'users'), limit(1));
    await getDocs(q);
    console.log('Success!');
  } catch (e) {
    console.log('Error code:', e.code);
    console.log('Error message:', e.message);
  }
}

test();

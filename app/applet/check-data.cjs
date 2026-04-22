const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const q = query(collection(db, 'users'));
    const snap = await getDocs(q);
    console.log('Total users:', snap.size);
    snap.forEach(doc => {
      console.log('User:', doc.id, doc.data().username);
    });
  } catch (e) {
    console.log('Error:', e.message);
  }
}

test();

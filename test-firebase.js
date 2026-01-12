require('dotenv').config({ path: '.env.local' });

console.log('Testing Firebase Configuration...\n');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

try {
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  
  console.log('\nInitializing Firebase Admin...');
  
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully!');
  } else {
    console.log('✅ Firebase Admin already initialized');
  }
  
  const db = getFirestore();
  console.log('✅ Firestore instance obtained');
  
  // Test read operation
  console.log('\nTesting Firestore read...');
  db.collection('aggregates').doc('stats').get()
    .then(doc => {
      if (doc.exists) {
        console.log('✅ Successfully read stats document:', doc.data());
      } else {
        console.log('⚠️  Stats document does not exist yet (this is OK for a new setup)');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Firestore read failed:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    });
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}

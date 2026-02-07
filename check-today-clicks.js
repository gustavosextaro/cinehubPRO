// Check what's actually in Firestore for today
require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🔍 Checking Today\'s Firestore Data...\n');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

const db = getFirestore();

async function checkTodayData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}\n`);
    
    // Check daily document
    const dailyDoc = await db.collection('aggregates').doc(`daily_${today}`).get();
    
    if (dailyDoc.exists) {
      const data = dailyDoc.data();
      console.log('✅ Daily document EXISTS:');
      console.log('   Document ID:', `daily_${today}`);
      console.log('   Pageviews:', data.pageviews || 0);
      console.log('   Date field:', data.date);
      console.log('   Clicks:', JSON.stringify(data.clicks || {}, null, 2));
      console.log('\n');
      
      if (data.clicks && Object.keys(data.clicks).length > 0) {
        console.log('✅ Clicks are being tracked today!');
        console.log('   Total click types:', Object.keys(data.clicks).length);
      } else {
        console.log('⚠️  No clicks tracked yet today (this is normal if it\'s early or if document was just created)');
      }
    } else {
      console.log('❌ Daily document does NOT exist yet');
      console.log('   This is normal if no events happened today yet');
      console.log('   The document will be created on the first pageview or click today');
    }
    
    // Also check stats document
    console.log('\n📊 Checking total stats document:');
    const statsDoc = await db.collection('aggregates').doc('stats').get();
    
    if (statsDoc.exists) {
      const stats = statsDoc.data();
      console.log('✅ Stats document exists');
      console.log('   Total pageviews (all time):', stats.totalPageviews);
      console.log('   Total unique click types (all time):', Object.keys(stats.clicks || {}).length);
      console.log('   Top 3 clicks (all time):');
      
      const topClicks = Object.entries(stats.clicks || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      topClicks.forEach(([name, count]) => {
        console.log(`      ${name}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTodayData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

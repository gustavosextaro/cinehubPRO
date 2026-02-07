// Debug script to check Firestore aggregates structure
require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🔍 Checking Firestore Aggregates Structure...\n');

// Initialize Firebase
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

const db = getFirestore();

async function checkAggregates() {
  try {
    console.log('📊 Checking collection: aggregates\n');
    
    // Check stats doc
    const statsDoc = await db.collection('aggregates').doc('stats').get();
    if (statsDoc.exists) {
      const data = statsDoc.data();
      console.log('✅ aggregates/stats exists:');
      console.log('   - totalPageviews:', data.totalPageviews);
      console.log('   - tiktokVisits:', data.tiktokVisits);
      console.log('   - clicks:', Object.keys(data.clicks || {}).length, 'components');
      console.log('   - Top 3 clicks:');
      const topClicks = Object.entries(data.clicks || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      topClicks.forEach(([name, count]) => {
        console.log(`     ${name}: ${count}`);
      });
    } else {
      console.log('❌ aggregates/stats does NOT exist');
    }
    
    console.log('\n📅 Checking daily documents:');
    const today = new Date().toISOString().split('T')[0];
    const dailyDoc = await db.collection('aggregates').doc(`daily_${today}`).get();
    
    if (dailyDoc.exists) {
      const data = dailyDoc.data();
      console.log(`✅ aggregates/daily_${today} exists:');
      console.log('   - pageviews:', data.pageviews);
    } else {
      console.log(`❌ aggregates/daily_${today} does NOT exist`);
    }
    
    // List all daily docs
    console.log('\n📋 All daily documents:');
    const allDocs = await db.collection('aggregates')
      .where('date', '!=', null)
      .get();
    
    console.log(`   Found ${allDocs.size} daily documents:`);
    allDocs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.pageviews} pageviews (date: ${data.date})`);
    });
    
    console.log('\n📊 Checking analytics_aggregates collection (if exists):');
    const analyticsAggsSnapshot = await db.collection('analytics_aggregates').get();
    console.log(`   Found ${analyticsAggsSnapshot.size} documents in analytics_aggregates`);
    
    if (analyticsAggsSnapshot.size > 0) {
      analyticsAggsSnapshot.forEach(doc => {
        console.log(`   - ${doc.id}:`, doc.data());
      });
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkAggregates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

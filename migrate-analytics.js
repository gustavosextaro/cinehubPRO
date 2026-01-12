// Script to migrate existing analytics events to aggregated structure
require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

console.log('🔄 Starting Analytics Migration to Aggregates...\n');

// Initialize Firebase
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

const db = getFirestore();

async function migrateToAggregates() {
  try {
    console.log('📊 Step 1: Fetching all analytics events...');
    const analyticsSnapshot = await db.collection('analytics').get();
    console.log(`   Found ${analyticsSnapshot.size} events\n`);

    // Initialize aggregates
    let totalPageviews = 0;
    let tiktokVisits = 0;
    const clicksByComponent = {};
    const dailyPageviews = {};

    console.log('🔍 Step 2: Processing events...');
    analyticsSnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = new Date(data.timestamp).toISOString().split('T')[0];

      if (data.type === 'pageview') {
        totalPageviews++;
        
        // Track daily
        if (!dailyPageviews[eventDate]) {
          dailyPageviews[eventDate] = 0;
        }
        dailyPageviews[eventDate]++;

        // Check if from TikTok
        const referrer = (data.referrer || '').toLowerCase();
        if (referrer.includes('tiktok')) {
          tiktokVisits++;
        }
      } else if (data.type === 'click' && data.componentName) {
        if (!clicksByComponent[data.componentName]) {
          clicksByComponent[data.componentName] = 0;
        }
        clicksByComponent[data.componentName]++;
      }
    });

    console.log('   Total pageviews:', totalPageviews);
    console.log('   TikTok visits:', tiktokVisits);
    console.log('   Unique components clicked:', Object.keys(clicksByComponent).length);
    console.log('   Days with data:', Object.keys(dailyPageviews).length);
    console.log('');

    console.log('💾 Step 3: Writing aggregates to Firebase...');
    
    // Write global stats
    await db.collection('aggregates').doc('stats').set({
      totalPageviews,
      tiktokVisits,
      clicks: clicksByComponent,
      lastUpdated: Date.now(),
    });
    console.log('   ✅ Written aggregates/stats');

    // Write daily stats
    let dailyCount = 0;
    for (const [date, pageviews] of Object.entries(dailyPageviews)) {
      await db.collection('aggregates').doc(`daily_${date}`).set({
        pageviews,
        date,
      });
      dailyCount++;
    }
    console.log(`   ✅ Written ${dailyCount} daily aggregate documents\n`);

    console.log('🎉 Migration Complete!\n');
    console.log('Summary:');
    console.log('  - Total Pageviews:', totalPageviews);
    console.log('  - TikTok Visits:', tiktokVisits);
    console.log('  - Components tracked:', Object.keys(clicksByComponent).length);
    console.log('  - Top component:', Object.entries(clicksByComponent).sort((a, b) => b[1] - a[1])[0]);
    console.log('');
    console.log('✅ Your dashboard will now show the historical data!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateToAggregates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

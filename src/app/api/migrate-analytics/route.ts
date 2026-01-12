import { db } from '../../../lib/firebase-admin';
import { NextRequest } from 'next/server';

// Secret key to protect this endpoint
const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'change-me-in-production';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${MIGRATION_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting analytics migration...');

    // Fetch all analytics events
    const analyticsSnapshot = await db.collection('analytics').get();
    console.log(`📊 Found ${analyticsSnapshot.size} events`);

    // Initialize aggregates
    let totalPageviews = 0;
    let tiktokVisits = 0;
    const clicksByComponent: Record<string, number> = {};
    const dailyPageviews: Record<string, number> = {};

    analyticsSnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = new Date(data.timestamp).toISOString().split('T')[0];

      if (data.type === 'pageview') {
        totalPageviews++;
        
        if (!dailyPageviews[eventDate]) {
          dailyPageviews[eventDate] = 0;
        }
        dailyPageviews[eventDate]++;

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

    console.log('💾 Writing aggregates...');
    
    // Write global stats
    await db.collection('aggregates').doc('stats').set({
      totalPageviews,
      tiktokVisits,
      clicks: clicksByComponent,
      lastUpdated: Date.now(),
    });

    // Write daily stats
    const dailyWrites = [];
    for (const [date, pageviews] of Object.entries(dailyPageviews)) {
      dailyWrites.push(
        db.collection('aggregates').doc(`daily_${date}`).set({
          pageviews,
          date,
        })
      );
    }
    await Promise.all(dailyWrites);

    console.log('✅ Migration complete!');

    return Response.json({
      success: true,
      stats: {
        totalEvents: analyticsSnapshot.size,
        totalPageviews,
        tiktokVisits,
        components: Object.keys(clicksByComponent).length,
        daysTracked: Object.keys(dailyPageviews).length,
      },
    });
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return Response.json({ 
      error: 'Migration failed', 
      message: error.message 
    }, { status: 500 });
  }
}

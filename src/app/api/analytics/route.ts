import { db } from '../../../lib/db';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

interface AnalyticsEvent {
  type: 'pageview' | 'click';
  timestamp: number;
  userAgent: string;
  referrer: string;
  componentName?: string;
}

// Helper to getting date string YYYY-MM-DD
function getDateString() {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, component } = body;
    const date = getDateString();

    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      referrer: request.headers.get('referer') || 'Direct',
      ...(component && { componentName: component }),
    };

    // 1. Save raw event (for historical backup)
    const eventRef = db.collection('analytics').doc();
    
    // 2. Atomic increments for aggregates
    const statsRef = db.collection('aggregates').doc('stats');
    const dailyRef = db.collection('aggregates').doc(`daily_${date}`);

    await db.runTransaction(async (transaction) => {
      // ===== PHASE 1: ALL READS FIRST (Firestore requirement) =====
      const statsDoc = await transaction.get(statsRef);
      const dailyDoc = await transaction.get(dailyRef);

      // ===== PHASE 2: ALL WRITES AFTER =====
      const increment = (n: number) => FieldValue.increment(n);
      
      // Extract referrer source for tracking
      const getReferrerSource = (referrer: string): string => {
        if (!referrer || referrer === 'Direct') return 'Direct';
        const lower = referrer.toLowerCase();
        if (lower.includes('tiktok')) return 'TikTok';
        if (lower.includes('instagram')) return 'Instagram';
        if (lower.includes('facebook')) return 'Facebook';
        if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter';
        if (lower.includes('youtube')) return 'YouTube';
        if (lower.includes('google')) return 'Google';
        if (lower.includes('whatsapp')) return 'WhatsApp';
        
        // Extract domain from URL
        try {
          const url = new URL(referrer);
          return url.hostname.replace('www.', '');
        } catch {
          return 'Web';
        }
      };
      
      const referrerSource = getReferrerSource(event.referrer);
      
      // Handle stats document
      if (!statsDoc.exists) {
        // Create with initial values
        const initialStats: any = {
          totalPageviews: type === 'pageview' ? 1 : 0,
          tiktokVisits: (type === 'pageview' && referrerSource === 'TikTok') ? 1 : 0,
          clicks: {},
          referrers: {}
        };
        
        if (type === 'click' && component) {
          initialStats.clicks[component] = 1;
        }
        
        if (type === 'pageview') {
          initialStats.referrers[referrerSource] = 1;
        }
        
        transaction.set(statsRef, initialStats);
      } else {
        // Document exists, update it
        if (type === 'pageview') {
          transaction.update(statsRef, { totalPageviews: increment(1) });
          
          if (referrerSource === 'TikTok') {
            transaction.update(statsRef, { tiktokVisits: increment(1) });
          }
          
          // Track referrer source
          transaction.update(statsRef, { [`referrers.${referrerSource}`]: increment(1) });
        }
        // Note: clicks are now stored in daily documents only, not in global stats
      }
      
      // Handle daily document
      if (!dailyDoc.exists) {
        const initialDaily: any = {
          pageviews: type === 'pageview' ? 1 : 0,
          clicks: {}
        };
        
        if (type === 'click' && component) {
          initialDaily.clicks[component] = 1;
        }
        
        transaction.set(dailyRef, initialDaily);
      } else {
        if (type === 'pageview') {
          transaction.update(dailyRef, { pageviews: increment(1) });
        }
        
        if (type === 'click' && component) {
          transaction.update(dailyRef, { [`clicks.${component}`]: increment(1) });
        }
      }

      // Perform the raw insert
      transaction.set(eventRef, event);
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Optimized Read: Just 2 documents instead of thousands
    const statsDoc = await db.collection('aggregates').doc('stats').get();
    const date = getDateString();
    const dailyDoc = await db.collection('aggregates').doc(`daily_${date}`).get();

    if (!statsDoc.exists) {
      return Response.json({
        totalPageviews: 0,
        todayPageviews: 0,
        clicksByComponent: {},
        tiktokPercentage: 0,
      });
    }

    const data = statsDoc.data() || {};
    const dailyData = dailyDoc.data() || { pageviews: 0 };

    // Calculate derived metrics
    const totalPageviews = data.totalPageviews || 0;
    const tiktokVisits = data.tiktokVisits || 0;
    const tiktokPercentage = totalPageviews > 0 
      ? Math.round((tiktokVisits / totalPageviews) * 100) 
      : 0;

    return Response.json({
      totalPageviews,
      todayPageviews: dailyData.pageviews || 0,
      weekPageviews: 0, // Simplified for performance (can be re-added later with weekly aggregators)
      clicksByComponent: dailyData.clicks || {}, // Clicks from TODAY only (resets daily)
      referrers: data.referrers || {}, // Now returns real referrer data
      tiktokPercentage,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return Response.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

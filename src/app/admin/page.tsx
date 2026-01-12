import { AnalyticsDashboard } from '../../components/analytics-dashboard';
import { db } from '../../lib/firebase-admin';

export const metadata = {
  title: 'Admin Analytics | CineHub',
  description: 'Painel de métricas e analytics do CineHub',
};

// Disable caching to always get fresh data
export const revalidate = 0;

// Helper to get date string YYYY-MM-DD
function getDateString() {
  return new Date().toISOString().split('T')[0];
}

async function getAnalyticsData() {
  try {
    console.log('🔍 [Admin Page] Fetching analytics from all events...');
    
    // Read all analytics events directly
    const analyticsSnapshot = await db.collection('analytics').get();
    console.log('📊 [Admin Page] Found', analyticsSnapshot.size, 'analytics events');
    
    // Process events
    let totalPageviews = 0;
    let todayPageviews = 0;
    let tiktokVisits = 0;
    const clicksByComponent: Record<string, number> = {};
    const today = getDateString();
    
    analyticsSnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = new Date(data.timestamp).toISOString().split('T')[0];
      
      if (data.type === 'pageview') {
        totalPageviews++;
        if (eventDate === today) {
          todayPageviews++;
        }
        
        // Check if from TikTok
        const referrer = (data.referrer || '').toLowerCase();
        if (referrer.includes('tiktok')) {
          tiktokVisits++;
        }
      } else if (data.type === 'click' && data.componentName) {
        clicksByComponent[data.componentName] = (clicksByComponent[data.componentName] || 0) + 1;
      }
    });
    
    const tiktokPercentage = totalPageviews > 0 
      ? Math.round((tiktokVisits / totalPageviews) * 100) 
      : 0;
    
    const result = {
      totalPageviews,
      todayPageviews,
      weekPageviews: 0,
      clicksByComponent,
      referrers: {},
      tiktokPercentage,
    };
    
    console.log('✅ [Admin Page] Analytics processed successfully');
    console.log('   Total Pageviews:', result.totalPageviews);
    console.log('   Today:', result.todayPageviews);
    console.log('   TikTok %:', result.tiktokPercentage);
    
    return result;
  } catch (error: any) {
    console.error('❌ [Admin Page] Error fetching analytics:', error?.message);
    console.error('   Error code:', error?.code);
    
    // Return empty data on error
    return {
      totalPageviews: 0,
      todayPageviews: 0,
      weekPageviews: 0,
      clicksByComponent: {},
      referrers: {},
      tiktokPercentage: 0,
    };
  }
}

export default async function AdminPage() {
  const data = await getAnalyticsData();
  
  return <AnalyticsDashboard initialData={data} />;
}

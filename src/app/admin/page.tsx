import { AnalyticsDashboard } from '../../components/analytics-dashboard';
import { db } from '../../lib/db';

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
    let weekPageviews = 0;
    let tiktokVisits = 0;
    const clicksByComponent: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const today = getDateString();
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];
    
    analyticsSnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = new Date(data.timestamp).toISOString().split('T')[0];
      
      if (data.type === 'pageview') {
        totalPageviews++;
        if (eventDate === today) {
          todayPageviews++;
        }
        
        // Count pageviews from last 7 days
        if (eventDate >= sevenDaysAgoString) {
          weekPageviews++;
        }
        
        // Track all referrers
        const referrer = (data.referrer || '').toLowerCase().trim();
        if (referrer && referrer !== '' && referrer !== 'direct') {
          // Extract domain from URL if it's a full URL
          let source = referrer;
          try {
            if (referrer.startsWith('http')) {
              const url = new URL(referrer);
              source = url.hostname.replace('www.', '');
            }
          } catch {
            // If not a valid URL, keep original referrer
          }
          
          // Aggregate by source
          referrers[source] = (referrers[source] || 0) + 1;
        } else {
          // Track direct visits
          referrers['Direto'] = (referrers['Direto'] || 0) + 1;
        }
        
        // Check if from TikTok for percentage calculation
        if (referrer.includes('tiktok')) {
          tiktokVisits++;
        }
      } else if (data.type === 'click' && data.componentName) {
        // Count only TODAY's clicks for real-time 24h view
        if (eventDate === today) {
          clicksByComponent[data.componentName] = (clicksByComponent[data.componentName] || 0) + 1;
        }
      }
    });
    
    const tiktokPercentage = totalPageviews > 0 
      ? Math.round((tiktokVisits / totalPageviews) * 100) 
      : 0;
    
    const result = {
      totalPageviews,
      todayPageviews,
      weekPageviews,
      clicksByComponent,
      referrers,
      tiktokPercentage,
    };
    
    console.log('✅ [Admin Page] Analytics processed successfully');
    console.log('   Total Pageviews:', result.totalPageviews);
    console.log('   Today:', result.todayPageviews);
    console.log('   This Week:', result.weekPageviews);
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

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
    console.log('🔍 [Admin Page] Fetching analytics from aggregates...');
    
    // Read optimized aggregates (only 2-3 docs instead of hundreds)
    const dailyStatsDoc = await db.collection('analytics_aggregates').doc('daily_stats').get();
    const clickStatsDoc = await db.collection('analytics_aggregates').doc('click_stats').get();
    
    console.log('📊 [Admin Page] Aggregates fetched successfully');
    
    const dailyStats = dailyStatsDoc.data() || {};
    const clickStats = clickStatsDoc.data() || {};
    const today = getDateString();
    
    // Get today's stats
    const todayStats = dailyStats[today] || { pageviews: 0, tiktok_visits: 0 };
    
    // Calculate total pageviews from all days
    let totalPageviews = 0;
    let totalTiktokVisits = 0;
    
    Object.values(dailyStats).forEach((dayData: any) => {
      totalPageviews += dayData.pageviews || 0;
      totalTiktokVisits += dayData.tiktok_visits || 0;
    });
    
    // Get clicks from the last 24 hours ONLY
    const clicksByComponent: Record<string, number> = {};
    const todayClickStats = clickStats[today] || {};
    
    Object.entries(todayClickStats).forEach(([componentName, count]) => {
      clicksByComponent[componentName] = count as number;
    });
    
    const tiktokPercentage = totalPageviews > 0 
      ? Math.round((totalTiktokVisits / totalPageviews) * 100) 
      : 0;
    
    const result = {
      totalPageviews,
      todayPageviews: todayStats.pageviews,
      weekPageviews: 0,
      clicksByComponent,
      referrers: {},
      tiktokPercentage,
    };
    
    console.log('✅ [Admin Page] Analytics processed successfully');
    console.log('   Total Pageviews:', result.totalPageviews);
    console.log('   Today:', result.todayPageviews);
    console.log('   Today Clicks:', Object.keys(clicksByComponent).length, 'components');
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

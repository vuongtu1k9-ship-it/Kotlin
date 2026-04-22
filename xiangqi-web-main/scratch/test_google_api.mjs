import { BetaAnalyticsDataClient } from '@google-analytics/data';
const AnalyticsDataClient = BetaAnalyticsDataClient;
import { google } from 'googleapis';
import fs from 'fs';
import { getAllConfig } from '../server/services/siteConfig.mjs';

async function testInit() {
  const config = await getAllConfig();
  const propertyId = config['google.ga4PropertyId'];
  const siteUrl = config['google.searchConsoleSiteUrl'];
  const jsonStr = config['google.serviceAccountJson'];

  console.log('Config loaded');
  
  if (!propertyId || !siteUrl || !jsonStr) {
    console.log('Missing config');
    return;
  }

  try {
    let credentials;
    if (jsonStr.trim().startsWith('{')) {
      credentials = JSON.parse(jsonStr);
    } else {
      const fileContent = fs.readFileSync(jsonStr.trim(), 'utf8');
      credentials = JSON.parse(fileContent);
    }

    console.log('Credentials parsed');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
      ],
    });

    console.log('Auth object created');

    const sc = google.webmasters({ version: 'v3', auth });
    console.log('Search Console client created:', !!sc);
    
    console.log('Testing SC call...');
    const res = await sc.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['date'],
      },
    });
    console.log('SC call success');

    const analytics = new AnalyticsDataClient({ auth });
    console.log('Analytics client created:', !!analytics);
    
    // Test a simple call
    console.log('Testing GA4 call...');
    const [response] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `7daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
    });
    console.log('GA4 call success');

  } catch (err) {
    console.error('Initialization/Test failed:', err);
  }
}

testInit().catch(console.error);

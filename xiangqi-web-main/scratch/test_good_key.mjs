import { BetaAnalyticsDataClient } from '@google-analytics/data';
const AnalyticsDataClient = BetaAnalyticsDataClient;
import { google } from 'googleapis';
import fs from 'fs';

async function testWithFile() {
  const jsonPath = '/home/hoan/DATA/xiangqi-web/config/secrets/cotuong-xyz-e11c382c3620.json';
  const credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  const propertyId = '392362325';
  const siteUrl = 'sc-domain:cotuong.xyz';

  console.log('Using key from file');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
      ],
    });

    const sc = google.webmasters({ version: 'v3', auth });
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
    console.log('Testing GA4 call...');
    const [response] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `7daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
    });
    console.log('GA4 call success');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testWithFile().catch(console.error);

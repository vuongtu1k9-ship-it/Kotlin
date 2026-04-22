import * as gaData from '@google-analytics/data';
console.log('Keys in @google-analytics/data:', Object.keys(gaData));
console.log('BetaAnalyticsDataClient type:', typeof gaData.BetaAnalyticsDataClient);
if (typeof gaData.BetaAnalyticsDataClient === 'function') {
  try {
    const test = new gaData.BetaAnalyticsDataClient();
    console.log('BetaAnalyticsDataClient is a constructor');
  } catch (e) {
    console.log('BetaAnalyticsDataClient is NOT a constructor:', e.message);
  }
}

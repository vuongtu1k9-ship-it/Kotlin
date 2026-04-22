import gaData from '@google-analytics/data';
console.log('gaData type:', typeof gaData);
console.log('gaData keys:', Object.keys(gaData || {}));
console.log('BetaAnalyticsDataClient:', gaData?.BetaAnalyticsDataClient);

import * as gaDataStar from '@google-analytics/data';
console.log('\ngaDataStar keys:', Object.keys(gaDataStar || {}));
console.log('BetaAnalyticsDataClient (star):', gaDataStar?.BetaAnalyticsDataClient);

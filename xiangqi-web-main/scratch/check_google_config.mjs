import { getAllConfig } from '../server/services/siteConfig.mjs';
import { logger } from '../server/logger.mjs';

async function check() {
  const config = await getAllConfig();
  console.log('Current Google Config:');
  console.log('google.ga4PropertyId:', config['google.ga4PropertyId']);
  console.log('google.searchConsoleSiteUrl:', config['google.searchConsoleSiteUrl']);
  console.log('google.serviceAccountJson (first 20 chars):', config['google.serviceAccountJson']?.substring(0, 20));
  console.log('google.pagespeedApiKey (first 5 chars):', config['google.pagespeedApiKey']?.substring(0, 5));
}

check().catch(console.error);

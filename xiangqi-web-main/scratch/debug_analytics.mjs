import { isGoogleReportingEnabled } from '../server/services/googleReporting.mjs';
import { getConfig, getAllConfig } from '../server/services/siteConfig.mjs';

async function test() {
  console.log('--- Config Check ---');
  const ga4 = await getConfig('google.ga4PropertyId');
  const gsc = await getConfig('google.searchConsoleSiteUrl');
  const json = await getConfig('google.serviceAccountJson');
  const speed = await getConfig('google.pagespeedApiKey');

  console.log('GA4:', ga4);
  console.log('GSC:', gsc);
  console.log('JSON Length:', json?.length);
  console.log('Speed:', speed);

  console.log('\n--- Reporting Enabled Check ---');
  const enabled = await isGoogleReportingEnabled();
  console.log('Enabled:', enabled);
  
  const all = await getAllConfig();
  console.log('\n--- All Config Keys ---');
  console.log(Object.keys(all).filter(k => k.startsWith('google.')));
}

test().catch(console.error);

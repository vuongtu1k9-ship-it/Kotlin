import { google } from 'googleapis';
import fs from 'fs';
import { getAllConfig } from '../server/services/siteConfig.mjs';

async function testPageSpeed() {
  const config = await getAllConfig();
  const apiKey = config['google.pagespeedApiKey'];
  const siteUrl = 'https://cotuong.xyz';
  
  console.log('Testing PageSpeed API...');
  const psi = google.pagespeedonline('v5');
  try {
    const res = await psi.pagespeedapi.runpagespeed({
      url: siteUrl,
      strategy: 'mobile',
      key: apiKey
    });
    console.log('PageSpeed API success, score:', res.data.lighthouseResult?.categories?.performance?.score);
  } catch (err) {
    console.error('PageSpeed API failed:', err.message);
  }
}

testPageSpeed().catch(console.error);

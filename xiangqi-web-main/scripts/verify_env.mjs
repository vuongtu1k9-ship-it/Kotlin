import 'dotenv/config';
import { getConfig } from '../server/services/siteConfig.mjs';

async function verifyConfig() {
    console.log('--- Config Verification ---');
    console.log('FB_PAGE_TOKEN:', await getConfig('facebook.appToken') ? '✅ LOADED' : '❌ MISSING');
    console.log('GOOGLE_REFRESH_TOKEN:', await getConfig('google.refreshToken') ? '✅ LOADED' : '❌ MISSING');
    console.log('TIKTOK_REFRESH_TOKEN:', await getConfig('tiktok.refreshToken') ? '✅ LOADED' : '❌ MISSING');
    console.log('INSTAGRAM_USER_ID:', await getConfig('instagram.userId') ? '✅ LOADED' : '❌ MISSING');
    console.log('TWITTER_API_KEY:', await getConfig('twitter.apiKey') ? '✅ LOADED' : '❌ MISSING');
    console.log('---------------------------');
}

verifyConfig();

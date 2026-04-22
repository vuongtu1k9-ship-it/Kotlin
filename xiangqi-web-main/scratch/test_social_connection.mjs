import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import { google } from 'googleapis';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

async function testConnections() {
  console.log('--- Social Connection Test ---');

  // 1. Facebook
  const fbToken = process.env.FB_PAGE_TOKEN;
  if (fbToken) {
    try {
      const fbRes = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${fbToken}`);
      console.log('✅ Facebook Connection: OK');
      console.log('   Account:', fbRes.data.name, `(${fbRes.data.id})`);
    } catch (e) {
      console.error('❌ Facebook Connection: FAILED');
      console.error('   Error:', e.response?.data || e.message);
    }
  } else {
    console.log('⚠️ Facebook Token missing in .env');
  }

  // 2. Google / YouTube
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (googleClientId && googleClientSecret && googleRefreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(googleClientId, googleClientSecret, 'https://developers.google.com/oauthplayground');
      oauth2Client.setCredentials({ refresh_token: googleRefreshToken });
      const { token } = await oauth2Client.getAccessToken();
      if (token) {
        console.log('✅ YouTube Connection: OK (Access Token Acquired)');
      } else {
        console.log('❌ YouTube Connection: FAILED (No access token)');
      }
    } catch (e) {
      console.error('❌ YouTube Connection: FAILED');
      console.error('   Error:', e.message);
    }
  } else {
    console.log('⚠️ YouTube Credentials missing in .env');
  }

  // 3. TikTok
  const ttKey = process.env.TIKTOK_CLIENT_KEY;
  const ttSecret = process.env.TIKTOK_CLIENT_SECRET;
  const ttRefresh = process.env.TIKTOK_REFRESH_TOKEN;

  if (ttKey && ttSecret && ttRefresh) {
    try {
      const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', 
        new URLSearchParams({
          client_key: ttKey,
          client_secret: ttSecret,
          grant_type: 'refresh_token',
          refresh_token: ttRefresh
        }), 
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      if (response.data.access_token) {
        console.log('✅ TikTok Connection: OK (Access Token Acquired)');
      } else {
        console.log('❌ TikTok Connection: FAILED', response.data);
      }
    } catch (e) {
      console.error('❌ TikTok Connection: FAILED');
      console.error('   Error:', e.response?.data || e.message);
    }
  } else {
    console.log('⚠️ TikTok Credentials missing in .env');
  }

  // 4. Check Social History in DB
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(MONGO_DB);
    const history = await db.collection('social_history').find().sort({ postedAt: -1 }).limit(5).toArray();
    console.log('\n--- Recent Social History ---');
    if (history.length === 0) {
      console.log('No history found.');
    } else {
      history.forEach(h => {
        console.log(`[${h.postedAt || h.createdAt}] [${h.type}] ${h.status} - Platforms: ${h.platforms?.join(', ')}`);
        if (h.results) {
          console.log('   Results:', JSON.stringify(h.results));
        }
      });
    }
  } catch (e) {
    console.error('❌ MongoDB Connection: FAILED', e.message);
  } finally {
    await client.close();
  }
}

testConnections();

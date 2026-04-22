import { google } from 'googleapis';
import 'dotenv/config';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

async function listVideos() {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    const response = await youtube.search.list({
      part: 'snippet',
      forMine: true,
      type: 'video',
      order: 'date',
      maxResults: 50
    });

    console.log('--- LATEST VIDEOS ---');
    response.data.items.forEach(item => {
      console.log(`ID: ${item.id.videoId} | Title: ${item.snippet.title} | Published: ${item.snippet.publishedAt}`);
    });
  } catch (err) {
    console.error('Error listing videos:', err.message);
  }
}

listVideos();

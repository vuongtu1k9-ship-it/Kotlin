import { google } from 'googleapis';
import 'dotenv/config';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

async function listUploads() {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    // 1. Get channel info to find the 'uploads' playlist
    const channelRes = await youtube.channels.list({
      part: 'contentDetails',
      mine: true
    });

    if (!channelRes.data.items?.length) {
      console.log('No channel found');
      return;
    }

    const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;
    console.log(`Uploads Playlist ID: ${uploadsPlaylistId}`);

    // 2. List items in that playlist
    const playlistRes = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: 50
    });

    console.log('--- LATEST UPLOADS ---');
    playlistRes.data.items.forEach(item => {
      console.log(`ID: ${item.snippet.resourceId.videoId} | Title: ${item.snippet.title} | Published: ${item.snippet.publishedAt}`);
    });
  } catch (err) {
    console.error('Error listing uploads:', err.message);
  }
}

listUploads();

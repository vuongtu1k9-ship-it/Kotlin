import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

async function checkYouTubeStatus() {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        console.log('⏳ Checking channel info...');
        const channelRes = await youtube.channels.list({
            part: 'snippet,statistics,status,contentDetails',
            mine: true
        });

        if (channelRes.data.items && channelRes.data.items.length > 0) {
            const channel = channelRes.data.items[0];
            console.log('✅ Channel Found:', channel.snippet.title);
            console.log('📊 Stats:', channel.statistics);
            console.log('🛡️ Status:', channel.status);
            
            console.log('⏳ Checking recent uploads...');
            const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
            const playlistItemsRes = await youtube.playlistItems.list({
                part: 'snippet',
                playlistId: uploadsPlaylistId,
                maxResults: 5
            });

            console.log('🎬 Recent Uploads:');
            playlistItemsRes.data.items.forEach(item => {
                console.log(`- ${item.snippet.title} (${item.snippet.publishedAt})`);
            });
        } else {
            console.log('❌ No channel found for this user.');
        }
    } catch (err) {
        console.error('❌ Failed to check YouTube status:', err.message);
    }
}

checkYouTubeStatus();

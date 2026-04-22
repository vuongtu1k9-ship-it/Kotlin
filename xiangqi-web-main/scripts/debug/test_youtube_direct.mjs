import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing YouTube credentials in .env');
    process.exit(1);
}

async function testYouTubeUpload() {
    console.log('⏳ 1. Initializing OAuth2 Client...');
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const videoPath = path.join(process.cwd(), 'video.mp4');
    
    // Check if video.mp4 exists, if not create a dummy one if ffmpeg is available
    if (!fs.existsSync(videoPath)) {
        console.log('🎥 video.mp4 not found, please ensure it exists.');
        process.exit(1);
    }

    console.log('⏳ 2. Uploading video to YouTube...');
    try {
        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: 'Cờ Tướng Social - Test YouTube Post ' + new Date().toLocaleString(),
                    description: 'Testing automated YouTube upload from xiangqi-web.',
                    categoryId: '20', // Gaming
                    tags: ['cotuong', 'xiangqi', 'test']
                },
                status: {
                    privacyStatus: 'private', // Upload as private for testing
                    selfDeclaredMadeForKids: false
                }
            },
            media: {
                body: fs.createReadStream(videoPath)
            }
        });

        console.log('✅ Success! Video ID:', response.data.id);
        console.log('🔗 URL: https://www.youtube.com/watch?v=' + response.data.id);
    } catch (err) {
        console.error('❌ YouTube upload failed:', err.message);
        if (err.response) {
            console.error('🔍 Details:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testYouTubeUpload();

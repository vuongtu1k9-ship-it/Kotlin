import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

async function testYouTubeShortsUpload() {
    const videoPath = path.join(process.cwd(), 'shorts_video.mp4');
    
    console.log('🎥 Generating vertical video for Shorts...');
    // Create a 15-second vertical video (720x1280)
    const cmd = `ffmpeg -f lavfi -i testsrc=duration=15:size=720x1280:rate=30 -vcodec libx264 -pix_fmt yuv420p -y ${videoPath}`;
    await execPromise(cmd);

    console.log('⏳ 1. Initializing OAuth2 Client...');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    console.log('⏳ 2. Uploading Shorts to YouTube...');
    try {
        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: 'Cờ Tướng Social #Shorts ' + new Date().toLocaleTimeString(),
                    description: 'Testing automated YouTube Shorts upload. #Shorts #xiangqi',
                    categoryId: '20',
                },
                status: {
                    privacyStatus: 'private',
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
        console.error('❌ YouTube Shorts upload failed:', err.message);
        if (err.response) {
            console.error('🔍 Details:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testYouTubeShortsUpload();

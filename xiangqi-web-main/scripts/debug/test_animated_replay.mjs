import { generateGameVideo } from './server/utils/videoGen.mjs';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

async function testAnimatedReplay() {
    console.log('🎬 Generating animated replay...');
    
    // Sample game history (FENs)
    const history = [
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C2C4/9/RNBAKABNR b - - 0 1",
        "rnbakabnr/9/1c2c4/p1p1p1p1p/9/9/P1P1P1P1P/1C2C4/9/RNBAKABNR w - - 0 2"
    ];

    try {
        const videoBuffer = await generateGameVideo(history, {
            width: 1280,
            ratio: '16:9',
            fps: 1,
            format: 'mp4'
        });

        const videoPath = path.join(process.cwd(), 'animated_test.mp4');
        await fs.promises.writeFile(videoPath, videoBuffer);
        console.log('✅ Video generated at:', videoPath);

        console.log('⏳ Uploading to YouTube...');
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: 'Animated Chess Replay Test ' + new Date().toLocaleString(),
                    description: 'Testing high-quality animated replay upload.',
                    categoryId: '20'
                },
                status: {
                    privacyStatus: 'unlisted', // Try unlisted
                    selfDeclaredMadeForKids: false
                }
            },
            media: {
                body: fs.createReadStream(videoPath)
            }
        });

        console.log('✅ Success! Video ID:', response.data.id);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.response) console.error('🔍 Details:', JSON.stringify(err.response.data, null, 2));
    }
}

testAnimatedReplay();

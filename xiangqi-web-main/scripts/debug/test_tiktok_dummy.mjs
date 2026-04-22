import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const clientKey = process.env.TIKTOK_CLIENT_KEY;
const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;

async function getAccessToken() {
    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', 
        new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }), 
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
}

async function testTikTokUpload() {
    const accessToken = await getAccessToken();
    const videoPath = path.join(process.cwd(), 'dummy.mp4');
    const videoBuffer = fs.readFileSync(videoPath);

    console.log('⏳ 1. Initializing TikTok Inbox Upload...');
    try {
        const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', 
            {
                source_info: {
                    source: 'FILE_UPLOAD',
                    video_size: videoBuffer.length,
                    chunk_size: videoBuffer.length,
                    total_chunk_count: 1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }
        );

        if (initResponse.data.error && initResponse.data.error.code !== 'ok') {
            throw new Error(`TikTok Error: ${initResponse.data.error.message}`);
        }

        const { upload_url, publish_id } = initResponse.data.data;
        console.log('✅ Init Success! Publish ID:', publish_id);

        console.log('📤 2. Uploading video...');
        await axios.put(upload_url, videoBuffer, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': videoBuffer.length
            }
        });

        console.log('✅ Upload Success!');
    } catch (err) {
        console.error('❌ TikTok failed:', err.response?.data || err.message);
    }
}

testTikTokUpload();

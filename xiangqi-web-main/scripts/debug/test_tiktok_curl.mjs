import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
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

async function testTikTokUploadWithCurl() {
    const accessToken = await getAccessToken();
    const videoPath = path.join(process.cwd(), 'dummy.mp4');
    const videoSize = fs.statSync(videoPath).size;

    console.log('⏳ 1. Initializing TikTok Inbox Upload...');
    try {
        const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', 
            {
                source_info: {
                    source: 'FILE_UPLOAD',
                    video_size: videoSize,
                    chunk_size: videoSize,
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

        const { upload_url, publish_id } = initResponse.data.data;
        console.log('✅ Init Success! Publish ID:', publish_id);

        console.log('📤 2. Uploading video using CURL...');
        // TikTok API v2 documentation says PUT is used for file upload
        // We use Content-Range for single chunk as well
        const cmd = `curl -v -X PUT "${upload_url}" \
            -H "Content-Type: video/mp4" \
            -H "Content-Length: ${videoSize}" \
            -H "Content-Range: bytes 0-${videoSize-1}/${videoSize}" \
            --data-binary "@${videoPath}"`;
        
        const { stdout, stderr } = await execPromise(cmd);
        console.log('✅ Upload Success (stdout):', stdout);
        console.log('🔍 Debug (stderr):', stderr);

    } catch (err) {
        console.error('❌ TikTok failed:', err.response?.data || err.message);
    }
}

testTikTokUploadWithCurl();

import { getConfig } from './server/services/siteConfig.mjs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './server/logger.mjs';

dotenv.config();

/**
 * Standalone helper to post to Facebook Group
 * Usage: 
 *   node post_to_fb_group.mjs text "Hello world"
 *   node post_to_fb_group.mjs image "Check this out" ./path/to/image.jpg
 *   node post_to_fb_group.mjs video "Watch this" ./path/to/video.mp4 "Video Title"
 */

async function postToGroup() {
    const args = process.argv.slice(2);
    const type = args[0]; // 'text', 'image', 'video'
    const message = args[1];
    const filePath = args[2];
    const title = args[3] || 'Cờ Tướng XYZ';
    const customToken = args[4];

    const groupId = process.env.FB_GROUP_ID;
    const appToken = customToken || process.env.FB_PAGE_TOKEN;

    if (!groupId || !appToken) {
        console.error('❌ Missing FB_GROUP_ID or FB_PAGE_TOKEN in .env');
        return;
    }

    try {
        if (type === 'text') {
            console.log(`🚀 Posting text to group ${groupId}...`);
            const res = await axios.post(`https://graph.facebook.com/v18.0/${groupId}/feed`, null, {
                params: { message, access_token: appToken }
            });
            console.log('✅ Success! ID:', res.data.id);
        } 
        else if (type === 'image') {
            if (!filePath) throw new Error('File path required for image post');
            console.log(`🚀 Posting image ${filePath} to group ${groupId}...`);
            
            const formData = new FormData();
            formData.append('message', message);
            formData.append('access_token', appToken);
            
            const buffer = fs.readFileSync(filePath);
            formData.append('source', new Blob([buffer], { type: 'image/jpeg' }), path.basename(filePath));

            const res = await axios.post(`https://graph.facebook.com/v18.0/${groupId}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('✅ Success! ID:', res.data.id);
        }
        else if (type === 'video') {
            if (!filePath) throw new Error('File path required for video post');
            console.log(`🚀 Posting video ${filePath} to group ${groupId}...`);

            const formData = new FormData();
            formData.append('description', message);
            formData.append('title', title);
            formData.append('access_token', appToken);

            const buffer = fs.readFileSync(filePath);
            formData.append('source', new Blob([buffer], { type: 'video/mp4' }), path.basename(filePath));

            const res = await axios.post(`https://graph-video.facebook.com/v18.0/${groupId}/videos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('✅ Success! ID:', res.data.id);
        }
        else {
            console.log('Usage:');
            console.log('  node post_to_fb_group.mjs text "Message"');
            console.log('  node post_to_fb_group.mjs image "Message" ./path/to/img.jpg');
            console.log('  node post_to_fb_group.mjs video "Message" ./path/to/vid.mp4 "Title"');
        }
    } catch (err) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}

postToGroup();

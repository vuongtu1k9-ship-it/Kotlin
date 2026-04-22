import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

async function testPagePost() {
    const pageId = "2336479353252465"; 
    const token = process.env.FB_PAGE_TOKEN;

    if (!token) {
        console.error('❌ Missing FB_PAGE_TOKEN');
        return;
    }

    console.log(`🚀 Testing official Pages API for Page ${pageId}...`);

    try {
        // Test 1: Text Post
        console.log('📝 Posting text...');
        const res1 = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, null, {
            params: {
                message: "Thử nghiệm hệ thống tự động đăng bài qua Pages API (Official Stream Method).",
                access_token: token
            }
        });
        console.log('✅ Text post success! ID:', res1.data.id);

        // Test 2: Image Post
        const imgPath = './public/logo192.png'; 
        if (fs.existsSync(imgPath)) {
            console.log('🖼️ Posting image via stream...');
            
            // Note: For axios + FormData in Node.js, we should use form-data package or 
            // handle the stream manually. Since we want no extra deps, we'll use a temp file.
            
            const formData = new FormData();
            formData.append('message', 'Ảnh đại diện cờ tướng XYZ (Official Stream Method)');
            formData.append('access_token', token);
            
            // In Node 20+, we can use fs.openAsBlob or just a stream with FormData
            const buffer = fs.readFileSync(imgPath);
            const blob = new Blob([buffer], { type: 'image/png' });
            formData.append('source', blob, 'logo.png');

            const res2 = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/photos`, formData);
            console.log('✅ Image post success! ID:', res2.data.id);
        }

    } catch (err) {
        console.error('❌ Page API Test failed:', err.response?.data || err.message);
    }
}

testPagePost();

import { socialAutomationService } from '../server/services/socialAutomationService.mjs';
import { logger } from '../server/logger.mjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function runFinalTest() {
    console.log('🚀 Initiating Final Social Media Test Upload...');
    
    try {
        const logoBuffer = await fs.promises.readFile(path.join(process.cwd(), 'public/assets/logo.png'));
        const coverBuffer = await fs.promises.readFile(path.join(process.cwd(), 'public/assets/cover.png'));
        
        const message = "🎯 Chào mừng bạn đến với Cờ Tướng XYZ!\n\n" +
                        "Nền tảng chơi cờ tướng trực tuyến hiện đại nhất hiện nay. Trải nghiệm đồ họa đỉnh cao, engine cực mạnh và cộng đồng kỳ thủ sôi động.\n\n" +
                        "👉 Chơi ngay tại: https://cotuong.xyz\n\n" +
                        "#Xiangqi #CoTuong #Gaming #ChessOnline #CoTuongXYZ";

        console.log('--- Posting to Facebook (Page & Group) ---');
        const fbResult = await socialAutomationService.postToFacebook(message, coverBuffer);
        const fbGroupResult = await socialAutomationService.postToFacebookGroup(message, coverBuffer);
        console.log('FB Page Result:', fbResult);
        console.log('FB Group Result:', fbGroupResult);

        console.log('--- Uploading to YouTube (Test Video) ---');
        // Use an existing video file if available
        const videoPath = path.join(process.cwd(), 'shorts_video.mp4');
        if (fs.existsSync(videoPath)) {
            const videoBuffer = await fs.promises.readFile(videoPath);
            const ytResult = await socialAutomationService.postToYouTube("Cờ Tướng XYZ - Đỉnh Cao Trí Tuệ #Shorts", message + "\n\n#Shorts", videoBuffer);
            console.log('YouTube Result:', ytResult);
        } else {
            console.log('YouTube: No test video found at shorts_video.mp4. Skipping.');
        }

        console.log('--- Uploading to TikTok ---');
        const ttVideoPath = path.join(process.cwd(), 'shorts_video.mp4');
        if (fs.existsSync(ttVideoPath)) {
            const ttVideoBuffer = await fs.promises.readFile(ttVideoPath);
            const ttResult = await socialAutomationService.postToTikTok("Trải nghiệm Cờ Tướng XYZ #cotuong", ttVideoBuffer);
            console.log('TikTok Result:', ttResult);
        } else {
            console.log('TikTok: No test video found at shorts_video.mp4. Skipping.');
        }

        console.log('✅ Final Test Upload completed.');
    } catch (err) {
        console.error('❌ Final Test failed:', err.message);
    }
}

runFinalTest();

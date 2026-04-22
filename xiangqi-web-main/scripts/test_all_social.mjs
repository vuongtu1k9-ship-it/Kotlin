import 'dotenv/config';
import { socialAutomationService } from '../server/services/socialAutomationService.mjs';
import { generateBoardImage } from '../server/utils/imageGen.mjs';
import fs from 'fs';
import path from 'path';

async function testAllPlatforms() {
    console.log('🚀 Starting Universal Social Post Test...');
    
    const testContent = `🚀 Test bài đăng đa nền tảng từ hệ thống tự động Cờ Tướng XYZ!
    
    Đây là bài kiểm tra kết nối cho:
    ✅ Facebook Page & Group
    ✅ YouTube Shorts
    ✅ TikTok
    ✅ Instagram Business
    ✅ X.com (Twitter)
    
    Thời gian: ${new Date().toLocaleString()}
    #cotuong #test #automation #xiangqi`;

    try {
        console.log('🎨 Generating test media...');
        const defaultFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
        const imageBuffer = await generateBoardImage(defaultFen, {
            ratio: '16:9',
            width: 1280
        });

        const platforms = ['facebook', 'youtube', 'tiktok', 'instagram', 'x'];
        
        console.log('📤 Sending posts to all platforms...');
        const results = await socialAutomationService.postManual(testContent, platforms, {
            type: 'image',
            buffer: imageBuffer
        });

        console.log('\n📊 TEST RESULTS:');
        console.table(Object.entries(results).map(([platform, id]) => ({
            Platform: platform,
            Status: id ? '✅ SUCCESS' : '❌ FAILED',
            ID: id || 'N/A'
        })));

        if (!results.x) {
            console.log('\n💡 Note: X.com post failed (as expected, OAuth 1.0a not yet implemented).');
        }

    } catch (err) {
        console.error('❌ Critical Test Failure:', err.message);
    }
}

testAllPlatforms();

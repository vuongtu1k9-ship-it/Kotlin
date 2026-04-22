import dotenv from 'dotenv';
import { socialAutomationService } from '../server/services/socialAutomationService.mjs';
import { getDb } from '../server/mongo.mjs';

dotenv.config();

async function testManualPost() {
  console.log('--- Manual Social Post Test ---');
  
  const content = "🚀 Test post from Antigravity AI! Checking social network integration. #xiangqi #cotuong #test";
  const platforms = ['youtube', 'tiktok']; // Facebook is known to be expired
  
  console.log(`Posting to: ${platforms.join(', ')}`);
  
  try {
    // We need to mock some things if we run this outside the server context, 
    // but socialAutomationService should work if we initialize it or just call the method.
    
    // Note: postManual will generate a default image/video if none provided.
    const results = await socialAutomationService.postManual(content, platforms);
    
    console.log('Results:', results);
    
    if (Object.values(results).some(v => v !== null)) {
      console.log('✅ At least one platform succeeded!');
    } else {
      console.log('❌ All platforms failed.');
    }
  } catch (e) {
    console.error('💥 Test failed with error:', e.message);
  } finally {
    // The service might have intervals, but we just want to exit
    process.exit(0);
  }
}

testManualPost();

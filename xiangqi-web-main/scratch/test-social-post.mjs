import { socialAutomationService } from '../server/services/socialAutomationService.mjs';
import { logger } from '../server/logger.mjs';

async function test() {
  await socialAutomationService.init();
  
  const content = 'Test video có nhạc nền - Cờ Tướng XYZ - ' + new Date().toLocaleString();
  const platforms = ['youtube']; // Just YouTube for speed
  
  logger.info('🚀 Starting manual test post from script...');
  const results = await socialAutomationService.postManual(content, platforms);
  console.log('Final Results:', JSON.stringify(results, null, 2));
  process.exit(0);
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

import { socialAutomationService } from './server/services/socialAutomationService.mjs';
import { logger } from './server/logger.mjs';
import dotenv from 'dotenv';

dotenv.config();

async function trigger() {
    console.log('🚀 Triggering manual social post cycle...');
    try {
        // We can call runCycle or specific methods
        // For testing, let's call postLatestPuzzle
        await socialAutomationService.postLatestPuzzle();
        console.log('✅ Cycle completed. Check logs for results.');
    } catch (err) {
        console.error('❌ Trigger failed:', err.message);
    }
}

trigger();

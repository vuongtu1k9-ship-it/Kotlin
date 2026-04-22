import { getUsersCol } from '../server/mongo.mjs';
import { logger } from '../server/logger.mjs';

async function fixBotElo() {
  try {
    const users = await getUsersCol();
    
    // Bots are identified by @cogiai.com domain
    const botPattern = /@cotuong\.xyz$/i;
    
    console.log('[Fix] Searching for bots with high Elo...');
    
    const res = await users.updateMany(
      { email: { $regex: '@cotuong\\.xyz$', $options: 'i' } },
      { $set: { elo: 1200, updatedAt: Date.now() } }
    );
    
    console.log(`[Fix] Successfully reset Elo for ${res.matchedCount} bots to 1200.`);
    process.exit(0);
  } catch (e) {
    console.error('[Fix] Error resetting bot Elo:', e);
    process.exit(1);
  }
}

fixBotElo();

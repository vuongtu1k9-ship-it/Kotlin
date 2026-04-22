import { scoreGameIfNeeded } from '../server/scoring.mjs';
import { closeDb } from '../server/mongo.mjs';

const roomId = process.argv[2];

if (!roomId) {
  console.error('Usage: node scripts/force_score.mjs <roomId>');
  process.exit(1);
}

async function run() {
  console.log(`[ForceScore] Attempting to manually score room: ${roomId}`);
  try {
    const result = await scoreGameIfNeeded(roomId);
    console.log('[ForceScore] Result:', JSON.stringify(result, null, 2));
    if (result.ok) {
      console.log('[ForceScore] SUCCESS! The game has been scored.');
    } else {
      console.warn(`[ForceScore] FAILED! Reason: ${result.error || 'Unknown'}`);
    }
  } catch (err) {
    console.error('[ForceScore] Critical Error:', err);
  } finally {
    await closeDb();
    process.exit(0);
  }
}

run();

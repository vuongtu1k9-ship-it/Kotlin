
import { getBotsCol, getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function purgeBots() {
  try {
    const db = await getDb();
    const botsCol = await getBotsCol();
    const usersCol = db.collection('users');

    console.log('🧹 Purging all bots to enforce SSOT...');

    // Delete from bots collection
    const botDeleteRes = await botsCol.deleteMany({});
    console.log(`✨ Deleted ${botDeleteRes.deletedCount} bots from 'bots' collection.`);

    // Delete bot accounts from users collection
    const userDeleteRes = await usersCol.deleteMany({ role: 'bot' });
    console.log(`✨ Deleted ${userDeleteRes.deletedCount} bot users from 'users' collection.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Purge failed:', err);
    process.exit(1);
  }
}

purgeBots();

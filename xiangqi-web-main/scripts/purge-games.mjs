
import { getGamesCol } from '../server/mongo.mjs';
import { rooms } from '../server/services/roomManager.mjs';

async function purgeGames() {
  try {
    const col = await getGamesCol();
    const res = await col.deleteMany({ status: { $in: ['open', 'started'] } });
    console.log(`--- 🧹 PURGE GAMES ---`);
    console.log(`Deleted ${res.deletedCount} active/open games from DB.`);
    
    // Clear memory cache too
    rooms.clear();
    console.log('In-memory rooms cleared.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

purgeGames();

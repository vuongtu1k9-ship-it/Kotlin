import { getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function run() {
  const db = await getDb();
  const usersCol = db.collection('users');

  // Update users where elo is less than 1200, OR where elo is not set/null
  const result = await usersCol.updateMany(
    {
      $or: [
        { elo: { $lt: 1200 } },
        { elo: { $exists: false } },
        { elo: null }
      ]
    },
    {
      $set: { elo: 1200 }
    }
  );

  logger.log(`Matched ${result.matchedCount} users.`);
  logger.log(`Modified ${result.modifiedCount} users to elo 1200.`);
  process.exit(0);
}

run().catch((e) => {
  logger.error('Error updating elo:', e);
  process.exit(1);
});

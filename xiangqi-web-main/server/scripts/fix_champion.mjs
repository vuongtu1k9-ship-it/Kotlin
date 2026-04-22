import { getDb } from './server/mongo.mjs';
import { logger } from './server/logger.mjs';

async function run() {
  const db = await getDb();
  const tournamentsCol = db.collection('tournaments');
  const usersCol = db.collection('users');

  const tournaments = await tournamentsCol.find({ status: 'finished' }).toArray();
  logger.log(`Checking ${tournaments.length} finished tournaments`);

  for (const t of tournaments) {
    if (t.champion && t.champion.uid) {
      const user = await usersCol.findOne({ uid: t.champion.uid });
      if (user && user.name) {
        logger.log(`Fixing champion name for tournament ${t._id}: ${t.champion.name} -> ${user.name}`);
        await tournamentsCol.updateOne(
          { _id: t._id },
          { $set: { "champion.name": user.name, updatedAt: Date.now() } }
        );
      }
    }
  }
  process.exit(0);
}

run().catch(err => {
  logger.error(err);
  process.exit(1);
});

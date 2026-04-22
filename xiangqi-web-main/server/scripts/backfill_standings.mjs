import { getDb } from './server/mongo.mjs';
import { logger } from './server/logger.mjs';

async function run() {
  const db = await getDb();
  const tournamentsCol = db.collection('tournaments');
  const usersCol = db.collection('users');

  const tournaments = await tournamentsCol.find({ standings: { $exists: true, $ne: [] } }).toArray();
  logger.log(`Found ${tournaments.length} tournaments to check`);

  for (const t of tournaments) {
    let changed = false;
    const newStandings = [];

    for (const s of t.standings) {
      const user = await usersCol.findOne({ uid: s.uid });
      if (user) {
        const newName = user.name || s.uid;
        const newPic = user.picture || null;
        const newElo = user.elo || 1200;
        
        if (s.name !== newName || s.picture !== newPic || s.elo !== newElo) {
          s.name = newName;
          s.picture = newPic;
          s.elo = newElo;
          changed = true;
          logger.log(`Updating metadata for ${s.uid} in tournament ${t._id}`);
        }
      }
      newStandings.push(s);
    }

    if (changed) {
      const update = { standings: newStandings, updatedAt: Date.now() };
      if (t.champion && t.champion.uid) {
        const champUser = await usersCol.findOne({ uid: t.champion.uid });
        if (champUser) {
          update.champion = {
            ...t.champion,
            name: champUser.name || t.champion.uid,
            elo: champUser.elo || 1200
          };
        }
      }

      await tournamentsCol.updateOne({ _id: t._id }, { $set: update });
      logger.log(`Saved updates for tournament ${t._id}`);
    }
  }
  process.exit(0);
}

run().catch(err => {
  logger.error(err);
  process.exit(1);
});

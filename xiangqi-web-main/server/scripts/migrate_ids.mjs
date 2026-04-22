import { MongoClient, ObjectId } from 'mongodb';
import { logger } from '../logger.mjs';
import 'dotenv/config';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

function makeShortId() {
  return Math.random().toString(36).slice(2, 8).toLowerCase();
}

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    logger.log('Connected to MongoDB');
    const db = client.db(MONGO_DB);
    const tcol = db.collection('tournaments');
    const mcol = db.collection('matches');

    const legacyTournamentId = '69c2604ff571998bef6778bc';
    const recentlyCreatedId = 'qt7l71'; // The one we created in previous run
    const legacyGameIds = ['69c26180f571998bef6778be', '69c26180f571998bef6778bf'];

    // 1. Resolve Tournament
    let currentTournamentDoc = await tcol.findOne({ _id: recentlyCreatedId });
    if (!currentTournamentDoc) {
       currentTournamentDoc = await tcol.findOne({ _id: { $in: [new ObjectId(legacyTournamentId), legacyTournamentId] } });
       if (currentTournamentDoc && typeof currentTournamentDoc._id !== 'string') {
          const newId = recentlyCreatedId; // Try to use the same one if possible or make a new one
          logger.log(`Migrating tournament ${currentTournamentDoc._id} -> ${newId}`);
          await tcol.insertOne({ ...currentTournamentDoc, _id: newId });
          await tcol.deleteOne({ _id: currentTournamentDoc._id });
          currentTournamentDoc = await tcol.findOne({ _id: newId });
       }
    }

    if (!currentTournamentDoc) {
      logger.log('No tournament found to migrate.');
    } else {
      logger.log(`Working with tournament: ${currentTournamentDoc._id}`);
    }

    const activeTournamentId = currentTournamentDoc ? currentTournamentDoc._id : recentlyCreatedId;

    // 2. Migrate Games by requested ID
    for (const legacyGameId of legacyGameIds) {
      const gDoc = await mcol.findOne({ _id: { $in: [new ObjectId(legacyGameId), legacyGameId] } });
      if (gDoc && typeof gDoc._id !== 'string') {
        const newGameId = makeShortId();
        logger.log(`Migrating requested match ${gDoc._id} -> ${newGameId}`);
        await mcol.insertOne({ ...gDoc, _id: newGameId, tournamentId: activeTournamentId, updatedAt: Date.now() });
        await mcol.deleteOne({ _id: gDoc._id });
      }
    }

    // 3. Migrate ALL other matches for this tournament
    logger.log(`Searching for any remaining long-ID matches for tournament ${legacyTournamentId} or ${activeTournamentId}...`);
    const criteria = {
      $and: [
        { _id: { $type: 'objectId' } }, // Only migrate if it's still an ObjectId
        { $or: [
          { tournamentId: legacyTournamentId },
          { tournamentId: new ObjectId(legacyTournamentId) },
          { tournamentId: activeTournamentId }
        ]}
      ]
    };
    
    const matches = await mcol.find(criteria).toArray();
    logger.log(`Found ${matches.length} matches to migrate.`);
    for (const m of matches) {
      const newId = makeShortId();
      logger.log(`Migrating match ${m._id} -> ${newId}`);
      await mcol.insertOne({ ...m, _id: newId, tournamentId: activeTournamentId, updatedAt: Date.now() });
      await mcol.deleteOne({ _id: m._id });
    }

    logger.log('Migration process finished.');

  } catch (err) {
    logger.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

run();

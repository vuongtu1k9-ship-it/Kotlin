import { MongoClient, ObjectId } from 'mongodb';
import { logger } from '../logger.mjs';
import 'dotenv/config';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

function makeShortId() {
  return Math.random().toString(36).slice(2, 8).toLowerCase();
}

const ID_MAP = {
  '69c2604ff571998bef6778bc': 'qt7l71'
};

function getShortId(id) {
  const sid = String(id);
  if (ID_MAP[sid]) return ID_MAP[sid];
  if (sid.length === 6) return sid;
  if (/^[0-9a-fA-F]{24}$/.test(sid)) {
    const nid = makeShortId();
    ID_MAP[sid] = nid;
    return nid;
  }
  return sid;
}

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    logger.log('Connected to MongoDB');
    const db = client.db(MONGO_DB);
    
    const gamesCol = db.collection('games');
    const matchesCol = db.collection('matches');
    const movesCol = db.collection('moves');
    const tournamentsCol = db.collection('tournaments');

    // 1. Move everything from games to matches
    const allGames = await gamesCol.find({}).toArray();
    logger.log(`Found ${allGames.length} documents in [games] collection.`);
    
    for (const game of allGames) {
      const oldId = String(game._id);
      const newId = getShortId(oldId);
      
      logger.log(`Migrating game ${oldId} -> ${newId}`);
      
      const newData = { ...game, _id: newId };
      if (game.tournamentId) {
        newData.tournamentId = getShortId(game.tournamentId);
      }
      
      // Update state for consistency
      if (newData.state) {
        newData.state.id = newId;
        if (newData.state.tournamentId) newData.state.tournamentId = getShortId(newData.state.tournamentId);
      }

      await matchesCol.replaceOne({ _id: newId }, newData, { upsert: true });
      
      // If ID changed, update moves
      if (oldId !== newId) {
        const moveUpdate = await movesCol.updateMany({ gameId: oldId }, { $set: { gameId: newId } });
        logger.log(`  Updated ${moveUpdate.modifiedCount} moves.`);
        // Note: unique index (gameId, ply) should still hold
      }
      
      await gamesCol.deleteOne({ _id: game._id });
    }

    // 2. Scan [matches] for any remaining long IDs
    const longIdMatches = await matchesCol.find({ _id: /^[0-9a-fA-F]{24}$/ }).toArray();
    logger.log(`Found ${longIdMatches.length} long IDs in [matches] collection.`);
    for (const game of longIdMatches) {
       const oldId = String(game._id);
       const newId = getShortId(oldId);
       logger.log(`Migrating match ${oldId} -> ${newId}`);
       const newData = { ...game, _id: newId };
       if (game.tournamentId) newData.tournamentId = getShortId(game.tournamentId);
       await matchesCol.insertOne(newData);
       await movesCol.updateMany({ gameId: oldId }, { $set: { gameId: newId } });
       await matchesCol.deleteOne({ _id: game._id });
    }

    logger.log('Migration complete!');
    logger.log('ID Map used:', JSON.stringify(ID_MAP, null, 2));

  } catch (err) {
    logger.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

run();

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'xiangqi';

async function recalculate() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCol = db.collection('users');
    const matchesCol = db.collection('matches');

    console.log('--- 📊 RECALCULATING ELO FROM MATCH HISTORY ---');
    
    const matches = await matchesCol.find({ 
      status: 'finished',
      'state.winner': { $exists: true }
    }).sort({ scoredAt: 1 }).toArray();

    console.log(`Found ${matches.length} finished matches.`);

    const eloMap = new Map();
    const gameCounts = new Map();
    const K = 20;

    for (const match of matches) {
      const redUid = match.playerUids?.red || match.state?.playerUids?.red;
      const blackUid = match.playerUids?.black || match.state?.playerUids?.black;
      const winner = match.state?.winner;
      
      if (!redUid || !blackUid) continue;

      if (!eloMap.has(redUid)) eloMap.set(redUid, 1200);
      if (!eloMap.has(blackUid)) eloMap.set(blackUid, 1200);

      const rElo = eloMap.get(redUid);
      const bElo = eloMap.get(blackUid);

      gameCounts.set(redUid, (gameCounts.get(redUid) || 0) + 1);
      gameCounts.set(blackUid, (gameCounts.get(blackUid) || 0) + 1);

      const expR = 1 / (1 + Math.pow(10, (bElo - rElo) / 400));
      const expB = 1 / (1 + Math.pow(10, (rElo - bElo) / 400));

      let sR = 0.5, sB = 0.5;
      if (winner === 'red') { sR = 1; sB = 0; }
      else if (winner === 'black') { sR = 0; sB = 1; }

      eloMap.set(redUid, Math.round(rElo + K * (sR - expR)));
      eloMap.set(blackUid, Math.round(bElo + K * (sB - expB)));
    }

    console.log('Updating user records...');
    for (const [uid, elo] of eloMap.entries()) {
      await usersCol.updateOne({ uid }, { 
        $set: { 
          elo, 
          gamesPlayed: gameCounts.get(uid) || 0,
          updatedAt: new Date()
        } 
      });
    }

    console.log('--- 🏁 Recalculation Complete ---');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

recalculate();

import { getBotsCol, getUsersCol, getDb } from '../mongo.mjs';

async function run() {
  const botsCol = await getBotsCol();
  const usersCol = await getUsersCol();
  const db = await getDb();
  const matchesCol = db.collection('matches');

  console.log('--- 1. Syncing Bot UIDs from User Records (Server) ---');
  const bots = await botsCol.find({}).toArray();
  const updatedBotUids = new Set();

  for (const bot of bots) {
    // Find the user by email
    const user = await usersCol.findOne({ email: bot.email });
    if (user && user.uid) {
      await botsCol.updateOne({ _id: bot._id }, { $set: { uid: user.uid } });
      console.log(`Synced Bot [${bot.name}] with Real UID [${user.uid}] (Email: ${bot.email})`);
      updatedBotUids.add(user.uid);
    } else {
      console.log(`Warning: Could not find user for bot [${bot.name}] (${bot.email})`);
    }
  }

  console.log('\n--- 2. Initializing All Participants to 1200 ---');
  const eloMap = new Map();
  const matchCounts = new Map();

  // Initialize everyone to 1200
  // Note: We'll also pick up human UIDs as we process matches

  console.log('\n--- 3. Recalculating Elo from History ---');
  const matches = await matchesCol.find({ 
    status: 'finished',
    'state.winner': { $exists: true }
  }).sort({ scoredAt: 1 }).toArray();

  console.log(`Found ${matches.length} decisively finished matches.`);

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

    matchCounts.set(redUid, (matchCounts.get(redUid) || 0) + 1);
    matchCounts.set(blackUid, (matchCounts.get(blackUid) || 0) + 1);

    const expR = 1 / (1 + Math.pow(10, (bElo - rElo) / 400));
    const expB = 1 / (1 + Math.pow(10, (rElo - bElo) / 400));

    let sR = 0.5, sB = 0.5;
    if (winner === 'red') { sR = 1; sB = 0; }
    else if (winner === 'black') { sR = 0; sB = 1; }

    eloMap.set(redUid, Math.round(rElo + K * (sR - expR)));
    eloMap.set(blackUid, Math.round(bElo + K * (sB - expB)));
  }

  console.log('\n--- 4. Updating User Records (Bots & Players) ---');
  let count = 0;
  for (const [uid, finalElo] of eloMap.entries()) {
    const games = matchCounts.get(uid) || 0;
    const isBot = updatedBotUids.has(uid);
    
    // We update everyone's Elo so the system is consistent
    await usersCol.updateOne({ uid }, { $set: { elo: finalElo, gamesPlayed: games } });
    
    if (isBot) {
       console.log(`[BOT] UID ${uid} -> Elo: ${finalElo}, Games: ${games}`);
    }
    count++;
  }

  console.log(`\nSuccessfully recalculated Elo for ${count} unique participants.`);
  process.exit(0);
}
run();

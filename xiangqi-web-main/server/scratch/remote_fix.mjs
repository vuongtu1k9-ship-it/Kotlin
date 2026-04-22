import { getBotsCol, getUsersCol, getDb } from '../mongo.mjs';

async function run() {
  const botsCol = await getBotsCol();
  const usersCol = await getUsersCol();
  const db = await getDb();
  const matchesCol = db.collection('matches');

  console.log('--- 1. Fixing UIDs for Bots on Server ---');
  const bots = await botsCol.find({}).toArray();
  for (const bot of bots) {
    const user = await usersCol.findOne({ email: bot.email });
    if (user) {
      await botsCol.updateOne({ _id: bot._id }, { $set: { uid: user.uid } });
      console.log(`Linked bot ${bot.name} to user uid ${user.uid}`);
    } else {
       console.log(`Warning: No user found for bot ${bot.name} (${bot.email})`);
    }
  }

  console.log('\n--- 2. Recalculating Elo from Matches ---');
  const allBots = await botsCol.find({}).toArray();
  const botUids = new Set(allBots.map(b => b.uid).filter(Boolean));
  const eloMap = new Map();
  const matchCounts = new Map();
  
  for (const uid of botUids) eloMap.set(uid, 1200);

  const matches = await matchesCol.find({ 
    status: 'finished',
    'state.winner': { $exists: true }
  }).sort({ scoredAt: 1 }).toArray();

  console.log(`Found ${matches.length} finished matches with a winner.`);

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

  for (const uid of botUids) {
    const elo = eloMap.get(uid);
    const games = matchCounts.get(uid) || 0;
    await usersCol.updateOne({ uid }, { $set: { elo, gamesPlayed: games } });
    console.log(`Updated Bot UID ${uid}: Elo ${elo}, Games ${games}`);
  }

  console.log('\n--- Done! ---');
  process.exit(0);
}
run();

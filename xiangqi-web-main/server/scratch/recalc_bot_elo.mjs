import { getBotsCol, getUsersCol, getDb } from '../mongo.mjs';

async function recalculate() {
  const db = await getDb();
  const botsCol = await getBotsCol();
  const usersCol = await getUsersCol();
  const matchesCol = db.collection('matches');

  // 1. Load all bots and initialize their Elo to 1200
  const bots = await botsCol.find({}).toArray();
  const botUids = new Set(bots.map(b => b.uid).filter(Boolean));
  const eloMap = new Map(); // uid -> elo
  
  // Initialize everyone we find to 1200
  for (const uid of botUids) eloMap.set(uid, 1200);

  console.log(`[Recalc] Initialized ${botUids.size} bots to 1200 Elo.`);

  // 2. Load all finished matches sorted by time
  const matches = await matchesCol.find({ 
    status: 'finished',
    scoredAt: { $exists: true } 
  }).sort({ scoredAt: 1 }).toArray();

  console.log(`[Recalc] Found ${matches.length} finished matches.`);

  const K = 20;

  const matchCounts = new Map();

  for (const match of matches) {
    const redUid = match.playerUids?.red || match.state?.playerUids?.red;
    const blackUid = match.playerUids?.black || match.state?.playerUids?.black;
    const winner = match.state?.winner; // 'red', 'black', or null (draw)
    
    if (!redUid || !blackUid) continue;

    // Ensure we have an Elo for both (default 1200)
    if (!eloMap.has(redUid)) eloMap.set(redUid, 1200);
    if (!eloMap.has(blackUid)) eloMap.set(blackUid, 1200);

    const redElo = eloMap.get(redUid);
    const blackElo = eloMap.get(blackUid);

    // Track participation
    matchCounts.set(redUid, (matchCounts.get(redUid) || 0) + 1);
    matchCounts.set(blackUid, (matchCounts.get(blackUid) || 0) + 1);

    // Expected scores
    const expRed = 1 / (1 + Math.pow(10, (blackElo - redElo) / 400));
    const expBlack = 1 / (1 + Math.pow(10, (redElo - blackElo) / 400));

    // Actual scores
    let scoreRed = 0.5;
    let scoreBlack = 0.5;
    if (winner === 'red') {
      scoreRed = 1;
      scoreBlack = 0;
    } else if (winner === 'black') {
      scoreRed = 0;
      scoreBlack = 1;
    }

    // New Elos
    const newRedElo = Math.round(redElo + K * (scoreRed - expRed));
    const newBlackElo = Math.round(blackElo + K * (scoreBlack - expBlack));

    if (newRedElo !== redElo || newBlackElo !== blackElo) {
       // console.log(`  Match ${match._id}: Red(${redUid}) ${redElo}->${newRedElo}, Black(${blackUid}) ${blackElo}->${newBlackElo}`);
    }

    eloMap.set(redUid, newRedElo);
    eloMap.set(blackUid, newBlackElo);
  }

  // 3. Update BOTS only in the users collection
  let updatedCount = 0;
  for (const uid of botUids) {
    const finalElo = eloMap.get(uid);
    const games = matchCounts.get(uid) || 0;
    await usersCol.updateOne({ uid }, { $set: { elo: finalElo, gamesPlayed: games } });
    console.log(`[Recalc] Bot: ${uid} -> Elo: ${finalElo}, Games: ${games}`);
    updatedCount++;
  }

  console.log(`[Recalc] Successfully updated ${updatedCount} bots based on match history.`);
  process.exit(0);
}

recalculate();

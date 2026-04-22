import { makeRoomId } from '../services/roomManager.mjs';
import { createInitialState } from '../services/gameState.mjs';
import { getGamesCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';

/**
 * Pairs players for a Swiss tournament round.
 * Tries to avoid repeating previous matchups.
 */
export async function pairSwiss(tournament, nextRound, standings, previousMatches) {
  try {
    const pairs = [];
    const sorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
    const matchedUids = new Set();
    
    // Track previous opponents for each player
    const history = {};
    previousMatches.forEach(m => {
      const r = m.playerUids?.red;
      const b = m.playerUids?.black;
      if (r && b) {
        if (!history[r]) history[r] = new Set();
        if (!history[b]) history[b] = new Set();
        history[r].add(b);
        history[b].add(r);
      }
    });

    const playersToPair = sorted.filter(s => !matchedUids.has(s.uid));
    
    while (playersToPair.length >= 2) {
      const p1 = playersToPair.shift();
      matchedUids.add(p1.uid);

      // Find best target (closest points, not played before)
      let bestIdx = -1;
      for (let i = 0; i < playersToPair.length; i++) {
         const p2Candidate = playersToPair[i];
         if (!history[p1.uid]?.has(p2Candidate.uid)) {
           bestIdx = i;
           break;
         }
      }

      // fallback to first available if no new opponent found
      if (bestIdx === -1) bestIdx = 0;

      const p2 = playersToPair.splice(bestIdx, 1)[0];
      matchedUids.add(p2.uid);
      pairs.push([p1, p2]);
    }

    const byePlayer = playersToPair.length > 0 ? playersToPair[0] : null;
    logger.info(`[TOURNAMENT_SVC] pairSwiss completed: ${pairs.length} pairs, bye: ${byePlayer?.uid || 'none'}`);
    return { pairs, byePlayer };
  } catch (e) {
    logger.error('[TOURNAMENT_SVC] pairSwiss failed:', e.message);
    throw e;
  }
}

/**
 * Pairs players for a Round Robin tournament round using Circle Method.
 */
export function pairRoundRobin(tournament, round, players) {
  const n = players.length;
  if (n < 2) return { pairs: [], byePlayer: null };

  const activePlayers = [...players];
  let dummy = null;
  if (n % 2 !== 0) {
    dummy = { uid: '__dummy__', name: 'BYE' };
    activePlayers.push(dummy);
  }

  const numPlayers = activePlayers.length;
  const rounds = numPlayers - 1;
  const r = (round - 1) % rounds;

  const pairs = [];
  let byePlayer = null;

  for (let i = 0; i < numPlayers / 2; i++) {
    const p1 = activePlayers[i];
    const p2 = activePlayers[numPlayers - 1 - i];

    if (p1.uid === '__dummy__') byePlayer = p2;
    else if (p2.uid === '__dummy__') byePlayer = p1;
    else pairs.push([p1, p2]);
  }

  // Rotate players for next round call (standard circle method)
  // We don't actually rotate the array here because we use 'round' as an offset
  // A better way for Circle Method with offset: 
  // Fixed p[0], rotate p[1...n-1]
  const circle = [activePlayers[0], ...activePlayers.slice(1)];
  const rotation = r;
  const rotated = [circle[0]];
  const rest = circle.slice(1);
  for(let i=0; i<rest.length; i++) {
    rotated.push(rest[(i + rotation) % rest.length]);
  }
  
  // Re-pair using the rotated list
  const finalPairs = [];
  let finalBye = null;
  const len = rotated.length;
  for(let i=0; i < len/2; i++) {
    const p1 = rotated[i];
    const p2 = rotated[len-1-i];
    if (p1.uid === '__dummy__') finalBye = p2;
    else if (p2.uid === '__dummy__') finalBye = p1;
    else finalPairs.push([p1, p2]);
  }

  return { pairs: finalPairs, byePlayer: finalBye };
}

/**
 * Pairs players for Elimination.
 */
export function pairElimination(tournament, standings, previousMatches) {
  // Simple Single Elimination: only players with 0 losses are paired.
  // In our system, standing.losses > 0 means they are out.
  const active = standings.filter(s => (s.played === 0 || s.losses === 0));
  const pairs = [];
  const playersToPair = [...active];
  
  // Sort by points to seed them (roughly)
  playersToPair.sort((a, b) => b.points - a.points);

  while (playersToPair.length >= 2) {
    const p1 = playersToPair.shift();
    const p2 = playersToPair.pop(); // Top vs Bottom seeding
    pairs.push([p1, p2]);
  }

  const byePlayer = playersToPair.length > 0 ? playersToPair[0] : null;
  return { pairs, byePlayer };
}

/**
 * Arena pairing: match anyone available.
 */
export async function pairArena(tournament, standings, currentMatches) {
  try {
    const activeUidsInMatches = new Set();
    currentMatches.forEach(m => {
      if (m.status === 'started') {
        if (m.playerUids?.red) activeUidsInMatches.add(m.playerUids.red);
        if (m.playerUids?.black) activeUidsInMatches.add(m.playerUids.black);
      }
    });

    const available = standings.filter(s => !activeUidsInMatches.has(s.uid));
    const pairs = [];
    const playersToPair = [...available];

    // Randomize a bit to avoid same pairings immediately?
    playersToPair.sort(() => Math.random() - 0.5);

    while (playersToPair.length >= 2) {
      const p1 = playersToPair.shift();
      const p2 = playersToPair.shift();
      pairs.push([p1, p2]);
    }

    if (pairs.length > 0) {
      logger.info(`[TOURNAMENT_SVC] pairArena SUCCESS: Generated ${pairs.length} new matches for tournament ${tournament?._id || 'unknown'}`);
    }
    return { pairs, byePlayer: null };
  } catch (e) {
    logger.error('[TOURNAMENT_SVC] pairArena CRITICAL failure:', e.message);
    throw e;
  }
}

export async function createMatchesForPairs(tournament, round, pairs) {
  const newMatches = [];
  for (const [p1, p2] of pairs) {
    const playerUids = { red: p1.uid, black: p2.uid };
    const playerNames = { red: p1.name || p1.uid, black: p2.name || p2.uid };
    const st = createInitialState({
      timeMode: tournament.timeControl || 'standard',
      tournamentId: tournament._id.toString(),
      playerUids,
      playerNames
    });
    st.isFixed = true;
    st.started = true;

    newMatches.push({
      _id: makeRoomId(),
      tournamentId: tournament._id.toString(),
      tournamentRound: round,
      isFixed: true,
      isRanked: true, // Important for scoring gold and Elo
      status: 'started',
      host: p1.uid,
      playerUids,
      playerNames,
      state: st,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  return newMatches;
}

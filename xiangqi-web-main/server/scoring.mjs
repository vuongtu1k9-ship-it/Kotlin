import { getGamesCol, getUsersCol, getDb, toQueryId } from './mongo.mjs';
import { logger } from './logger.mjs';
import { updateElo } from './elo.mjs';
import { ELO_START } from './users.mjs';
import { logUserActivity, LOG_ACTIONS } from './services/userLogger.mjs';
import * as tournamentService from './services/tournamentService.mjs';
import { clearTournamentCache, clearUserCache } from './services/cache.mjs';

// Points: Win = 3, Draw = 1, Loss = 0
const WIN_PTS = 3;
const DRAW_PTS = 1;
const LOSS_PTS = 0;

const logFail = (err) => logger.error('[SCORING] Activity log failed:', err.message);

export async function scoreGameIfNeeded(gameId) {
  const games = await getGamesCol();
  const game = await games.findOne({ _id: gameId });
  if (!game) return { ok: false, error: 'GAME_NOT_FOUND' };
  if (game.scoredAt) {
    logger.debug(`[SCORING] game ${gameId} already scored at ${game.scoredAt}`);
    return { ok: true, already: true };
  }


  const state = game.state;
  if (!state?.finished) {
    logger.warn(`[scoring] game ${gameId} finish check failed: state.finished=${state?.finished}`);
    return { ok: false, error: 'GAME_NOT_FINISHED' };
  }


  const moveCount = state.moveHistory?.length ?? 0;
  const isForfeit = state.endedBy === 'forfeit';

  if (!isForfeit && (state.endedBy === 'aborted' || moveCount < 1)) {
    logger.info(`[scoring] skip game ${gameId}: moveCount ${moveCount}, endedBy ${state.endedBy}`);
    await games.updateOne({ _id: gameId }, { $set: { scoredAt: Date.now(), scoreError: 'ABORTED' } });
    return { ok: true, aborted: true };
  }

  const redUid = game.playerUids?.red || state.playerUids?.red || null;
  const blackUid = game.playerUids?.black || state.playerUids?.black || null;
  if (!redUid || !blackUid) {
    await games.updateOne({ _id: gameId }, { $set: { scoredAt: Date.now(), scoreError: 'MISSING_PLAYER_UID' } });
    return { ok: false, error: 'MISSING_PLAYER_UID' };
  }

  const winner = state.winner;
  const users = await getUsersCol();
  const now = Date.now();

  let rRed = ELO_START;
  let rBlack = ELO_START;
  let nextRed = ELO_START;
  let nextBlack = ELO_START;

  if (moveCount >= 1) {
    const sRed = winner === 'red' ? 1 : winner === 'black' ? 0 : 0.5;

    // Ensure users exist
    await users.updateOne(
      { uid: redUid },
      { $setOnInsert: { uid: redUid, elo: ELO_START, gamesPlayed: 0, createdAt: now }, $set: { updatedAt: now } },
      { upsert: true }
    );
    await users.updateOne(
      { uid: blackUid },
      { $setOnInsert: { uid: blackUid, elo: ELO_START, gamesPlayed: 0, createdAt: now }, $set: { updatedAt: now } },
      { upsert: true }
    );

    const red = await users.findOne({ uid: redUid });
    const black = await users.findOne({ uid: blackUid });

    rRed = Number(red?.elo ?? ELO_START);
    rBlack = Number(black?.elo ?? ELO_START);
    const gRed = Number(red?.gamesPlayed ?? 0);
    const gBlack = Number(black?.gamesPlayed ?? 0);

    const isPuzzle = !!(game.setupId || state.setupId);
    const isTournament = !!(game.tournamentId || state.tournamentId);
    const isRanked = !isPuzzle && (isTournament || game.isRanked !== false) && game.state?.isRanked !== false && !game.isPrivate;

    logger.debug(`[scoring] rank check: gameId=${gameId}, isPuzzle=${isPuzzle}, isTournament=${isTournament}, game.isRanked=${game.isRanked}, state.isRanked=${game.state?.isRanked}, isPrivate=${game.isPrivate} => isRanked=${isRanked}`);


    let eA, kA, kB;
    if (isRanked) {
      const eloUpdate = updateElo({ rA: rRed, rB: rBlack, sA: sRed, gamesA: gRed, gamesB: gBlack });
      nextRed = eloUpdate.nextA;
      nextBlack = eloUpdate.nextB;
      eA = eloUpdate.eA;
      kA = eloUpdate.kA;
      kB = eloUpdate.kB;
    } else {
      nextRed = rRed;
      nextBlack = rBlack;
      eA = 0.5;
      kA = 0;
      kB = 0;
    }

    // Idempotency guard: mark scoredAt atomically. Use $or to handle missing or null scoredAt
    const res = await games.updateOne(
      { _id: gameId, $or: [{ scoredAt: { $exists: false } }, { scoredAt: null }] },

      {
        $set: {
          scoredAt: now,
          rating: {
            system: 'elo',
            isRanked,
            red: { before: rRed, after: nextRed, expected: eA, k: kA, gain: nextRed - rRed },
            black: { before: rBlack, after: nextBlack, expected: 1 - eA, k: kB, gain: nextBlack - rBlack },
          },
        },
      }
    );
    if (res.matchedCount !== 0) {
      logger.info(`[scoring] game ${gameId} atomic lock acquired. Proceeding with rewards.`);

      const gainRed = nextRed - rRed;
      const gainBlack = nextBlack - rBlack;

      // Gold reward: suppressed for Private rooms; otherwise Winner gets Max(5, EloGain), Loser/Draw gets Max(2, EloGain)
      const baseWin = game.isPrivate ? 0 : 5;
      const baseOther = game.isPrivate ? 0 : 2;
      const coinsRed = winner === 'red' ? Math.max(baseWin, gainRed) : Math.max(baseOther, gainRed);
      const coinsBlack = winner === 'black' ? Math.max(baseWin, gainBlack) : Math.max(baseOther, gainBlack);

      await users.updateOne({ uid: redUid }, { $set: { elo: nextRed, updatedAt: now }, $inc: { gamesPlayed: 1, 'inventory.coins': coinsRed } });
      await users.updateOne({ uid: blackUid }, { $set: { elo: nextBlack, updatedAt: now }, $inc: { gamesPlayed: 1, 'inventory.coins': coinsBlack } });

      // Update presence cache so UI (lobby) reflects new Elo immediately
      try {
        const { setPlayerInfoForUid, getPresenceForUid } = await import('./socket/presence.mjs');
        const { transformUser } = await import('./users.mjs');
        const updatedRed = await users.findOne({ uid: redUid });
        const updatedBlack = await users.findOne({ uid: blackUid });
        
        if (updatedRed) setPlayerInfoForUid(redUid, transformUser(updatedRed));
        if (updatedBlack) setPlayerInfoForUid(blackUid, transformUser(updatedBlack));
      } catch (e) {
        logger.error('[scoring] PlayerInfo cache update failed', e);
      }

      // Invalidate cache
      await clearUserCache(redUid);
      await clearUserCache(blackUid);

      logger.info(`[scoring] game ${gameId} scored: Red(${redUid}) ${rRed}->${nextRed} (+${coinsRed} coins), Black(${blackUid}) ${rBlack}->${nextBlack} (+${coinsBlack} coins)`);

      // --- Activity Logging ---
      const gameResult = { red: winner === 'red' ? 'win' : winner === 'black' ? 'loss' : 'draw', black: winner === 'black' ? 'win' : winner === 'red' ? 'loss' : 'draw' };
      logUserActivity({ uid: blackUid, action: LOG_ACTIONS.COINS_CHANGE, details: { gameId, amount: coinsBlack, reason: 'game_reward' } }).catch(logFail);

      // --- Broadcast the result to the room ---
      try {
        const { getIo } = await import('./socket/presence.mjs');
        const io = getIo();
        if (io) {
          io.to(gameId).emit('game:scored', {
            gameId,
            red: { gain: gainRed, coins: coinsRed, next: nextRed },
            black: { gain: gainBlack, coins: coinsBlack, next: nextBlack }
          });
        }
      } catch (err) {
        logger.error('[scoring] Failed to broadcast game:scored', err);
      }
    } else {
      logger.warn(`[scoring] game ${gameId} atomic lock FAILED. matchedCount=0. Likely already scored by another process.`);
    }
    // Forfeit/Aborted with < 1 moves: mark as scored but skip Elo/Coins
    await games.updateOne(
      { _id: gameId, $or: [{ scoredAt: { $exists: false } }, { scoredAt: null }] },
      { $set: { scoredAt: now, scoreError: 'MINIMAL_MOVES_SKIP_ELO' } }
    );

  }

  // --- Tournament standings auto-update ---
  const tournamentId = game.tournamentId || state.tournamentId;
  if (tournamentId) {
    try {
      await updateTournamentStandings(tournamentId, { redUid, blackUid, winner });
    } catch (e) {
      logger.error('[scoring] updateTournamentStandings failed', tournamentId, e);
    }
  }

  return { ok: true, red: { before: rRed, after: nextRed }, black: { before: rBlack, after: nextBlack } };
}

async function updateTournamentStandings(tournamentId, { redUid, blackUid, winner }) {
  const { ObjectId } = await import('mongodb');
  const db = await getDb();
  const col = db.collection('tournaments');

  const tId = toQueryId(tournamentId);
  if (!tId) return;

  // Determine points for each player
  let redPts, blackPts, redWin, blackWin, draw;
  if (winner === 'red') {
    redPts = WIN_PTS; blackPts = LOSS_PTS;
    redWin = 1; blackWin = 0; draw = 0;
  } else if (winner === 'black') {
    redPts = LOSS_PTS; blackPts = WIN_PTS;
    redWin = 0; blackWin = 1; draw = 0;
  } else {
    // draw
    redPts = DRAW_PTS; blackPts = DRAW_PTS;
    redWin = 0; blackWin = 0; draw = 1;
  }

  // Update arrayFilters for red player
  await col.updateOne(
    { _id: tId, 'standings.uid': redUid },
    {
      $inc: {
        'standings.$.points': redPts,
        'standings.$.played': 1,
        'standings.$.wins': redWin,
        'standings.$.draws': draw,
        'standings.$.losses': blackWin, // red loss = black win
      },
      $set: { updatedAt: Date.now() }
    }
  );

  // Update arrayFilters for black player
  await col.updateOne(
    { _id: tId, 'standings.uid': blackUid },
    {
      $inc: {
        'standings.$.points': blackPts,
        'standings.$.played': 1,
        'standings.$.wins': blackWin,
        'standings.$.draws': draw,
        'standings.$.losses': redWin, // black loss = red win
      },
      $set: { updatedAt: Date.now() }
    }
  );

  // --- Arena Auto-pairing ---
  const doc = await col.findOne({ _id: tId });
  if (doc && doc.format === 'arena' && doc.status === 'active') {
    try {
      const gamesCol = await getGamesCol();
      const currentMatches = await gamesCol.find({ tournamentId: tournamentId.toString(), status: 'started' }).toArray();
      const { pairs } = await tournamentService.pairArena(doc, doc.standings, currentMatches);
      const newMatches = await tournamentService.createMatchesForPairs(doc, doc.currentRound || 1, pairs);
      if (newMatches.length > 0) {
        await gamesCol.insertMany(newMatches);
        await clearTournamentCache();
        try {
          const { getIo } = await import('./socket/presence.mjs');
          const io = getIo();
          if (io) io.emit('tournaments:update');
        } catch (err) { logger.error('[TOURNAMENT_SVC] Arena socket broadcast failed:', err.message); }
      }
    } catch (err) {
      logger.error('[TOURNAMENT_SVC] Arena auto-pairing exception:', err.message);
    }
  }

  logger.info(`[SCORING] Tournament ${tournamentId} standings updated: red(${redUid})=${redPts}pts, black(${blackUid})=${blackPts}pts`);
}

export async function distributeTournamentPrizes(tournamentId) {
  const db = await getDb();
  const col = db.collection('tournaments');
  const tId = toQueryId(tournamentId);
  const doc = await col.findOne({ _id: tId });
  if (!doc || !doc.prizes || doc.prizes.length === 0) return;

  const standings = [...(doc.standings || [])].sort((a, b) => b.points - a.points || b.wins - a.wins);
  if (standings.length === 0) return;

  const users = await getUsersCol();
  const now = Date.now();

  for (const prize of doc.prizes) {
    const rank = Number(prize.rank);
    if (isNaN(rank) || rank < 1 || rank > standings.length) continue;

    const winner = standings[rank - 1];
    if (!winner?.uid) continue;

    const update = { $set: { updatedAt: now }, $inc: {} };
    
    // Support new prize structure (coins + items array)
    if (prize.coins && prize.coins > 0) {
      update.$inc['inventory.coins'] = Number(prize.coins);
    }
    if (Array.isArray(prize.items)) {
      prize.items.forEach(it => {
        if (it.id && it.quantity > 0) {
          update.$inc[`inventory.${it.id}`] = Number(it.quantity);
        }
      });
    }

    // Support legacy prize structure for backward compatibility
    if (prize.type === 'coins' && prize.quantity) {
      update.$inc['inventory.coins'] = (update.$inc['inventory.coins'] || 0) + Number(prize.quantity);
    } else if (prize.type === 'item' && prize.itemId) {
      update.$inc[`inventory.${prize.itemId}`] = (update.$inc[`inventory.${prize.itemId}`] || 0) + Number(prize.quantity || 1);
    }

    // Only update if there's actually something to $inc
    if (Object.keys(update.$inc).length > 0) {
      await users.updateOne({ uid: winner.uid }, update);
      await clearUserCache(winner.uid);
      logger.info(`[scoring] Prizes distributed to ${winner.uid} for Rank ${rank}: coins=${update.$inc['inventory.coins'] || 0}, items=${JSON.stringify(prize.items || [])}`);
    }
  }
}

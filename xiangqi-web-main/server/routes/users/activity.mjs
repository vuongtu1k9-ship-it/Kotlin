import express from 'express';
import { logger } from '../../logger.mjs';
import { getUsersCol, getGamesCol, getPuzzleSolutionsCol, getPuzzlesCol } from '../../mongo.mjs';
import { ObjectId } from 'mongodb';
import { requireUser } from '../../utils/auth.mjs';
import { redisClient } from '../../services/cache.mjs';
import { attachThumbnailsToGames } from '../../services/thumbnailHelper.mjs';
import { safeString, safeNumber } from '../../utils/security.mjs';
import { resolveUser } from '../../utils/userHelpers.mjs';
import { getParticipantFilter, getGameStatus, fetchPlayerSummaries, getPlayerNames, getPlayerUids } from '../../utils/gameHelpers.mjs';

const router = express.Router();

router.get('/me/active-game', requireUser, async (req, res) => {
  try {
    const { findActiveRoomForUid } = await import('../../services/roomManager.mjs');
    const roomId = await findActiveRoomForUid(req.user.uid);
    res.json({ ok: true, roomId });
  } catch (e) {
    logger.error('[USERS] /me/active-game failed:', e);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

router.get('/users/:id/games', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    const limit = safeNumber(req.query?.limit, 50);
    const validLimit = Math.max(1, Math.min(200, limit));
    const games = await getGamesCol();

    const u = await resolveUser(id);
    const uid = u ? u.uid : id;

    const reqUser = await requireUser(req);
    const requesterUid = reqUser?.uid || null;
    const isParticipant = requesterUid === uid;
    const playerFilter = getParticipantFilter(uid, isParticipant);

    const docs = await games
      .find(playerFilter,
        { projection: { _id: 1, status: 1, timeMode: 1, updatedAt: 1, createdAt: 1, state: 1, position: 1, lastposition: 1, isPrivate: 1, players: 1 } }
      )
      .sort({ updatedAt: -1 })
      .limit(validLimit)
      .toArray();
    
    const uidsToFetch = new Set();
    docs.forEach(d => {
      const uids = getPlayerUids(d);
      if (uids.red) uidsToFetch.add(String(uids.red));
      if (uids.black) uidsToFetch.add(String(uids.black));
    });
    const playerSummaries = await fetchPlayerSummaries(Array.from(uidsToFetch));
    await attachThumbnailsToGames(docs);

    const list = docs.map((d) => {
      const ps = getPlayerUids(d);
      const st = d.state || {};
      const status = getGameStatus(d);
      const pNames = getPlayerNames(d);
      return {
        gameId: d._id,
        status,
        timeMode: d.timeMode || st.timeMode || 'standard',
        finished: status === 'finished',
        winner: st.winner ?? null,
        endedBy: st.endedBy ?? null,
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
        thumbBoard: d.thumbBoard ?? null,
        thumbPosition: d.thumbPosition ?? null,
        players: {
          redUid: ps.red || null,
          blackUid: ps.black || null,
          redName: pNames.red || pNames.redName || playerSummaries.get(String(ps.red))?.name || (ps.red ? 'Kỳ thủ' : null),
          blackName: pNames.black || pNames.blackName || playerSummaries.get(String(ps.black))?.name || (ps.black ? 'Kỳ thủ' : null),
        }
      };
    });

    return res.json({ ok: true, games: list });
  } catch (e) {
    logger.debug('GET /users/:id/games failed', e);
    return res.status(500).json({ ok: false, error: 'USER_GAMES_FAILED' });
  }
});

router.get('/users/:id/solves', async (req, res) => {
  try {
    const id = safeString(req.params.id).toLowerCase();
    const users = await getUsersCol();
    const solutionsCol = await getPuzzleSolutionsCol();
    const puzzlesCol = await getPuzzlesCol();

    const u = await users.findOne({ $or: [ { uid: id }, { slug: id } ] });
    const uid = u ? u.uid : id;

    const cacheKey = `user:solves:${uid}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    const solutions = await solutionsCol.find({ userId: uid }).sort({ createdAt: -1 }).limit(100) .toArray();
    const puzzleIds = solutions.map(s => s.puzzleId);
    if (puzzleIds.length === 0) return res.json({ ok: true, solves: [] });

    const puzzles = await puzzlesCol.find({
      $or: [
        { uid: { $in: puzzleIds } },
        { _id: { $in: puzzleIds.filter(pid => pid.length === 24 && ObjectId.isValid(pid)).map(pid => new ObjectId(pid)) } }
      ]
    }).toArray();

    const result = solutions.map(sol => {
      const p = puzzles.find(puz => puz.uid === sol.puzzleId || String(puz._id) === sol.puzzleId);
      return {
        uid: sol.puzzleId,
        solvedAt: sol.createdAt,
        moveCount: sol.moveCount,
        puzzleName: p?.name || 'Thế cờ ẩn',
        level: p?.level,
        thumbBoard: Array.isArray(p?.board) ? p.board : null
      };
    });

    const response = { ok: true, solves: result };
    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }
    return res.json(response);
  } catch (e) {
    logger.error('GET /users/:id/solves failed', e);
    return res.status(500).json({ ok: false, error: 'SOLVES_FAILED' });
  }
});

router.get('/users/:uid1/vs/:uid2', async (req, res) => {
  try {
    const u1 = safeString(req.params.uid1).toLowerCase();
    const u2 = safeString(req.params.uid2).toLowerCase();
    const games = await getGamesCol();
    const users = await getUsersCol();
    const user1 = await users.findOne({ $or: [{ uid: u1 }, { slug: u1 }] });
    const user2 = await users.findOne({ $or: [{ uid: u2 }, { slug: u2 }] });
    const finalU1 = user1?.uid || u1;
    const finalU2 = user2?.uid || u2;

    const uids1 = [finalU1];
    const uids2 = [finalU2];
    try { if (finalU1.length === 24) uids1.push(new ObjectId(finalU1)); } catch(e){ }
    try { if (finalU2.length === 24) uids2.push(new ObjectId(finalU2)); } catch(e){ }

    const isBot1 = user1?.role === 'bot' || user1?.isBot;
    const isBot2 = user2?.role === 'bot' || user2?.isBot;

    const filter = {
      $or: [ { status: 'finished' }, { 'state.finished': true } ],
      $and: [
        {
          $or: [
            { 'playerUids.red': { $in: uids1 }, 'playerUids.black': { $in: uids2 } },
            { 'playerUids.red': { $in: uids2 }, 'playerUids.black': { $in: uids1 } },
            { 'state.playerUids.red': { $in: uids1 }, 'state.playerUids.black': { $in: uids2 } },
            { 'state.playerUids.red': { $in: uids2 }, 'state.playerUids.black': { $in: uids1 } },
            (isBot1 && isBot2) ? { 'playerNames.red': user1.name, 'playerNames.black': user2.name } : null,
            (isBot1 && isBot2) ? { 'playerNames.red': user2.name, 'playerNames.black': user1.name } : null,
            (isBot1 && !isBot2) ? { 'playerNames.red': user1.name, 'playerUids.black': { $in: uids2 } } : null,
            (isBot1 && !isBot2) ? { 'playerNames.black': user1.name, 'playerUids.red': { $in: uids2 } } : null,
            (!isBot1 && isBot2) ? { 'playerNames.red': user2.name, 'playerUids.black': { $in: uids1 } } : null,
            (!isBot1 && isBot2) ? { 'playerNames.black': user2.name, 'playerUids.red': { $in: uids1 } } : null,
          ].filter(Boolean)
        }
      ]
    };

    const projection = {
      _id: 1, 'state.winner': 1, 'state.playerUids': 1, 'state.playerNames': 1,
      playerUids: 1, playerNames: 1, players: 1, title: 1, puzzleName: 1, createdAt: 1, updatedAt: 1
    };

    const result = await games.aggregate([
      { $match: filter },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null, total: { $sum: 1 },
                u1Wins: { $sum: { $cond: [ { $eq: [ { $switch: { branches: [ { case: { $eq: ["$state.winner", "red"] }, then: { $ifNull: ["$playerUids.red", "$state.playerUids.red"] } }, { case: { $eq: ["$state.winner", "black"] }, then: { $ifNull: ["$playerUids.black", "$state.playerUids.black"] } } ], default: null } }, finalU1 ] }, 1, 0 ] } },
                u2Wins: { $sum: { $cond: [ { $eq: [ { $switch: { branches: [ { case: { $eq: ["$state.winner", "red"] }, then: { $ifNull: ["$playerUids.red", "$state.playerUids.red"] } }, { case: { $eq: ["$state.winner", "black"] }, then: { $ifNull: ["$playerUids.black", "$state.playerUids.black"] } } ], default: null } }, finalU2 ] }, 1, 0 ] } },
                draws: { $sum: { $cond: [{ $not: ["$state.winner"] }, 1, 0] } }
              }
            }
          ],
          recentGames: [ { $sort: { updatedAt: -1 } }, { $limit: 10 }, { $project: projection } ]
        }
      }
    ]).toArray();

    const stats = result[0]?.stats[0] || { total: 0, u1Wins: 0, u2Wins: 0, draws: 0 };
    delete stats._id;

    const recentGames = (result[0]?.recentGames || []).map(g => {
      const ps = g.playerUids || g.state?.playerUids || {};
      const pNames = g.playerNames || g.state?.playerNames || g.players || {};
      return {
        gameId: g._id, title: g.title, puzzleName: g.puzzleName, winner: g.state?.winner, playerUids: ps,
        playerNames: { red: pNames.red || pNames.redName || 'Kỳ thủ Đỏ', black: pNames.black || pNames.blackName || 'Kỳ thủ Đen' },
        createdAt: g.createdAt, updatedAt: g.updatedAt
      };
    });

    return res.json({ ok: true, stats, recentGames });
  } catch (e) {
    logger.error('GET /users/:uid1/vs/:uid2 failed', e);
    return res.status(500).json({ ok: false, error: 'H2H_FAILED' });
  }
});

export default router;

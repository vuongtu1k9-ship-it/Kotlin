import express from 'express';
import { logger } from '../logger.mjs';
import { getGamesCol, getMovesCol, getDb, getMessagesCol } from '../mongo.mjs';
import { redisClient, checkRateLimit } from '../services/cache.mjs';
import { rooms, hydrateFromDb, getRoomSummary, findActiveRoomForUid } from '../services/roomManager.mjs';
import { getConfig } from '../services/siteConfig.mjs';
import { getIo } from '../socket/presence.mjs';
import { requireUser } from '../utils/auth.mjs';
import { attachThumbnailsToGames } from '../services/thumbnailHelper.mjs';
import { clearGamesCache, clearSingleGameCache } from '../services/cache.mjs';
import { getMaterial } from '../moveLogic.mjs';
import { safeString, safeNumber, sanitizeHtml } from '../utils/security.mjs';
import { getRealIp } from '../utils/ip.mjs';
import { getGameStatus, getPlayerUids, fetchPlayerSummaries, getPlayerNames } from '../utils/gameHelpers.mjs';

const router = express.Router();

router.get('/my-active', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    const uid = String(user.uid);
    const roomId = await findActiveRoomForUid(uid);
    return res.json({ ok: true, roomId });
  } catch (e) {
    logger.error('GET /games/my-active failed', e);
    return res.status(500).json({ ok: false, error: 'ACTIVE_CHECK_FAILED' });
  }
});

router.get('/', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(1000, safeNumber(req.query?.limit, 100)));
    const status = safeString(req.query?.status, 'all');
    const cursor = req.query?.cursor != null ? safeNumber(req.query.cursor, null) : null;
    const timeMode = safeString(req.query?.timeMode, 'all');
    const timeRange = safeString(req.query?.timeRange, 'all');
    const materialStr = safeString(req.query?.material);
    const sort = safeString(req.query?.sort, 'newest'); // 'newest', 'popular', 'spectators'

    const idsFilter = String(req.query?.ids || '').split(',').filter(Boolean);
    const cacheKey = `games:v1:${status}:${limit}:${cursor || 'start'}:${timeMode}:${timeRange}:${sort}:${materialStr}:${idsFilter.join(',')}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) {
        logger.error('[redis] GET error', e);
      }
    }

    const q = {};
    if (idsFilter.length > 0) {
      q._id = { $in: idsFilter };
    } else {
      if (status !== 'all') q.status = status;
      const setupId = req.query?.setupId;
      if (setupId) q.setupId = String(setupId);
      
      if (timeMode !== 'all') q.timeMode = timeMode;
      
      if (timeRange !== 'all') {
        const now = Date.now();
        let threshold = 0;
        if (timeRange === 'day') threshold = now - 24 * 60 * 60 * 1000;
        if (timeRange === 'week') threshold = now - 7 * 24 * 60 * 60 * 1000;
        if (timeRange === 'month') threshold = now - 30 * 24 * 60 * 60 * 1000;
        if (threshold > 0) q.createdAt = { $gte: threshold };
      }

      if (materialStr) {
        materialStr.split(',').forEach(p => {
          const [k, v] = p.split(':');
          if (k && v != null) q[`material.${k}`] = Number(v);
        });
      }

      // Never expose private games publicly
      q.isPrivate = { $ne: true };
    }
    if (cursor != null && Number.isFinite(cursor)) q.createdAt = { $lt: cursor };

    const sortConfig = {};
    if (sort === 'popular') sortConfig.likeCount = -1;
    else if (sort === 'spectators') sortConfig.spectatorCount = -1;
    sortConfig.createdAt = -1;

    const gamesCol = await getGamesCol();
    const docs = await gamesCol
      .find(q, {
        projection: {
          _id: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          playerUids: 1,
          state: 1,
          position: 1,
          lastposition: 1,
          timeMode: 1,
          spectatorCount: 1,
          likeCount: 1,
          material: 1,
        },
      })
      .sort(sortConfig)
      .skip(0) // Cursor still used for pagination
      .limit(limit)
      .toArray();

    if (docs.length === 0) {
      logger.info(`[GAMES] No games found matching query: ${JSON.stringify(q)}`);
    } else {
      logger.debug(`[GAMES] Found ${docs.length} games for query`);
    }

    const ids = docs.map((d) => String(d._id));

    // Best-effort move counts (imported games may not have state.moveHistory)
    const moveCountByGameId = new Map();
    if (ids.length) {
      try {
        const movesCol = await getMovesCol();
        const agg = await movesCol
          .aggregate([
            { $match: { gameId: { $in: ids } } },
            { $group: { _id: '$gameId', maxPly: { $max: '$ply' } } },
          ])
          .toArray();
        for (const row of agg) moveCountByGameId.set(String(row._id), Number(row.maxPly || 0));
      } catch (e) {
        logger.error('GET /games moveCount aggregate failed', e);
      }
    }

    await attachThumbnailsToGames(docs);
    
    const uidsToFetch = new Set();
    docs.forEach(d => {
      const uids = getPlayerUids(d);
      if (uids.red) uidsToFetch.add(String(uids.red));
      if (uids.black) uidsToFetch.add(String(uids.black));
    });
    const playerSummaries = await fetchPlayerSummaries(Array.from(uidsToFetch));

    const items = docs.map((d) => {
      const roomId = String(d._id);
      const st = d.state || {};
      const statusVal = getGameStatus(d);
      const finished = statusVal === 'finished';
      const started = statusVal === 'started' || finished;
      const playerUids = getPlayerUids(d);
      const moveCount = moveCountByGameId.get(roomId) ?? Number(st.serverMoveIndex ?? st.moveHistory?.length ?? 0);

      const memRoom = rooms.get(roomId);
      const spectatorCount = memRoom?.spectators ? memRoom.spectators.size : (d.spectators || 0);

      const finalPlayerUids = memRoom ? memRoom.playerUids : playerUids;
      const finalPlayerNames = memRoom ? memRoom.playerNames : getPlayerNames(d);

      return {
        roomId,
        status: statusVal,
        started: memRoom ? !!memRoom.started : started,
        finished: memRoom ? !!memRoom.finished : finished,
        winner: (memRoom ? memRoom.winner : st.winner) ?? null,
        endedBy: (memRoom ? memRoom.endedBy : st.endedBy) ?? null,
        players: { 
          red: Boolean(finalPlayerUids?.red), 
          black: Boolean(finalPlayerUids?.black),
          redName: finalPlayerNames?.red || playerSummaries.get(String(finalPlayerUids?.red))?.name || (finalPlayerUids?.red ? 'Kỳ thủ' : null),
          blackName: finalPlayerNames?.black || playerSummaries.get(String(finalPlayerUids?.black))?.name || (finalPlayerUids?.black ? 'Kỳ thủ' : null),
          redUid: finalPlayerUids?.red || null,
          blackUid: finalPlayerUids?.black || null,
        },
        spectators: spectatorCount,
        moveCount,
        updatedAt: Number(d.updatedAt ?? 0),
        createdAt: Number(d.createdAt ?? 0),
        thumbPosition: d.thumbPosition,
        thumbBoard: d.thumbBoard,
        likeCount: d.likeCount || 0,
        setupId: d.setupId || d.state?.setupId || null,
        puzzleName: d.puzzleName || d.state?.puzzleName || null,
      };
    });

    const response = { ok: true, games: items, nextCursor: (docs.length === limit) ? docs[docs.length - 1].createdAt : null };

    if (redisClient?.isReady) {
      try {
        // Finished games list can be cached for longer (1 hour) as it's invalidated on saveRoom
        const ttl = status === 'finished' ? 3600 : 30;
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(response));
      } catch (e) {
        logger.error('[redis] SET error', e);
      }
    }

    return res.json(response);
  } catch (e) {
    logger.error('GET /games failed', e);
    return res.status(500).json({ ok: false, error: 'GAMES_FAILED' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'BAD_ID' });

    const cacheKey = `game:view:${id}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} failed`, e); }
    }

    const gamesCol = await getGamesCol();
    const doc = await gamesCol.findOne({ _id: id });
    if (!doc) {
      logger.warn(`[GAMES] Game NOT FOUND in database for id: ${id}`, {
        ip: getRealIp(req),
        ua: req.get('user-agent'),
        path: req.path
      });
      return res.status(404).json({ ok: false, error: 'GAME_NOT_FOUND' });
    }
    logger.debug(`[GAMES] Successfully fetched game ${id}`);

    // Ensure setupId and puzzleName are at top level for easy frontend access
    if (doc.state?.setupId && !doc.setupId) doc.setupId = doc.state.setupId;
    if (doc.state?.puzzleName && !doc.puzzleName) doc.puzzleName = doc.state.puzzleName;

    const response = { ok: true, game: doc };
    if (redisClient?.isReady && doc.status === 'finished') {
      try { await redisClient.setEx(cacheKey, 604800, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }

    // Include likeCount explicitly if not in doc
    if (doc.likeCount === undefined) doc.likeCount = 0;

    return res.json(response);
  } catch (e) {
    logger.error('GET /games/:id failed', e);
    return res.status(500).json({ ok: false, error: 'GAME_FAILED' });
  }
});

router.get('/:id/moves', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim().toLowerCase();
    if (!id) return res.status(400).json({ ok: false, error: 'BAD_ID' });
    const limit = Math.max(1, Math.min(2000, Number(req.query?.limit || 2000)));

    const cacheKey = `game:moves:${id}:${limit}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} failed`, e); }
    }

    const gamesCol = await getGamesCol();
    const game = await gamesCol.findOne({ _id: id });
    if (!game) {
      logger.warn(`GET /games/:id/moves - Game not found: ${id}`, {
        ip: getRealIp(req),
        ua: req.get('user-agent')
      });
      return res.status(404).json({ ok: false, error: 'GAME_NOT_FOUND' });
    }

    const movesCol = await getMovesCol();
    const list = await movesCol
      .find({ gameId: id }, { projection: { _id: 0 } })
      .sort({ ply: 1 })
      .limit(limit)
      .toArray();

    const response = { ok: true, roomId: id, moves: list };
    if (redisClient?.isReady && game.status === 'finished') {
      try { await redisClient.setEx(cacheKey, 604800, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    logger.error('GET /games/:id/moves failed', e);
    return res.status(500).json({ ok: false, error: 'MOVES_FAILED' });
  }
});

// GET /games/likes/mine
router.get('/likes/mine', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    const db = await getDb();
    const likesCol = db.collection('game_likes');
    const docs = await likesCol.find({ uid: String(user.uid) }).toArray();
    
    return res.json({
      ok: true,
      likes: docs.map(d => String(d.gameId))
    });
  } catch (e) {
    logger.error('GET /games/likes/mine failed', e);
    return res.status(500).json({ ok: false, error: 'GET_LIKES_FAILED' });
  }
});

// POST /games/like/:id
router.post('/like/:id', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    const id = safeString(req.params.id);
    const uid = safeString(user.uid);
    const db = await getDb();
    const gamesCol = await getGamesCol();
    const likesCol = db.collection('game_likes');

    const game = await gamesCol.findOne({ _id: id });
    if (!game) return res.status(404).json({ ok: false, error: 'GAME_NOT_FOUND' });

    const existing = await likesCol.findOne({ uid, gameId: id });
    let liked = false;
    let newCount = game.likeCount || 0;

    if (existing) {
      // Unlike
      await likesCol.deleteOne({ _id: existing._id });
      newCount = Math.max(0, newCount - 1);
      await gamesCol.updateOne({ _id: id }, { $set: { likeCount: newCount } });
    } else {
      // Like
      await likesCol.insertOne({ uid, gameId: id, likedAt: Date.now() });
      newCount += 1;
      await gamesCol.updateOne({ _id: id }, { $set: { likeCount: newCount } });
      liked = true;
    }

    // Invalidate caches
    await clearSingleGameCache(id);
    await clearGamesCache();

    return res.json({ ok: true, liked, likeCount: newCount });
  } catch (e) {
    logger.error('POST /games/like/:id failed', e);
    return res.status(500).json({ ok: false, error: 'TOGGLE_LIKE_FAILED' });
  }
});


// POST /games/:id/rename  — winner only
router.post('/:id/rename', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    const id = String(req.params.id || '').trim().toLowerCase();
    const title = String(req.body?.title || '').trim().slice(0, 120);
    if (!title) return res.status(400).json({ ok: false, error: 'TITLE_REQUIRED' });

    const gamesCol = await getGamesCol();
    const doc = await gamesCol.findOne({ _id: id });
    if (!doc) return res.status(404).json({ ok: false, error: 'GAME_NOT_FOUND' });

    const playerUids = doc.playerUids || doc.state?.playerUids || {};
    const winner = doc.state?.winner || null;
    const winnerUid = winner ? playerUids[winner] : null;

    if (winnerUid !== user.uid) {
      return res.status(403).json({ ok: false, error: 'ONLY_WINNER_CAN_RENAME' });
    }

    await gamesCol.updateOne({ _id: id }, { $set: { title, updatedAt: Date.now() } });
    // Invalidate cache
    await clearSingleGameCache(id);
    return res.json({ ok: true, title });
  } catch (e) {
    logger.error('PATCH /games/:id/rename failed', e);
    return res.status(500).json({ ok: false, error: 'RENAME_FAILED' });
  }
});

// POST /games/:id/publish  — players only (lift private)
router.post('/:id/publish', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    const id = String(req.params.id || '').trim().toLowerCase();

    const gamesCol = await getGamesCol();
    const doc = await gamesCol.findOne({ _id: id });
    if (!doc) return res.status(404).json({ ok: false, error: 'GAME_NOT_FOUND' });

    const playerUids = doc.playerUids || doc.state?.playerUids || {};
    const isPlayer = Object.values(playerUids).includes(user.uid);
    if (!isPlayer) return res.status(403).json({ ok: false, error: 'ONLY_PLAYERS_CAN_PUBLISH' });

    await gamesCol.updateOne({ _id: id }, { $set: { isPrivate: false, updatedAt: Date.now() } });
    await clearSingleGameCache(id);
    return res.json({ ok: true });
  } catch (e) {
    logger.error('PATCH /games/:id/publish failed', e);
    return res.status(500).json({ ok: false, error: 'PUBLISH_FAILED' });
  }
});

// GET /games/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    const db = await getDb();
    const col = db.collection('gameComments');
    const comments = await col
      .find({ gameId: id })
      .sort({ createdAt: 1 })
      .limit(500)
      .toArray();
    return res.json({ ok: true, comments });
  } catch (e) {
    logger.debug('GET /games/:id/comments failed', e);
    return res.status(500).json({ ok: false, error: 'COMMENTS_FAILED' });
  }
});

// POST /games/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    const id = safeString(req.params.id);
    const rawText = safeString(req.body?.text);
    const text = sanitizeHtml(rawText).slice(0, 2000);
    if (!text) return res.status(400).json({ ok: false, error: 'TEXT_REQUIRED' });

    // Verify game exists and is accessible to requester (private check)
    const gamesCol = await getGamesCol();
    const doc = await gamesCol.findOne({ _id: id }, { projection: { isPrivate: 1, playerUids: 1, state: 1 } });
    if (!doc) return res.status(404).json({ ok: false, error: 'GAME_NOT_FOUND' });
    if (doc.isPrivate) {
      const playerUids = doc.playerUids || doc.state?.playerUids || {};
      if (!Object.values(playerUids).includes(user.uid)) {
        return res.status(403).json({ ok: false, error: 'PRIVATE_GAME' });
      }
    }

    const db = await getDb();
    const col = db.collection('gameComments');

    // Anti-Spam: Rate limiting (5 per minute)
    if (!(await checkRateLimit(`rate:comment:${user.uid}`, 5, 60))) {
      return res.status(429).json({ ok: false, error: 'RATE_LIMIT', message: 'Bạn đang gửi quá nhanh. Thử lại sau 1 phút.' });
    }

    // Anti-Spam: Duplicate check (same text within 60s)
    const lastComment = await col.findOne({ uid: user.uid }, { sort: { createdAt: -1 } });
    if (lastComment && lastComment.text === text && (Date.now() - lastComment.createdAt < 60000)) {
      return res.status(400).json({ ok: false, error: 'DUPLICATE', message: 'Bình luận trùng lặp.' });
    }
    const comment = {
      gameId: id,
      uid: user.uid,
      name: user.name || 'Ẩn danh',
      picture: user.picture || null,
      text,
      createdAt: Date.now(),
    };
    const result = await col.insertOne(comment);
    const newComment = { ...comment, _id: result.insertedId };
    const io = getIo();
    if (io) {
      io.to(id).emit('game_comment', { gameId: id, comment: newComment });
    }
    return res.json({ ok: true, comment: newComment });
  } catch (e) {
    logger.error('POST /games/:id/comments failed', e);
    return res.status(500).json({ ok: false, error: 'COMMENT_FAILED' });
  }
});

// POST /games/ai/finish — Save AI game for history
router.post('/ai/finish', async (req, res) => {
  try {
    const { roomId, state, playerUids, playerNames, timeMode, setupId, puzzleName } = req.body;
    if (!state) return res.status(400).json({ ok: false, error: 'STATE_REQUIRED' });

    const { saveRoom } = await import('../services/roomManager.mjs');
    
    // Ensure status is finished
    const extra = {
      status: 'finished',
      playerUids,
      playerNames,
      timeMode: timeMode || 'standard',
      setupId,
      puzzleName,
      isPrivate: false,
    };

    const finalId = await saveRoom(roomId, state, extra);
    
    return res.json({ ok: true, roomId: finalId });
  } catch (e) {
    logger.error('POST /games/ai/finish failed', e);
    return res.status(500).json({ ok: false, error: 'SAVE_FAILED' });
  }
});

export default router;

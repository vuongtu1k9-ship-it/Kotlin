import express from 'express';
import { logger } from '../../logger.mjs';
import { getUsersCol } from '../../mongo.mjs';
import { redisClient } from '../../services/cache.mjs';
import { safeString, escapeRegex, safeNumber } from '../../utils/security.mjs';

const router = express.Router();

// Get list of players for leaderboard/search
router.get('/players', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const page = Math.max(1, safeNumber(req.query?.page, 1));
    const limit = Math.max(1, Math.min(200, safeNumber(req.query?.limit, 100)));
    const search = safeString(req.query?.search);
    
    const cacheKey = `players:${limit}:${page}:${search || 'all'}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`[REDIS] GET ${cacheKey} miss/failed`, e); }
    }

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { uid: { $regex: safeSearch, $options: 'i' } },
        { slug: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const users = await getUsersCol();
    const total = await users.countDocuments(query);
    const list = await users
      .find(query, { projection: { _id: 0, uid: 1, slug: 1, name: 1, picture: 1, elo: 1, gamesPlayed: 1 } })
      .sort({ elo: -1, gamesPlayed: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const { onlineUids, playingRoomByUid, customStatusByUid } = await import('../../socket/presence.mjs');

    const response = {
      ok: true,
      players: list.map((u) => ({
        ...u,
        picture: u.picture ? `/api/avatars/${u.uid}.webp` : null,
        elo: Number(u.elo ?? 1200),
        gamesPlayed: Number(u.gamesPlayed ?? 0),
        online: onlineUids.has(u.uid),
        customStatus: customStatusByUid.get(u.uid) || u.customStatus || 'online',
        playingRoomId: playingRoomByUid.get(u.uid) || null,
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };

    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 30, JSON.stringify(response)); } catch (e) { logger.debug(`[REDIS] SET ${cacheKey} failed`, e); }
    }
    return res.json(response);
  } catch (e) {
    logger.error('GET /players failed', e);
    return res.status(500).json({ ok: false, error: 'PLAYERS_FAILED' });
  }
});

// Get bots list
router.get('/users/bots', async (req, res) => {
  try {
    const users = await getUsersCol();
    const bots = await users.find({ $or: [{ role: 'bot' }, { isBot: true }] }).toArray();
    res.json({ ok: true, bots: bots.map(b => ({ uid: b.uid, name: b.name, elo: b.elo || 1200, picture: b.picture })) });
  } catch (e) {
    logger.error('[users] /bots failed:', e);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

export default router;

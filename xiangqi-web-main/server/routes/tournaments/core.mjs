import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb, getGamesCol, toQueryId } from '../../mongo.mjs';
import { redisClient } from '../../services/cache.mjs';
import { safeString, safeNumber, escapeRegex } from '../../utils/security.mjs';

const router = express.Router();

router.get('/tournaments', async (req, res) => {
  try {
    const page = Math.max(1, safeNumber(req.query.page, 1));
    const limit = Math.max(1, Math.min(100, safeNumber(req.query.limit, 20)));
    const search = safeString(req.query.search);
    const status = safeString(req.query.status);

    const cacheKey = `tournaments:${status}:${limit}:${page}:${search || 'all'}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    const query = {};
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };
    if (status) query.status = status;

    const db = await getDb();
    const col = db.collection('tournaments');
    const total = await col.countDocuments(query);
    const docs = await col.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const response = { ok: true, tournaments: docs, total, pages: Math.ceil(total / limit), currentPage: page };

    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 600, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    logger.error('GET /tournaments failed', e);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_LOAD' });
  }
});

router.get('/tournaments/users/:uid/tournaments', async (req, res) => {
  try {
    const uid = safeString(req.params.uid);
    const db = await getDb();
    const col = db.collection('tournaments');
    const docs = await col.find({ players: uid, status: 'finished' }).sort({ endDate: -1 }).toArray();

    const results = docs.map(t => {
      const standing = t.standings?.find(s => s.uid === uid);
      const champion = t.champion?.uid === uid;
      const sortedStandings = [...(t.standings || [])].sort((a, b) => b.points - a.points || b.wins - a.wins);
      const rank = sortedStandings.findIndex(s => s.uid === uid) + 1;

      return {
        id: t._id,
        name: t.name,
        rank: rank > 0 ? rank : null,
        points: standing?.points || 0,
        champion,
        endDate: t.endDate
      };
    });

    return res.json({ ok: true, tournaments: results });
  } catch (e) {
    logger.error('GET /users/:uid/tournaments failed', e);
    return res.status(500).json({ ok: false, error: 'LOAD_FAILED' });
  }
});

router.get('/tournaments/:id', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    const cacheKey = `tournaments:view:${id}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    const db = await getDb();
    const col = db.collection('tournaments');
    const doc = await col.findOne({ _id: toQueryId(id) });
    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const gamesCol = await getGamesCol();
    const matches = await gamesCol.find({ tournamentId: id }).sort({ tournamentRound: 1, createdAt: 1 }).limit(200).toArray();

    const usersCol = db.collection('users');
    const standings = doc.standings || [];
    const uids = standings.map(s => s.uid);
    const playerDocs = uids.length > 0 ? await usersCol.find({ uid: { $in: uids } }).toArray() : [];
    const playerMap = Object.fromEntries(playerDocs.map(p => [p.uid, p]));
    const enrichedStandings = standings
      .map(s => ({
        ...s,
        name: playerMap[s.uid]?.name || s.uid.slice(0, 16),
        picture: playerMap[s.uid]?.picture || null,
        elo: playerMap[s.uid]?.elo || 1200,
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins);

    const allUids = [...new Set(matches.flatMap(m => [m.state?.players?.red?.uid, m.state?.players?.black?.uid]).filter(Boolean))];
    const matchPlayerDocs = allUids.length > 0 ? await usersCol.find({ uid: { $in: allUids } }).toArray() : [];
    const matchPlayerMap = Object.fromEntries(matchPlayerDocs.map(p => [p.uid, p]));
    const enrichedMatches = matches.map(m => ({
      ...m,
      redName: matchPlayerMap[m.state?.players?.red?.uid]?.name || m.state?.players?.red?.uid?.slice(0, 12) || 'Đỏ',
      blackName: matchPlayerMap[m.state?.players?.black?.uid]?.name || m.state?.players?.black?.uid?.slice(0, 12) || 'Đen',
    }));

    const response = { ok: true, tournament: { ...doc, standings: enrichedStandings }, matches: enrichedMatches };

    if (redisClient?.isReady) {
      const ttl = doc.status === 'finished' ? 3600 : 60;
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(response));
    }

    return res.json(response);
  } catch (e) {
    logger.error('GET /tournaments/:id failed', e);
    return res.status(500).json({ ok: false, error: 'LOAD_FAILED' });
  }
});

export default router;

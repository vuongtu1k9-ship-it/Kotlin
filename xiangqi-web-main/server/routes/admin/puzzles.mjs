import express from 'express';
import { logger } from '../../logger.mjs';
import { ObjectId } from 'mongodb';
import { getDb, getPuzzlesCol } from '../../mongo.mjs';
import { redisClient, clearPuzzleCache } from '../../services/cache.mjs';
import { ensureUserFromJwtPayload } from '../../users.mjs';
import { requireUser } from '../../utils/auth.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const search = req.query.search || '';

    const cacheKey = `admin:puzzles:${limit}:${page}:${search || 'all'}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { createdByName: { $regex: search, $options: 'i' } },
      ];
    }

    const col = await getPuzzlesCol();
    const total = await col.countDocuments(query);
    const docs = await col.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const response = { 
      ok: true, 
      puzzles: docs, 
      total, 
      pages: Math.ceil(total / limit),
      currentPage: page 
    };

    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 60, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }

    res.json(response);
  } catch (e) {
    logger.error('GET /admin/puzzles failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.delete('/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const id = String(req.params.id || '');
    const col = await getPuzzlesCol();

    let sourceDoc;
    if (ObjectId.isValid(id) && id.length === 24) {
      sourceDoc = await col.findOne({ _id: new ObjectId(id) });
    }
    if (!sourceDoc) {
      sourceDoc = await col.findOne({ uid: id });
    }

    if (!sourceDoc) return res.status(404).json({ ok: false, error: 'SOURCE_NOT_FOUND' });

    await col.deleteOne({ _id: sourceDoc._id });
    await clearPuzzleCache();
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/puzzles/:id failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;

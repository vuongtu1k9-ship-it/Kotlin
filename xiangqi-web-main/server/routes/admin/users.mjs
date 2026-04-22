import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb } from '../../mongo.mjs';
import { redisClient, clearUserCache } from '../../services/cache.mjs';
import { ensureUserFromJwtPayload } from '../../users.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { safeString, safeNumber, escapeRegex } from '../../utils/security.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid && !user?.sub) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const page = Math.max(1, safeNumber(req.query.page, 1));
    const limit = Math.max(1, Math.min(200, safeNumber(req.query.limit, 50)));
    const search = safeString(req.query.search);
    const role = safeString(req.query.role);

    const cacheKey = `admin:users:${role}:${limit}:${page}:${search || 'all'}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    const query = {};
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { uid: { $regex: escaped, $options: 'i' } },
        { sub: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (role) {
      query.sysRole = role;
    }

    const db = await getDb();
    const queryStr = JSON.stringify(query);
    console.log(`[AdminUsers] UID: ${user.uid} | DB: ${db.databaseName} | Query: ${queryStr}`);

    const total = await db.collection('users').countDocuments(query);
    console.log(`[AdminUsers] Count result: ${total}`);

    const users = await db.collection('users')
      .find(query, { projection: { sub: 1, uid: 1, name: 1, picture: 1, sysRole: 1, createdAt: 1, elo: 1, email: 1, gamesPlayed: 1, inventory: 1, updatedAt: 1, provider: 1, customStatus: 1, slug: 1 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    console.log(`[AdminUsers] Fetched ${users.length} users`);

    const response = { 
      ok: true, 
      users, 
      total, 
      pages: Math.ceil(total / limit),
      currentPage: page 
    };


    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 60, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'LOAD_FAILED' });
  }
});

router.patch('/:uid/role', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    
    const targetUid = safeString(req.params.uid);
    const { newRole } = req.body;
    if (!['admin', 'moderator', 'user'].includes(newRole)) {
      return res.status(400).json({ ok: false, error: 'INVALID_ROLE' });
    }
    
    const db = await getDb();
    await db.collection('users').updateOne({ uid: targetUid }, { $set: { sysRole: newRole, updatedAt: Date.now() } });
    await clearUserCache();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.patch('/:uid/elo', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    
    const targetUid = safeString(req.params.uid);
    const { elo } = req.body;
    if (typeof elo !== 'number') return res.status(400).json({ ok: false, error: 'INVALID_ELO' });
    
    const db = await getDb();
    await db.collection('users').updateOne({ uid: targetUid }, { $set: { elo, updatedAt: Date.now() } });
    await clearUserCache();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.delete('/:uid', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    
    const targetUid = safeString(req.params.uid);
    const db = await getDb();
    await db.collection('users').deleteOne({ uid: targetUid });
    await clearUserCache();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'DELETE_FAILED' });
  }
});

export default router;

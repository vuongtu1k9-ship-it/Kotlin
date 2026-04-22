import express from 'express';
import { logger } from '../logger.mjs';
import { getDb } from '../mongo.mjs';
import { requireUser } from '../utils/auth.mjs';
import { ensureUserFromJwtPayload } from '../users.mjs';

const router = express.Router();

// GET /admin/user-logs - List user activity logs with filters
router.get('/admin/user-logs', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const uid = req.query.uid || '';
    const action = req.query.action || '';
    const search = req.query.search || '';
    const from = req.query.from ? Number(req.query.from) : 0;
    const to = req.query.to ? Number(req.query.to) : 0;

    const query = {};
    if (uid) query.uid = uid;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { uid: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
      ];
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = from;
      if (to) query.createdAt.$lte = to;
    }

    const db = await getDb();
    const col = db.collection('user_logs');

    const total = await col.countDocuments(query);
    const logs = await col
      .find(query, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return res.json({
      ok: true,
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (e) {
    logger.error('GET /admin/user-logs failed', e);
    return res.status(500).json({ ok: false, error: 'LOAD_FAILED' });
  }
});

// GET /admin/user-logs/stats - Aggregated stats
router.get('/admin/user-logs/stats', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const uid = req.query.uid || '';
    const days = Math.max(1, Math.min(90, Number(req.query.days || 7)));
    const since = Date.now() - days * 86400000;

    const db = await getDb();
    const col = db.collection('user_logs');

    const matchStage = { createdAt: { $gte: since } };
    if (uid) matchStage.uid = uid;

    // Action counts
    const actionCounts = await col.aggregate([
      { $match: matchStage },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Daily activity
    const dailyActivity = await col.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$createdAt' } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    // Top active users
    const topUsers = await col.aggregate([
      { $match: matchStage },
      { $group: { _id: '$uid', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).toArray();

    // Total logs in period
    const total = await col.countDocuments(matchStage);

    return res.json({
      ok: true,
      stats: {
        total,
        days,
        actionCounts: actionCounts.map(a => ({ action: a._id, count: a.count })),
        dailyActivity: dailyActivity.map(d => ({ date: d._id, count: d.count })),
        topUsers: topUsers.map(u => ({ uid: u._id, count: u.count })),
      },
    });
  } catch (e) {
    logger.error('GET /admin/user-logs/stats failed', e);
    return res.status(500).json({ ok: false, error: 'STATS_FAILED' });
  }
});

// GET /admin/user-logs/actions - List distinct action types
router.get('/admin/user-logs/actions', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const db = await getDb();
    const col = db.collection('user_logs');
    const actions = await col.distinct('action');
    return res.json({ ok: true, actions: actions.sort() });
  } catch (e) {
    logger.error('GET /admin/user-logs/actions failed', e);
    return res.status(500).json({ ok: false, error: 'ACTIONS_FAILED' });
  }
});

export default router;

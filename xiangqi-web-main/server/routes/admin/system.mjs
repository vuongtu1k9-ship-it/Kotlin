import express from 'express';
import { logger } from '../../logger.mjs';
import { redisClient, clearSiteSettingsCache } from '../../services/cache.mjs';
import { getAllConfig, setConfig, setBulkConfig } from '../../services/siteConfig.mjs';
import { requireAdmin } from '../../utils/auth.mjs';
import { getDb } from '../../mongo.mjs';

const router = express.Router();

// Settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await getAllConfig({ publicOnly: true });
    res.json({ ok: true, settings });
  } catch (e) {
    logger.error('GET /admin/settings failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.patch('/settings', requireAdmin, async (req, res) => {
  try {
    const { key, value, settings } = req.body || {};
    
    if (settings && typeof settings === 'object') {
      await setBulkConfig(settings);
    } else if (key) {
      await setConfig(key, value);
    } else {
      return res.status(400).json({ ok: false, error: 'MISSING_DATA' });
    }

    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('site:settings_update', { key, value, settings });
      await clearSiteSettingsCache();
    } catch (err) {
      logger.error('Failed to broadcast settings update', err);
    }
    res.json({ ok: true });
  } catch (e) {
    logger.error('PATCH /admin/settings failed', e);
    res.status(500).json({ ok: false, error: e.message || 'SERVER_ERROR' });
  }
});

// Cache
router.get('/cache', requireAdmin, async (req, res) => {
  try {
    if (!redisClient?.isReady) return res.json({ ok: true, connected: false });

    const infoStr = await redisClient.info('memory');
    const memStr = infoStr.match(/used_memory_human:(.*)/)?.[1]?.trim() || 'N/A';
    const keyspaceStr = await redisClient.info('keyspace');
    const keysCount = Number(keyspaceStr.match(/db0:keys=(\d+)/)?.[1] || 0);
    const keys = await redisClient.keys('*');

    res.json({ ok: true, connected: true, memoryUsed: memStr, keys: keysCount, keyList: keys });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/cache', requireAdmin, async (req, res) => {
  try {
    if (!redisClient?.isReady) return res.status(400).json({ ok: false, error: 'REDIS_NOT_CONNECTED' });
    await redisClient.flushAll();
    logger.info(`[ADMIN] Cache cleared by ${req.user?.name || 'unknown'}`);
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/cache failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/cache/:key', requireAdmin, async (req, res) => {
  try {
    if (!redisClient?.isReady) return res.status(500).json({ ok: false, error: 'REDIS_NOT_READY' });
    await redisClient.del(req.params.key);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Push Notifications
router.post('/push/send', requireAdmin, async (req, res) => {
  try {
    const { targetUid, title, body, url } = req.body;
    if (!targetUid || !title || !body) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });

    // 1. Socket.io (Immediate)
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) {
        const room = 'user:' + targetUid;
        io.to(room).emit('notification:receive', { 
          id: Date.now(), title, body, url: url || '/', type: 'system' 
        });
        logger.info(`[AdminPush] Emitted real-time notification to room ${room}`);
      }
    } catch (socketErr) {
      logger.error('[AdminPush] Socket emit failed', socketErr);
    }

    // 2. Web Push (Background)
    void (async () => {
      try {
        const { sendNotification } = await import('../../push.mjs');
        await sendNotification(targetUid, { title, body, url: url || '/' });
      } catch (e) {
        logger.error('[AdminPush] WebPush failed', e);
      }
    })();
    
    res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/push/send failed', e);
    res.status(500).json({ ok: false, error: 'SEND_FAILED' });
  }
});

router.post('/push/broadcast', requireAdmin, async (req, res) => {
  try {
    const { title, body, url } = req.body;
    if (!title || !body) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });

    // 1. Socket.io Broadcast (Immediate)
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) {
        io.emit('notification:receive', { id: Date.now(), title, body, url: url || '/', type: 'broadcast' });
        logger.info(`[AdminPush] Global broadcast emitted to all sockets`);
      }
    } catch (socketErr) {
      logger.error('[AdminPush] Global socket emit failed', socketErr);
    }

    // 2. Web Push (Background)
    const sendWebPush = async () => {
      try {
        const { getSubscriptionCol, sendNotification } = await import('../../push.mjs');
        const col = await getSubscriptionCol();
        const uids = await col.distinct('userUid');
        logger.info(`[AdminPush] Sending WebPush broadcast to ${uids.length} subscriptions`);
        await Promise.allSettled(uids.map(uid => sendNotification(uid, { title, body, url: url || '/' })));
      } catch (e) {
        logger.error('[AdminPush] WebPush broadcast background task failed', e);
      }
    };
    void sendWebPush();

    res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/push/broadcast failed', e);
    res.status(500).json({ ok: false, error: 'BROADCAST_FAILED' });
  }
});

/**
 * Dashboard Summary Stats & Activity
 */
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Counts
        const [userCount, matchCount, puzzleCount, tournamentCount, commentCount] = await Promise.all([
            db.collection('users').countDocuments(),
            db.collection('matches').countDocuments(),
            db.collection('puzzles').countDocuments(),
            db.collection('tournaments').countDocuments(),
            db.collection('comments').countDocuments()
        ]);

        // Recent Activity (Daily Growth)
        const recentUsers = await db.collection('users')
            .find({ createdAt: { $gte: thirtyDaysAgo } })
            .project({ createdAt: 1 })
            .toArray();

        const recentMatches = await db.collection('matches')
            .find({ createdAt: { $gte: thirtyDaysAgo } })
            .project({ createdAt: 1 })
            .toArray();

        // Hourly Activity (Last 24 hours)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const hourlyUsers = await db.collection('users')
            .find({ createdAt: { $gte: twentyFourHoursAgo } })
            .project({ createdAt: 1 })
            .toArray();

        const hourlyMatches = await db.collection('matches')
            .find({ createdAt: { $gte: twentyFourHoursAgo } })
            .project({ createdAt: 1 })
            .toArray();

        // Helper to format daily data
        const formatDaily = (items) => {
            const daily = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                daily[d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })] = 0;
            }
            items.forEach(item => {
                const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                if (daily[dateStr] !== undefined) daily[dateStr]++;
            });
            return Object.entries(daily).map(([date, count]) => ({ date, count }));
        };

        // Helper to format hourly data
        const formatHourly = (uItems, mItems) => {
            const hourly = [];
            for (let i = 23; i >= 0; i--) {
                const d = new Date();
                d.setHours(d.getHours() - i);
                const hourStr = d.getHours() + ':00';
                hourly.push({ hour: hourStr, users: 0, matches: 0, label: hourStr });
            }
            uItems.forEach(item => {
                const h = new Date(item.createdAt).getHours() + ':00';
                const entry = hourly.find(e => e.hour === h);
                if (entry) entry.users++;
            });
            mItems.forEach(item => {
                const h = new Date(item.createdAt).getHours() + ':00';
                const entry = hourly.find(e => e.hour === h);
                if (entry) entry.matches++;
            });
            return hourly;
        };

        res.json({
            ok: true,
            counts: { 
                users: userCount, 
                matches: matchCount, 
                puzzles: puzzleCount, 
                tournaments: tournamentCount, 
                comments: commentCount 
            },
            growth: {
                users: formatDaily(recentUsers),
                matches: formatDaily(recentMatches),
                pulse: formatHourly(hourlyUsers, hourlyMatches)
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            }
        });
    } catch (e) {
        logger.error('GET /admin/dashboard-stats failed', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

export default router;

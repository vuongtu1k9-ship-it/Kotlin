import express from 'express';
import { logger } from '../logger.mjs';
import { getDb } from '../mongo.mjs';
import { requireUser } from '../utils/auth.mjs';
import { getIo } from '../socket/presence.mjs';
import { checkRateLimit, redisClient } from '../services/cache.mjs';
import { safeString, sanitizeHtml } from '../utils/security.mjs';

const router = express.Router();

// GET /comments/:type/:id
router.get('/comments/:type/:id', async (req, res) => {
  try {
    const type = safeString(req.params.type);
    const id = safeString(req.params.id);
    if (!type || !id) return res.status(400).json({ ok: false, error: 'BAD_PARAMS' });

    const cacheKey = `comments:${type}:${id}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.warn(`[COMMENTS] Redis get failed for ${cacheKey}:`, e); }
    }

    const db = await getDb();
    const col = db.collection('entityComments');
    const comments = await col
      .find({ entityType: type, entityId: id })
      .sort({ createdAt: 1 })
      .limit(1000)
      .toArray();

    const response = { ok: true, comments };
    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 30, JSON.stringify(response)); } catch (e) { logger.warn(`[COMMENTS] Redis setEx failed for ${cacheKey}:`, e); }
    }
    return res.json(response);
  } catch (e) {
    logger.error(`[COMMENTS] GET /comments/${req.params.type}/${req.params.id} failed:`, e.message);
    return res.status(500).json({ ok: false, error: 'COMMENTS_FAILED' });
  }
});

router.post('/comments/:type/:id', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    
    const type = safeString(req.params.type);
    const id = safeString(req.params.id);
    
    // 1. Honeypot check (Bot detection)
    if (req.body?.hp_field) {
      logger.warn(`[security] comment bot detected (hp_field filled) for uid: ${user.uid}`);
      return res.status(400).json({ ok: false, error: 'BOT_DETECTED' });
    }

    let text = safeString(req.body?.text);
    
    // 2. Anti-Malware: Strip all HTML tags using robust sanitizer
    text = sanitizeHtml(text).slice(0, 2000);
    
    if (!text) return res.status(400).json({ ok: false, error: 'TEXT_REQUIRED' });

    // 3. Anti-Link: Block comments containing URLs
    const linkRegex = /(https?:\/\/|www\.|[\w-]+\.\w{2,})/gi;
    if (linkRegex.test(text)) {
      return res.status(400).json({ ok: false, error: 'NO_LINKS', message: 'Bình luận không được chứa liên kết.' });
    }

    const db = await getDb();
    const col = db.collection('entityComments');

    // Anti-Spam: Rate limiting (3 per minute) - Tightened from 5
    if (!(await checkRateLimit(`rate:comment:${user.uid}`, 3, 60))) {
      return res.status(429).json({ ok: false, error: 'RATE_LIMIT', message: 'Bạn đang gửi quá nhanh. Thử lại sau 1 phút.' });
    }

    // Anti-Spam: Duplicate check (same text within 60s)
    const lastComment = await col.findOne({ uid: user.uid }, { sort: { createdAt: -1 } });
    if (lastComment && lastComment.text === text && (Date.now() - lastComment.createdAt < 60000)) {
      return res.status(400).json({ ok: false, error: 'DUPLICATE', message: 'Bình luận trùng lặp.' });
    }
    const comment = {
      entityType: type,
      entityId: id,
      uid: user.uid,
      name: user.name || 'Ẩn danh',
      picture: user.picture || null,
      text,
      createdAt: Date.now(),
    };
    
    const result = await col.insertOne(comment);
    const newComment = { ...comment, _id: result.insertedId };
    
    // Invalidate comments cache so next GET fetches fresh data
    if (redisClient?.isReady) {
      try { await redisClient.del(`comments:${type}:${id}`); } catch (e) { logger.warn(`Redis del failed for comments:${type}:${id}:`, e); }
    }
    
    const io = getIo();
    if (io) {
      // Room name is simply "comments:{type}:{id}"
      const room = `comments:${type}:${id}`;
      io.to(room).emit('entity_comment', { entityType: type, entityId: id, comment: newComment });
    }
    
    return res.json({ ok: true, comment: newComment });
  } catch (e) {
    logger.error(`[COMMENTS] POST /comments/${req.params.type}/${req.params.id} failed:`, e.message);
    return res.status(500).json({ ok: false, error: 'COMMENT_FAILED' });
  }
});

export default router;

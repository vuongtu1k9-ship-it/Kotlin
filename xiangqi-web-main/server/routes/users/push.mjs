import express from 'express';
import { logger } from '../../logger.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { saveSubscription } from '../../push.mjs';
import { getConfig } from '../../services/siteConfig.mjs';

const router = express.Router();

router.post('/push/subscribe', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid && !user?.sub) {
    logger.warn(`POST /push/subscribe 401 - UNAUTHORIZED (IP: ${req.ip})`);
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ ok: false, error: 'MISSING_SUBSCRIPTION' });
    await saveSubscription(user.uid, subscription);
    return res.json({ ok: true });
  } catch (e) {
    logger.error('POST /push/subscribe failed', e);
    return res.status(500).json({ ok: false, error: 'SUBSCRIBE_FAILED' });
  }
});

router.get('/push/vapid-key', async (_req, res) => {
  try {
    const key = await getConfig('push.vapidPublic');
    return res.json({ ok: !!key, key: key || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;

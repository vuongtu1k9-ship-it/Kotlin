import express from 'express';
import { logger } from '../logger.mjs';
import { getGiftsCol, getUsersCol } from '../mongo.mjs';
import { clearUserCache } from '../services/cache.mjs';
import { requireUser } from '../utils/auth.mjs';
import { logUserActivity, LOG_ACTIONS } from '../services/userLogger.mjs';
import { getLocalized } from '../utils/i18n.mjs';

const router = express.Router();

/**
 * Helper to fetch all gifts from DB
 */
async function getGiftItemsMap() {
  try {
    const col = await getGiftsCol();
    const items = await col.find({}).toArray();
    const map = {};
    for (const item of items) {
      map[item.id] = item;
    }
    return map;
  } catch (e) {
    logger.error('Failed to fetch gifts from DB', e);
    return {};
  }
}

// GET /api/gifts/list
router.get('/list', async (req, res) => {
  const gifts = await getGiftItemsMap();
  
  // Localize
  const localizedGifts = {};
  for (const id in gifts) {
    const item = gifts[id];
    localizedGifts[id] = {
      ...item,
      name: getLocalized(item.name, req.lng),
      description: getLocalized(item.description, req.lng)
    };
  }
  
  res.json({ ok: true, gifts: localizedGifts });
});

// GET /api/gifts/inventory
router.get('/inventory', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const users = await getUsersCol();
    const dbUser = await users.findOne({ uid: user.uid });
    if (!dbUser) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

    return res.json({
      ok: true,
      inventory: dbUser.inventory || { ring: 0, bear: 0, candy: 0, coins: 0 }
    });
  } catch (e) {
    logger.error('GET /inventory failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

// POST /api/gifts/buy
router.post('/buy', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  const { itemId, quantity = 1 } = req.body;
  
  const gifts = await getGiftItemsMap();
  const item = gifts[itemId];
  if (!item) return res.status(400).json({ ok: false, error: 'INVALID_ITEM' });
  if (quantity < 1) return res.status(400).json({ ok: false, error: 'INVALID_QUANTITY' });

  const totalPrice = item.price * quantity;

  try {
    const users = await getUsersCol();
    const dbUser = await users.findOne({ uid: user.uid });
    if (!dbUser) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

    const currentCoins = dbUser.inventory?.coins || 0;
    if (currentCoins < totalPrice) {
      return res.status(400).json({ ok: false, error: 'INSUFFICIENT_FUNDS' });
    }

    const inventoryKey = `inventory.${itemId}`;
    await users.updateOne(
      { uid: user.uid },
      { 
        $inc: { 
          'inventory.coins': -totalPrice,
          [inventoryKey]: quantity 
        },
        $set: { updatedAt: Date.now() }
      }
    );

    logUserActivity({ uid: user.uid, action: LOG_ACTIONS.COINS_CHANGE, details: { amount: -totalPrice, reason: 'buy_item', itemId, quantity } }).catch(err => logger.debug('Buy item activity logging failed', err));

    return res.json({ ok: true, itemId, quantity, totalPrice });
  } catch (e) {
    logger.error('POST /gifts/buy failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

// POST /api/gifts/send
router.post('/send', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  const { targetUid, itemId, quantity = 1 } = req.body;

  if (!targetUid || targetUid === user.uid) return res.status(400).json({ ok: false, error: 'INVALID_TARGET' });
  const gifts = await getGiftItemsMap();
  const item = gifts[itemId];
  if (!item) return res.status(400).json({ ok: false, error: 'INVALID_ITEM' });
  if (quantity < 1) return res.status(400).json({ ok: false, error: 'INVALID_QUANTITY' });

  try {
    const users = await getUsersCol();
    const sender = await users.findOne({ uid: user.uid });
    if (!sender) return res.status(404).json({ ok: false, error: 'SENDER_NOT_FOUND' });

    const available = sender.inventory?.[itemId] || 0;
    if (available < quantity) {
      return res.status(400).json({ ok: false, error: 'INSUFFICIENT_ITEMS' });
    }

    const target = await users.findOne({ uid: targetUid });
    if (!target) return res.status(404).json({ ok: false, error: 'TARGET_NOT_FOUND' });

    // Atomic transfer
    const inventoryKey = `inventory.${itemId}`;
    await users.updateOne({ uid: user.uid }, { $inc: { [inventoryKey]: -quantity }, $set: { updatedAt: Date.now() } });
    await users.updateOne({ uid: targetUid }, { $inc: { [inventoryKey]: quantity }, $set: { updatedAt: Date.now() } });

    // Notify target via Socket (optional but recommended)
    try {
      const { getIo } = await import('../socket/presence.mjs');
      const io = getIo();
      if (io) {
        io.to(`user:${targetUid}`).emit('gift:received', {
          fromUid: user.uid,
          fromName: sender.name,
          itemId,
          quantity
        });
      }
    } catch (e) {
      logger.error('Socket notification for gift failed', e);
    }

    return res.json({ ok: true, targetUid, itemId, quantity });
  } catch (e) {
    logger.error('POST /gifts/send failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

// POST /api/gifts/send-coins
router.post('/send-coins', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  const { targetUid, amount } = req.body;

  if (!targetUid || targetUid === user.uid) return res.status(400).json({ ok: false, error: 'INVALID_TARGET' });
  const coinsAmount = Number(amount);
  if (isNaN(coinsAmount) || coinsAmount < 1) return res.status(400).json({ ok: false, error: 'INVALID_AMOUNT' });
  if (coinsAmount > 500) return res.status(400).json({ ok: false, error: 'TRANSFER_LIMIT_EXCEEDED' });

  try {
    const users = await getUsersCol();
    const sender = await users.findOne({ uid: user.uid });
    if (!sender) return res.status(404).json({ ok: false, error: 'SENDER_NOT_FOUND' });

    // Check & Reset daily limits
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const lastReset = new Date(sender.lastGiftResetAt || 0).setHours(0, 0, 0, 0);
    
    let giftsSent = sender.dailyGiftsSent || 0;
    if (today > lastReset) {
      giftsSent = 0;
    }

    if (giftsSent >= 5) {
      return res.status(400).json({ ok: false, error: 'DAILY_GIFT_LIMIT_REACHED' });
    }

    if ((sender.inventory?.coins || 0) < coinsAmount) {
      return res.status(400).json({ ok: false, error: 'INSUFFICIENT_FUNDS' });
    }

    const target = await users.findOne({ uid: targetUid });
    if (!target) return res.status(404).json({ ok: false, error: 'TARGET_NOT_FOUND' });

    // Atomic transfer + limit update
    await users.updateOne(
      { uid: user.uid },
      { 
        $inc: { 'inventory.coins': -coinsAmount, dailyGiftsSent: 1 },
        $set: { lastGiftResetAt: now, updatedAt: Date.now() }
      }
    );
    await users.updateOne(
      { uid: targetUid },
      { 
        $inc: { 'inventory.coins': coinsAmount },
        $set: { updatedAt: Date.now() }
      }
    );

    // Invalidate caches
    await clearUserCache(user.uid);
    await clearUserCache(targetUid);

    // Notify target
    try {
      const { getIo } = await import('../socket/presence.mjs');
      const io = getIo();
      if (io) {
        io.to(`user:${targetUid}`).emit('coin:received', {
          fromUid: user.uid,
          fromName: sender.name,
          amount: coinsAmount
        });
      }
    } catch (e) {
      logger.error('Socket notification for coins failed', e);
    }

    return res.json({ ok: true, targetUid, amount: coinsAmount });
  } catch (e) {
    logger.error('POST /gifts/send-coins failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

export default router;

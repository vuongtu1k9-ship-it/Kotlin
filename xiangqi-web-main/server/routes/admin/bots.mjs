import express from 'express';
import botManager from '../../services/botManager.mjs';
import { requireAdmin } from '../../utils/auth.mjs';
import { logger } from '../../logger.mjs';

const router = express.Router();

router.use(requireAdmin);

// GET /api/admin/bots
router.get('/', async (req, res) => {
  try {
    const bots = await botManager.getAllBots();
    res.json({ ok: true, bots });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/admin/bots
router.post('/', async (req, res) => {
  try {
    const bot = await botManager.createBot(req.body);
    logger.info(`[ADMIN_API] Admin created new bot: ${bot.name} (${bot._id})`);
    res.json({ ok: true, bot });
  } catch (err) {
    logger.error(`[ADMIN_API] Error creating bot: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /api/admin/bots/:id
router.patch('/:id', async (req, res) => {
  try {
    await botManager.updateBot(req.params.id, req.body);
    logger.info(`[ADMIN_API] Admin updated bot: ${req.params.id} (Name: ${req.body.name || 'unknown'})`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[ADMIN_API] Error updating bot ${req.params.id}: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/admin/bots/:id
router.delete('/:id', async (req, res) => {
  try {
    await botManager.deleteBot(req.params.id);
    logger.info(`[ADMIN_API] Admin deleted bot: ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[ADMIN_API] Error deleting bot ${req.params.id}: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/admin/bots/:id/toggle
router.post('/:id/toggle', async (req, res) => {
  try {
    const { start } = req.body;
    await botManager.toggleBot(req.params.id, start);
    logger.info(`[ADMIN_API] Admin toggled bot ${req.params.id} -> ${start ? 'START' : 'STOP'}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[ADMIN_API] Error toggling bot ${req.params.id}: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

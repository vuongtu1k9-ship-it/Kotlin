import express from 'express';
import { logger } from '../logger.mjs';
import fs from 'fs';
import { boardToFen, uciToMoveCoords } from '../fen.mjs';
import { createUciPool } from '../uciPool.mjs';
import { redisClient } from '../services/cache.mjs';
import { getConfig } from '../services/siteConfig.mjs';

const router = express.Router();

const getPikafishPath = () => {
  if (process.env.PIKAFISH_PATH) return process.env.PIKAFISH_PATH;
  const paths = [
    './server/bin/pikafish',
    '/opt/pikafish',
    '/opt/pikafish/pikafish',
    '/usr/bin/pikafish'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return paths[0];
};

const getNnuePath = () => {
  if (process.env.PIKAFISH_NNUE_PATH) return process.env.PIKAFISH_NNUE_PATH;
  const paths = [
    './pikafish.nnue',
    './server/bin/pikafish.nnue',
    '/opt/pikafish/pikafish.nnue'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return '';
};

export const pikafish = createUciPool('pikafish', {
  binPath: getPikafishPath(),
  threads: Number(process.env.PIKAFISH_THREADS || 4),
  poolSize: Number(process.env.PIKAFISH_POOL_SIZE || 4),
  hashMb: Number(process.env.PIKAFISH_HASH_MB || 64),
  nnuePath: getNnuePath(),
  variant: 'xiangqi',
  uciOptions: {
    'MultiPV': Number(process.env.PIKAFISH_MULTI_PV || 1),
  }

});

router.post('/engine/bestmove', async (req, res) => {
  try {
    const { board, side, movetimeMs = 2000, history = [], initialFen } = req.body || {};
    const histLen = Array.isArray(history) ? history.length : 0;
    logger.log(`[API] Engine Request: pikafish, side=${side}, movetime=${movetimeMs}ms, history=${histLen}, initialFen=${initialFen ? 'yes' : 'no'}`);

    if (histLen > 0) {
      const sample = history.length > 5 
        ? `${history.slice(0, 3).join(', ')} ... ${history.slice(-1)}`
        : history.join(', ');
      logger.debug(`[API] History sample: ${sample}`);
    }
    if (!board || (side !== 'red' && side !== 'black')) {
      return res.status(400).json({ ok: false, error: 'BAD_REQUEST' });
    }

    const fen = initialFen || boardToFen(board, side);
    const cacheKey = `engine:bestmove:pikafish:${fen}:${movetimeMs}:${history?.join(',') || ''}`;
    const cacheEnabled = await getConfig('ai.pikafishCacheEnabled');
    logger.debug(`[API] Pikafish Cache Enabled: ${cacheEnabled}`);

    if (cacheEnabled && redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.info(`[API] Pikafish Cache HIT for key: ${cacheKey.slice(0, 50)}...`);
          return res.json(JSON.parse(cached));
        }
        logger.debug(`[API] Pikafish Cache MISS`);
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    const best = await pikafish.run(fen, movetimeMs, history);
    const coords = uciToMoveCoords(best);
    if (!coords) return res.status(500).json({ ok: false, error: 'BAD_ENGINE_MOVE', best, fen });

    const response = { ok: true, bestmove: best, ...coords, fen };
    if (cacheEnabled && redisClient?.isReady) {
      try {
        // Cache for 1 day
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(response));
      } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    logger.error('[engine:bestmove] critical failure:', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

export default router;

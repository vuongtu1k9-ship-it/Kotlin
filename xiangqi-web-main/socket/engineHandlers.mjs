import { logger } from '../logger.mjs';
import { boardToFen, uciToMoveCoords } from '../fen.mjs';
import { pikafish } from '../routes/engine.mjs';
import { redisClient } from '../services/cache.mjs';
import { getConfig } from '../services/siteConfig.mjs';

export function registerEngineHandlers(io, socket) {
  socket.on('engine:bestmove', async (params, ack) => {
    try {
      const { board, side, movetimeMs = 2000, history = [], initialFen } = params || {};
      const histLen = Array.isArray(history) ? history.length : 0;
      
      logger.debug(`[Socket:${socket.id}] Engine Request: pikafish, side=${side}, movetime=${movetimeMs}ms, history=${histLen}, initialFen=${initialFen ? 'yes' : 'no'}`);
      
      if (histLen > 0) {
        const sample = history.length > 5 
          ? `${history.slice(0, 3).join(', ')} ... ${history.slice(-1)}`
          : history.join(', ');
        logger.debug(`[Socket:${socket.id}] History sample: ${sample}`);
      }

      logger.debug(`[Socket:${socket.id}] FEN: ${(initialFen || '').slice(0, 80)}...`);

      if (!board || (side !== 'red' && side !== 'black')) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_REQUEST' });
        return;
      }

      let fen, finalHistory;
      if (initialFen) {
        fen = initialFen;
        finalHistory = history;
      } else {
        fen = boardToFen(board, side);
        finalHistory = []; // Board already reflects the state, don't double-apply moves
      }

      const cacheKey = `engine:bestmove:pikafish:${fen}:${movetimeMs}:${finalHistory?.join(',') || ''}`;
      const cacheEnabled = await getConfig('ai.pikafishCacheEnabled');

      if (cacheEnabled && redisClient?.isReady) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            if (typeof ack === 'function') ack(JSON.parse(cached));
            return;
          }
        } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
      }

      const best = await pikafish.run(fen, movetimeMs, finalHistory);
      const coords = uciToMoveCoords(best, 'pikafish');

      if (!coords) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_ENGINE_MOVE', best, fen });
        return;
      }

      const response = { ok: true, bestmove: best, ...coords, fen };

      if (cacheEnabled && redisClient?.isReady) {
        try {
          // Cache for 1 day
          await redisClient.setEx(cacheKey, 86400, JSON.stringify(response));
        } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
      }

      if (typeof ack === 'function') ack(response);
    } catch (e) {
      logger.error('[Socket:engine:bestmove] critical failure:', e);
      if (typeof ack === 'function') ack({ ok: false, error: String(e?.message || e) });
    }
  });
}

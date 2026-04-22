import { logger } from './logger.mjs';
import { createUciRunner } from './uciRunner.mjs';

/**
 * UCI Engine Pool to allow parallel request processing.
 * - Manages multiple UciRunner instances.
 * - Implements global deduplication across the entire pool.
 * - Load balances requests to the least busy runner.
 */
export function createUciPool(name, opts = {}) {
  const poolSize = Number(opts.poolSize || 4);
  const runners = [];

  logger.info(`[${name}-Pool] Initializing pool with size ${poolSize}`);

  // Initialize runners
  for (let i = 0; i < poolSize; i++) {
    runners.push(createUciRunner(`${name}-${i}`, opts));
  }

  // Global deduplication map for the entire pool
  const pendingKeys = new Map();

  const run = (fen, movetimeMs, history = [], engineOptions = {}) => 
    new Promise((resolve, reject) => {
      const mt = Number(movetimeMs || 1000);
      const dedupKey = `${fen}:${mt}:${(history || []).join(',')}`;

      // Check global deduplication
      if (pendingKeys.has(dedupKey)) {
        logger.info(`[${name}-Pool] Global Dedup hit — key=${dedupKey.slice(0, 60)}...`);
        pendingKeys.get(dedupKey).push({ resolve, reject });
        return;
      }

      // First one with this key
      pendingKeys.set(dedupKey, [{ resolve, reject }]);

      const notifyAll = (err, bestmove) => {
        const subscribers = pendingKeys.get(dedupKey) || [];
        pendingKeys.delete(dedupKey);
        for (const { resolve: res, reject: rej } of subscribers) {
          if (err) rej(err);
          else res(bestmove);
        }
      };

      // Find the least busy runner
      // Least busy = minimum queued requests
      const bestRunner = runners.reduce((prev, curr) => {
        const pStatus = prev.status();
        const cStatus = curr.status();
        
        // Prefer one that is not busy at all
        if (!cStatus.busy && cStatus.queued === 0) return curr;
        if (!pStatus.busy && pStatus.queued === 0) return prev;

        return (cStatus.queued < pStatus.queued) ? curr : prev;
      });

      logger.info(`[${name}-Pool] Assigned request to ${bestRunner.status().name}`);

      bestRunner.run(fen, movetimeMs, history, engineOptions)
        .then(bestmove => notifyAll(null, bestmove))
        .catch(err => notifyAll(err));
    });

  const status = () => ({
    name,
    poolSize,
    runners: runners.map(r => r.status()),
    pendingGlobalRequests: pendingKeys.size
  });

  return { run, status };
}

import { createClient } from 'redis';
import { logger } from '../logger.mjs';

let redisClient = null;
try {
  redisClient = createClient({ 
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Retry limit reached');
        return Math.min(retries * 50, 2000);
      }
    }
  });
  redisClient.on('error', (err) => logger.error('[redis] Client Error:', err.message || err));
  redisClient.on('connect', () => logger.info('[redis] Connecting...'));
  redisClient.on('ready', () => logger.info('[redis] Connected & Ready'));
  redisClient.on('reconnecting', () => logger.info('[redis] Reconnecting...'));
  
  // We don't want to block the entire module loading if possible, 
  // but many other parts of the system assume it's ready. 
  // Let's at least wrap it.
  await redisClient.connect().catch(e => {
    logger.error('[redis] Preliminary connection failed:', e.message);
  });
} catch (e) {
  logger.error('[redis] Setup failed, working without cache:', e.message);
  redisClient = null;
}

export { redisClient };

export async function clearTournamentCache() {
  if (redisClient?.isReady) {
    try {
      const keys = await redisClient.keys('tournaments:*');
      if (keys.length) await redisClient.del(keys);
    } catch (e) { logger.debug('[redis] Cache operation failed', e); }
  }
}

export async function clearUserCache(uid = null) {
  if (redisClient?.isReady) {
    try {
      if (uid) {
        // Targeted invalidation for user summary
        await redisClient.del(`user:summary:${uid}`);
      }
      
      const keys = await redisClient.keys('admin:users:*');
      if (keys.length) await redisClient.del(keys);
      // Also clear public players list
      const playerKeys = await redisClient.keys('players:*');
      if (playerKeys.length) await redisClient.del(playerKeys);
    } catch (e) { logger.debug('[redis] Cache operation failed', e); }
  }
}

export async function clearPuzzleCache() {
  if (redisClient?.isReady) {
    try {
      const keys = await redisClient.keys('admin:puzzles:*');
      if (keys.length) await redisClient.del(keys);
      // Also clear public listing cache
      const publicKeys = await redisClient.keys('setups:public:*');
      if (publicKeys.length) await redisClient.del(publicKeys);
    } catch (e) { logger.debug('[redis] Cache operation failed', e); }
  }
}

export async function clearGamesCache() {
  if (redisClient?.isReady) {
    try {
      const keys = await redisClient.keys('games:*');
      if (keys.length) await redisClient.del(keys);
    } catch (e) { logger.debug('[redis] Cache operation failed', e); }
  }
}

export async function clearPracticeCache() {
  if (redisClient?.isReady) {
    try {
      const keys = await redisClient.keys('practice:*');
      if (keys.length) await redisClient.del(keys);
    } catch (e) { logger.debug('[redis] Cache operation failed', e); }
  }
}

export async function clearShopCache() {
  // Currently we fetch directly from DB in the user route, 
  // but we can clear any potential future cache here.
  if (redisClient?.isReady) {
    try {
      const keys = await redisClient.keys('shop:*');
      if (keys.length) await redisClient.del(keys);
    } catch (e) { logger.debug('[redis] Cache operation failed', e); }
  }
}

/**
 * @param {string} key - Unique key (e.g., rate:comment:uid)
 * @param {number} limit - Max actions allowed
 * @param {number} window - Window in seconds
 * @returns {Promise<boolean>} - true if allowed, false if limited
 */
export async function checkRateLimit(key, limit, window) {
  if (!redisClient?.isReady) return true; // Fail open if redis is down
  try {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, window);
    }
    return current <= limit;
  } catch (e) {
    logger.error('[redis] Rate limit error:', e);
    return true;
  }
}

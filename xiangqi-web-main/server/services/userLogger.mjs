import { getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

// Supported log action types
export const LOG_ACTIONS = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER: 'auth.register',
  LOGIN_GOOGLE: 'auth.login_google',
  LOGIN_GUEST: 'auth.login_guest',

  // Game
  GAME_CREATE: 'game.create',
  GAME_JOIN: 'game.join',
  GAME_FINISH: 'game.finish',
  GAME_SURRENDER: 'game.surrender',
  GAME_DRAW_OFFER: 'game.draw_offer',

  // Puzzle
  PUZZLE_SOLVE: 'puzzle.solve',
  PUZZLE_CREATE: 'puzzle.create',

  // Shop / Gifts
  GIFT_PURCHASE: 'gift.purchase',
  GIFT_SEND: 'gift.send',

  // Coins / Elo
  COINS_CHANGE: 'coins.change',
  ELO_CHANGE: 'elo.change',

  // Profile
  PROFILE_UPDATE: 'profile.update',

  // Practice
  PRACTICE_COMPLETE: 'practice.complete',

  // Follow
  FOLLOW: 'social.follow',
  UNFOLLOW: 'social.unfollow',

  // Tournament
  TOURNAMENT_JOIN: 'tournament.join',
  TOURNAMENT_LEAVE: 'tournament.leave',
};

let _col = null;

async function getUserLogsCol() {
  if (_col) return _col;
  const db = await getDb();
  _col = db.collection('user_logs');
  return _col;
}

/**
 * Write a user activity log entry.
 * @param {object} params
 * @param {string} params.uid - User ID
 * @param {string} params.action - Action type (use LOG_ACTIONS constants)
 * @param {object} [params.details] - Additional details (kept small)
 * @param {string} [params.ip] - IP address
 * @param {string} [params.userAgent] - User agent string
 */
export async function logUserActivity({ uid, action, details = {}, ip = '', userAgent = '' }) {
  try {
    if (!uid || !action) return;
    const col = await getUserLogsCol();
    const entry = {
      uid: String(uid),
      action: String(action),
      details: sanitizeDetails(details),
      ip: String(ip || '').slice(0, 100),
      userAgent: String(userAgent || '').slice(0, 300),
      createdAt: Date.now(),
    };
    await col.insertOne(entry);
  } catch (e) {
    // Never let logging failure break the main flow
    logger.error('[userLogger] Failed to write log:', e.message);
  }
}

/**
 * Sanitize details object - keep it small and safe
 */
function sanitizeDetails(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const clean = {};
  const MAX_KEYS = 15;
  const MAX_VALUE_LEN = 500;
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (count >= MAX_KEYS) break;
    if (typeof value === 'string') {
      clean[key] = value.slice(0, MAX_VALUE_LEN);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (value === null || value === undefined) {
      clean[key] = null;
    } else {
      clean[key] = JSON.stringify(value).slice(0, MAX_VALUE_LEN);
    }
    count++;
  }
  return clean;
}

/**
 * Extract IP and User-Agent from request
 */
export function extractRequestMeta(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || '';
  const userAgent = req.headers['user-agent'] || '';
  return { ip, userAgent };
}

/**
 * Ensure indexes for user_logs collection
 */
export async function ensureUserLogsIndexes() {
  try {
    const col = await getUserLogsCol();
    await col.createIndex({ uid: 1, createdAt: -1 });
    await col.createIndex({ action: 1, createdAt: -1 });
    await col.createIndex({ createdAt: -1 });
    await col.createIndex({ uid: 1, action: 1, createdAt: -1 });
    logger.info('[userLogger] Indexes ensured');
  } catch (e) {
    logger.error('[userLogger] Failed to ensure indexes:', e.message);
  }
}

export default { logUserActivity, extractRequestMeta, LOG_ACTIONS, ensureUserLogsIndexes };

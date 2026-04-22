import jwt from 'jsonwebtoken';
import { logger } from '../logger.mjs';
import { ensureUser } from '../users.mjs';

const getSecret = () => process.env.APP_JWT_SECRET || '';

export function getBearerToken(req) {
  const h = req.headers?.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function parseCookies(cookieHeader = '') {
  const out = {};
  cookieHeader.split(';').forEach((part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(v.join('=') || '');
  });
  return out;
}

export function cookieSerialize(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  return parts.join('; ');
}

export const b64url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

export function verifyAppToken(token) {
  const secret = getSecret();
  if (!secret) throw new Error('APP_JWT_SECRET not set');
  return jwt.verify(token, secret);
}

export async function requireUser(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies.xq_token || getBearerToken(req);
  
  if (!token) return null;

  try {
    let decoded = verifyAppToken(token);
    
    // Auto-resolve missing UID if SUB is present (for thin social tokens)
    if (decoded && !decoded.uid && decoded.sub) {
      const dbUser = await ensureUser(decoded);
      if (dbUser) {
        decoded = { ...decoded, uid: dbUser.uid };
      }
    }
    
    return decoded;
  } catch (err) {
    if (err.name === 'JsonWebTokenError' && err.message === 'invalid signature') {
      logger.debug(`[requireUser] Stale/Invalid signature token (likely secret sync): ${req.path}`);
      return null;
    }
    logger.error(`[requireUser] Auth failed: ${err.message}`, { path: req.path });
    return null;
  }
}

export async function requireAdmin(req, res, next) {
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  
  const { ensureUserFromJwtPayload } = await import('../users.mjs');
  const dbUser = await ensureUserFromJwtPayload(user);
  
  if (!dbUser || dbUser.sysRole !== 'admin') {
    return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
  }
  
  req.user = dbUser;
  next();
}

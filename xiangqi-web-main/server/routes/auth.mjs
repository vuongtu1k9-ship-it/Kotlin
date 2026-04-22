import express from 'express';
import { logger } from '../logger.mjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { makeLocalSub, makePasswordRecord, normalizeEmail, verifyPassword as verifyLocalPassword } from '../localAuth.mjs';
import { getUsersCol } from '../mongo.mjs';
import { ensureUser, ensureUserFromJwtPayload, transformUser } from '../users.mjs';
import { cookieSerialize, b64url, parseCookies, verifyAppToken, requireUser } from '../utils/auth.mjs';
import { checkRateLimit } from '../services/cache.mjs';
import { logUserActivity, extractRequestMeta, LOG_ACTIONS } from '../services/userLogger.mjs';
import { sanitizeHtml, isValidPictureUrl } from '../utils/security.mjs';
import { getConfig } from '../services/siteConfig.mjs';

const router = express.Router();

const APP_JWT_SECRET = process.env.APP_JWT_SECRET || '';


// Helper to get fresh auth config
async function getAuthConfig() {
  const [clientId, jwtSecret, publicBaseUrl, authBaseUrl, cookieDomain, allowListStr] = await Promise.all([
    getConfig('google.clientId'),
    getConfig('auth.jwtSecret'),
    process.env.PUBLIC_BASE_URL || 'https://cotuong.xyz',
    process.env.AUTH_BASE_URL || 'https://auth.cotuong.xyz',
    process.env.COOKIE_DOMAIN || '',
    process.env.PUBLIC_BASE_URL_ALLOWLIST || ''
  ]);

  // clientSecret is not part of siteConfig (it's a server secret)
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  const allowList = new Set(
    String(allowListStr)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  );

  const googleClient = clientId ? new OAuth2Client(clientId) : null;

  return { clientId, clientSecret, jwtSecret, publicBaseUrl, authBaseUrl, cookieDomain, allowList, googleClient };
}

async function getPublicOrigin(req) {
  const cfg = await getAuthConfig();
  const fallback = cfg.publicBaseUrl;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || new URL(fallback).protocol.replace(':', '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) return fallback;

  const candidate = `${proto}://${host}`;
  if (candidate === fallback) return candidate;
  if (cfg.allowList.has(candidate)) return candidate;
  return fallback;
}

router.get('/oauth/google/start', async (req, res) => {
  const cfg = await getAuthConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    return res.status(500).send('GOOGLE_OAUTH_NOT_CONFIGURED');
  }

  const state = b64url(crypto.randomBytes(16));
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());

  // Force redirect URI to the dedicated auth domain (SSO hub)
  const redirectUri = `${cfg.authBaseUrl}/api/oauth/google/callback`;

  // Support returnTo for subdomains
  const returnTo = String(req.query?.returnTo || '');
  // If no returnTo but current host is NOT auth domain, default return to current host
  const effectiveReturnTo = returnTo || (req.headers.host && !req.headers.host.includes('auth.') ? `${req.protocol}://${req.headers.host}` : '');

  const returnCookie = effectiveReturnTo ? [cookieSerialize('xq_oauth_return', effectiveReturnTo, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 300 })] : [];

  res.setHeader('Set-Cookie', [
    cookieSerialize('xq_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 300 }),
    cookieSerialize('xq_oauth_verifier', verifier, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 300 }),
    ...returnCookie,
  ]);

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/oauth/google/callback', async (req, res) => {
  try {
    const code = req.query?.code;
    const state = req.query?.state;
    if (!code || !state) return res.status(400).send('MISSING_CODE_OR_STATE');

    const cookies = parseCookies(req.headers.cookie || '');
    if (!cookies.xq_oauth_state || !cookies.xq_oauth_verifier) return res.status(400).send('MISSING_PKCE_COOKIE');
    if (cookies.xq_oauth_state !== state) return res.status(400).send('BAD_STATE');

    const cfg = await getAuthConfig();
    const publicOrigin = await getPublicOrigin(req);
    // Callback redirect URI MUST match what was sent to Google (dedicated auth domain)
    const redirectUri = `${cfg.authBaseUrl}/api/oauth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: cookies.xq_oauth_verifier,
      }).toString(),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) return res.status(500).send(`TOKEN_EXCHANGE_FAILED: ${JSON.stringify(tokenJson)}`);

    const idToken = tokenJson.id_token;
    if (!idToken) return res.status(500).send('NO_ID_TOKEN');

    if (!cfg.googleClient || !cfg.clientId) return res.status(500).send('GOOGLE_CLIENT_ID_NOT_SET');
    if (!cfg.jwtSecret) return res.status(500).send('APP_JWT_SECRET_NOT_SET');

    const ticket = await cfg.googleClient.verifyIdToken({ idToken, audience: cfg.clientId });
    const p = ticket.getPayload();
    if (!p || !p.sub) {
      logger.error('[AUTH] Google token verification failed (no payload or sub)');
      return res.status(401).send('BAD_GOOGLE_TOKEN');
    }
    logger.info(`[AUTH] Google token verified for ${p.email} (sub: ${p.sub})`);

    const dbUser = await ensureUser({
      sub: p.sub,
      email: p.email,
      name: p.name,
      picture: (await import('../utils/security.mjs')).isValidPictureUrl(p.picture) ? p.picture : null,
      provider: 'google',
    });

    const userPayload = {
      sub: dbUser.sub,
      uid: dbUser.uid,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture ? `/api/avatars/${dbUser.uid}` : null,
      provider: 'google',
    };

    if (dbUser.picture) {
      const { downloadAndValidateAvatar } = await import('../services/avatarService.mjs');
      downloadAndValidateAvatar(dbUser.uid, dbUser.picture)
        .then(() => logger.info(`[AUTH] ✅ Avatar processed for ${dbUser.uid}`))
        .catch(err => logger.warn(`[AUTH] ⚠️ Avatar processing failed for ${dbUser.uid}: ${err.message}`));
    }

    const appToken = jwt.sign(userPayload, cfg.jwtSecret, { expiresIn: '7d' });

    logger.info(`[AUTH] Setting xq_token for user ${dbUser.uid} with domain: ${cfg.cookieDomain || '(none)'}`);
    res.setHeader('Set-Cookie', [
      cookieSerialize('xq_oauth_state', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0 }),
      cookieSerialize('xq_oauth_verifier', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0 }),
      cookieSerialize('xq_oauth_return', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0 }),
      cookieSerialize('xq_token', appToken, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7, domain: cfg.cookieDomain }),
    ]);

    const meta = extractRequestMeta(req);
    logUserActivity({ uid: dbUser.uid, action: LOG_ACTIONS.LOGIN_GOOGLE, details: { email: p.email, domain: cfg.cookieDomain }, ...meta });

    // Redirect to returnTo if present (SSO support)
    const returnTo = cookies.xq_oauth_return;
    if (returnTo) {
      // Basic validation: must start with http or be relative
      try {
        const url = new URL(returnTo);
        const apexDomain = cfg.publicBaseUrl.replace(/^https?:\/\//, '');
        if (url.hostname.endsWith(apexDomain)) {
          return res.redirect(returnTo);
        }
      } catch (e) {
        // ignore invalid urls
      }
    }

    // Redirect to root SPA (legacy: /app/)
    return res.redirect(`${publicOrigin}/`);
  } catch (e) {
    return res.status(500).send(`OAUTH_CALLBACK_ERROR: ${String(e?.message || e)}`);
  }
});

// Legacy GIS endpoint (optional): exchange a Google ID token (GIS "credential") for an app JWT.
router.post('/auth/google', async (req, res) => {
  try {
    const cfg = await getAuthConfig();
    if (!cfg.googleClient || !cfg.clientId) {
      return res.status(500).json({ ok: false, error: 'GOOGLE_CLIENT_ID_NOT_SET' });
    }
    if (!cfg.jwtSecret) {
      return res.status(500).json({ ok: false, error: 'APP_JWT_SECRET_NOT_SET' });
    }

    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIAL' });

    // Rate limiting: 10 attempts per 5 minutes per IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!(await checkRateLimit(`rate:auth:google:${ip}`, 10, 300))) {
      return res.status(429).json({ ok: false, error: 'TOO_MANY_REQUESTS' });
    }

    const ticket = await cfg.googleClient.verifyIdToken({
      idToken: credential,
      audience: cfg.clientId,
    });

    const p = ticket.getPayload();
    if (!p || !p.sub) return res.status(401).json({ ok: false, error: 'BAD_GOOGLE_TOKEN' });

    const dbUser = await ensureUser({
      sub: p.sub,
      email: p.email,
      name: p.name,
      picture: (await import('../utils/security.mjs')).isValidPictureUrl(p.picture) ? p.picture : null,
      provider: 'google',
    });

    const userPayload = {
      sub: dbUser.sub,
      uid: dbUser.uid,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture ? `/api/avatars/${dbUser.uid}` : null,
      provider: 'google',
    };

    if (dbUser.picture) {
      const { downloadAndValidateAvatar } = await import('../services/avatarService.mjs');
      downloadAndValidateAvatar(dbUser.uid, dbUser.picture)
        .then(() => logger.info(`[AUTH] ✅ Avatar processed for ${dbUser.uid}`))
        .catch(err => logger.warn(`[AUTH] ⚠️ Avatar processing failed for ${dbUser.uid}: ${err.message}`));
    }

    const appToken = jwt.sign(userPayload, cfg.jwtSecret, { expiresIn: '7d' });

    res.setHeader('Set-Cookie', [
      cookieSerialize('xq_token', appToken, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7, domain: cfg.cookieDomain }),
    ]);

    const meta = extractRequestMeta(req);
    logUserActivity({ uid: dbUser.uid, action: LOG_ACTIONS.LOGIN_GOOGLE, details: { email: p.email }, ...meta });

    return res.json({ ok: true, token: appToken, user: transformUser(dbUser) });
  } catch (e) {
    logger.error('[AUTH] ❌ POST /auth/google exchange failed:', e.message);
    return res.status(401).json({ ok: false, error: 'GOOGLE_AUTH_FAILED' });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    if (!APP_JWT_SECRET) return res.status(500).json({ ok: false, error: 'APP_JWT_SECRET_NOT_SET' });

    const { email, password, name, picture, elo } = req.body || {};

    const { isSpamEmail } = await import('../utils/security.mjs');
    const emailLower = normalizeEmail(email);
    if (!emailLower || isSpamEmail(emailLower)) {
      return res.status(400).json({ ok: false, error: 'BAD_EMAIL' });
    }
    if (!password || String(password).length < 6) return res.status(400).json({ ok: false, error: 'WEAK_PASSWORD' });

    // BUG-03: Rate limiting for registration (5 attempts/min)
    const ipStr = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const ips = ipStr.split(',').map(s => s.trim());
    const isLocal = ips.some(ip => 
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip === '::ffff:127.0.0.1' || 
      ip.startsWith('192.168.') || 
      ip.startsWith('10.') || 
      ip.startsWith('172.16.')
    );
    
    if (!isLocal && !(await checkRateLimit(`rate:auth:register:${ips[0]}`, 10, 60))) {
      return res.status(429).json({ ok: false, error: 'TOO_MANY_REQUESTS' });
    }

    const users = await getUsersCol();
    const exists = await users.findOne({ emailLower }, { projection: { _id: 1 } });
    if (exists) {
      logger.warn(`[AUTH] Registration failed: Email already taken - ${emailLower}`);
      return res.status(409).json({ ok: false, error: 'EMAIL_TAKEN' });
    }

    const sub = makeLocalSub(emailLower);
    const now = Date.now();
    const { salt, hash } = makePasswordRecord(String(password));

    const sanitizedName = sanitizeHtml(String(name || '').trim()) || emailLower;

    if (picture && !isValidPictureUrl(picture)) {
      return res.status(400).json({ ok: false, error: 'INVALID_PICTURE_FORMAT' });
    }
    const safePicture = picture || null;

    await users.insertOne({
      sub,
      provider: 'local',
      email: String(email).trim(),
      emailLower,
      passSalt: salt,
      passHash: hash,
      name: sanitizedName,
      picture: safePicture,
      createdAt: now,
      updatedAt: now,
      elo: Number(elo) || 1200,
      gamesPlayed: 0,
    });

    if (safePicture) {
      const { downloadAndValidateAvatar } = await import('../services/avatarService.mjs');
      downloadAndValidateAvatar(sub, safePicture)
        .then(() => logger.info(`[AUTH] ✅ Avatar processed for new user ${sub}`))
        .catch(err => logger.warn(`[AUTH] ⚠️ Avatar processing failed for ${sub}: ${err.message}`));
    }

    const dbUser = await ensureUser({ sub, provider: 'local', email: emailLower, name: sanitizedName, picture: safePicture });
    const userPayload = { 
      sub: dbUser.sub, 
      uid: dbUser.uid, 
      provider: 'local', 
      email: dbUser.email, 
      name: dbUser.name, 
      picture: dbUser.picture ? `/api/avatars/${dbUser.uid}` : null 
    };


    const cfg = await getAuthConfig();
    const token = jwt.sign(userPayload, cfg.jwtSecret, { expiresIn: '30d' });

    res.setHeader('Set-Cookie', [
      cookieSerialize('xq_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30, domain: cfg.cookieDomain }),
    ]);

    const meta = extractRequestMeta(req);
    logUserActivity({ uid: dbUser.uid, action: LOG_ACTIONS.REGISTER, details: { email: emailLower, name: dbUser.name }, ...meta });

    return res.json({ ok: true, token, user: transformUser(dbUser) });
  } catch (e) {
    logger.error('[AUTH] ❌ POST /auth/register failed:', e.message);
    return res.status(500).json({ ok: false, error: 'REGISTER_FAILED' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    if (!APP_JWT_SECRET) return res.status(500).json({ ok: false, error: 'APP_JWT_SECRET_NOT_SET' });

    const { email, password } = req.body || {};
    const emailLower = normalizeEmail(email);
    if (!emailLower) return res.status(400).json({ ok: false, error: 'BAD_EMAIL' });

    // BUG-03: Rate limiting for login (5 attempts/min)
    const ipStr = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const ips = ipStr.split(',').map(s => s.trim());
    const isLocal = ips.some(ip => 
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip === '::ffff:127.0.0.1' || 
      ip.startsWith('192.168.') || 
      ip.startsWith('10.') || 
      ip.startsWith('172.16.')
    );
    
    if (!isLocal && !(await checkRateLimit(`rate:auth:login:${ips[0]}`, 30, 60))) {
      return res.status(429).json({ ok: false, error: 'TOO_MANY_REQUESTS' });
    }

    const users = await getUsersCol();
    const u = await users.findOne({ emailLower });
    
    if (!u) {
      logger.warn(`[AUTH] Login failed: User not found - ${emailLower} from ip=${ip}`);
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }
    
    if (u.provider !== 'local' || !u.passSalt || !u.passHash) {
      logger.warn(`[AUTH] Login failed: Invalid provider or missing passHash for ${emailLower}`);
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const ok = verifyLocalPassword(String(password || ''), String(u.passSalt), String(u.passHash));
    if (!ok) {
      logger.warn(`[AUTH] Login failed: Password mismatch for ${emailLower}`);
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const cfg = await getAuthConfig();
    const userPayload = { sub: u.sub, uid: u.uid, provider: 'local', email: u.email, name: u.name };
    const token = jwt.sign(userPayload, cfg.jwtSecret, { expiresIn: '30d' });

    res.setHeader('Set-Cookie', [
      cookieSerialize('xq_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30, domain: cfg.cookieDomain }),
    ]);

    const meta = extractRequestMeta(req);
    logUserActivity({ uid: u.uid, action: LOG_ACTIONS.LOGIN, details: { email: u.email }, ...meta });

    return res.json({ ok: true, token, user: transformUser(u) });
  } catch (e) {
    logger.error('[AUTH] ❌ POST /auth/login failed:', e.message);
    return res.status(500).json({ ok: false, error: 'LOGIN_FAILED' });
  }
});

router.post('/auth/guest', async (req, res) => {
  try {
    const cfg = await getAuthConfig();
    if (!cfg.jwtSecret) return res.status(500).json({ ok: false, error: 'APP_JWT_SECRET_NOT_SET' });
    const sub = `guest:${crypto.randomUUID()}`;
    const dbUser = await ensureUser({ sub, provider: 'guest', name: 'Guest' });
    const userPayload = { sub: dbUser.sub, uid: dbUser.uid, provider: 'guest', name: dbUser.name };
    const token = jwt.sign(userPayload, cfg.jwtSecret, { expiresIn: '365d' });

    // Session cookie (optional; client also stores token in localStorage)
    res.setHeader('Set-Cookie', [
      cookieSerialize('xq_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 365, domain: cfg.cookieDomain }),
    ]);

    const meta = extractRequestMeta(req);
    logUserActivity({ uid: dbUser.uid, action: LOG_ACTIONS.LOGIN_GUEST, ...meta });

    return res.json({ ok: true, token, user: transformUser(dbUser) });
  } catch (e) {
    logger.error('[AUTH] ❌ POST /auth/guest failed:', e.message);
    return res.status(500).json({ ok: false, error: 'GUEST_TOKEN_FAILED' });
  }
});

router.get('/auth/me', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const payload = await requireUser(req);
  if (!payload) {
    // If we have a cookie but it's invalid, tell the client to clear it to stop the error loop
    if (req.headers.cookie?.includes('xq_token=')) {
      const cfg = await getAuthConfig();
      res.setHeader('Set-Cookie', [
        cookieSerialize('xq_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0, domain: cfg.cookieDomain, path: '/' }),
      ]);
    }
    return res.json({ ok: false, error: 'INVALID_TOKEN' });
  }
  try {
    const dbUser = await ensureUserFromJwtPayload(payload);
    
    // Daily Reward Logic
    const now = Date.now();
    const lastAt = dbUser?.lastDailyRewardAt || 0;
    const today = new Date().setHours(0, 0, 0, 0);
    const lastDay = new Date(lastAt).setHours(0, 0, 0, 0);

    let updatedDbUser = dbUser;
    if (today > lastDay) {
      const users = await getUsersCol();
      const isConsecutive = today - lastDay === 86400000;
      const newStreak = isConsecutive ? (dbUser.loginStreak || 0) + 1 : 1;
      
      const coinsReward = 10;
      await users.updateOne(
        { uid: payload.uid },
        { 
          $set: { lastDailyRewardAt: now, loginStreak: newStreak },
          $inc: { 'inventory.coins': coinsReward }
        }
      );
      updatedDbUser = await users.findOne({ uid: payload.uid });
    }

    const cfg = await getAuthConfig();
    const token = jwt.sign({ sub: updatedDbUser.sub, uid: updatedDbUser.uid, provider: updatedDbUser.provider, email: updatedDbUser.email, name: updatedDbUser.name }, cfg.jwtSecret, { expiresIn: '30d' });

    return res.json({ 
      ok: true, 
      token,
      user: transformUser({ 
        sub: updatedDbUser?.sub || payload.sub,
        uid: updatedDbUser?.uid || payload.uid,
        email: updatedDbUser?.email || payload.email,
        name: updatedDbUser?.name || payload.name,
        picture: updatedDbUser?.picture || payload.picture,
        provider: updatedDbUser?.provider || payload.provider,
        sysRole: updatedDbUser?.sysRole || 'user',
        inventory: updatedDbUser?.inventory || { ring: 0, bear: 0, candy: 0, coins: 0 },
        learningProgress: updatedDbUser?.learningProgress || {},
        lastDailyRewardAt: updatedDbUser?.lastDailyRewardAt || 0,
        loginStreak: updatedDbUser?.loginStreak || 0,
        elo: updatedDbUser?.elo || 1200,
        gamesPlayed: updatedDbUser?.gamesPlayed || 0
      })
    });
  } catch (e) {
    logger.warn('[AUTH] ⚠️ GET /auth/me daily reward logic failed:', e.message);
    return res.json({ ok: true, user: payload });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (user?.uid) {
      logUserActivity({ uid: user.uid, action: LOG_ACTIONS.LOGOUT, details: {} })
        .catch(err => logger.warn(`[AUTH] ⚠️ Logout activity logging failed for ${user.uid}: ${err.message}`));
      logger.info(`[AUTH] 🚪 User logged out: ${user.uid}`);
    }
  } catch (e) {
    logger.error(`[Auth] ❌ POST /auth/logout failure:`, e.message);
  }

  const cfg = await getAuthConfig();
  res.setHeader('Set-Cookie', [
    cookieSerialize('xq_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0, path: '/' }),
    cookieSerialize('xq_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0, domain: cfg.cookieDomain || '.cotuong.xyz', path: '/' }),
    cookieSerialize('xq_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0, domain: 'cotuong.xyz', path: '/' }),
  ]);
  res.json({ ok: true });
});

router.post('/auth/password', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    if (String(newPassword).length < 6) return res.status(400).json({ ok: false, error: 'WEAK_PASSWORD' });

    const users = await getUsersCol();
    const u = await users.findOne({ uid: user.uid });
    if (!u) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

    if (u.provider !== 'local') return res.status(400).json({ ok: false, error: 'NOT_LOCAL_USER' });

    const ok = verifyLocalPassword(String(oldPassword), String(u.passSalt), String(u.passHash));
    if (!ok) return res.status(401).json({ ok: false, error: 'INVALID_OLD_PASSWORD' });

    const { salt, hash } = makePasswordRecord(String(newPassword));
    await users.updateOne({ uid: user.uid }, { 
      $set: { 
        passSalt: salt, 
        passHash: hash, 
        updatedAt: Date.now() 
      } 
    });

    return res.json({ ok: true });
  } catch (e) {
    logger.error('[AUTH] ❌ POST /auth/password failed:', e.message);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

export default router;

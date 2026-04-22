import express from 'express';
import { logger } from '../../logger.mjs';
import { getUsersCol } from '../../mongo.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { redisClient } from '../../services/cache.mjs';
import { getRealIp } from '../../utils/ip.mjs';
import { resolveUser, getAvatarUrl } from '../../utils/userHelpers.mjs';
import { safeString, sanitizeHtml } from '../../utils/security.mjs';

const router = express.Router();

router.get('/users/:id/summary', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    const u = await resolveUser(id);
    if (!u) {
      logger.debug(`GET /users/:id/summary - User not found: ${id}`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }

    const cacheKey = `user:summary:${u.uid}`;
    let publicData = null;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) publicData = JSON.parse(cached);
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    if (!publicData) {
      const usersCol = await getUsersCol();
      const rank = (await usersCol.countDocuments({ elo: { $gt: u.elo ?? 1200 } })) + 1;
      publicData = {
        user: { uid: u.uid, name: u.name, picture: getAvatarUrl(u), notificationSettings: u.notificationSettings || { roomInvitations: true } },
        elo: Number(u.elo ?? 1200),
        rank,
        gamesPlayed: Number(u.gamesPlayed ?? 0),
        followersCount: u.followerUids?.length || 0,
        followingCount: u.followingUids?.length || 0,
        inventory: u.inventory || {},
        _followerUids: u.followerUids || [],
        _followingUids: u.followingUids || [],
      };
      if (redisClient?.isReady) {
        try { await redisClient.setEx(cacheKey, 300, JSON.stringify(publicData)); } catch (e) { logger.debug(`[REDIS] SET ${cacheKey} failed`, e); }
      }
    }

    const reqUser = await requireUser(req);
    let isFollowing = false;
    if (reqUser?.uid) isFollowing = (publicData._followerUids || []).includes(reqUser.uid);

    const userToReturn = { ...publicData.user };
    if (userToReturn.picture && (userToReturn.picture.startsWith('http'))) {
      userToReturn.picture = `/api/avatars/${userToReturn.uid}.webp`;
    }

    const resData = {
      ok: true, user: userToReturn, elo: publicData.elo, rank: publicData.rank, 
      gamesPlayed: publicData.gamesPlayed, followersCount: publicData.followersCount, 
      followingCount: publicData.followingCount, isFollowing, inventory: publicData.inventory,
    };

    if (reqUser?.uid && reqUser.uid === u.uid) {
      resData.user.notificationSettings = u.notificationSettings || { roomInvitations: true };
    }
    return res.json(resData);
  } catch (e) {
    logger.error('GET /users/:id/summary failed', e);
    return res.status(500).json({ ok: false, error: 'SUMMARY_FAILED' });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    const { name, picture } = req.body;
    const users = await getUsersCol();
    const update = { updatedAt: Date.now() };

    if (name !== undefined) {
      const trimmedName = String(name || '').trim();
      if (!trimmedName || trimmedName.length < 2) return res.status(400).json({ ok: false, error: 'NAME_TOO_SHORT' });
      if (trimmedName.length > 50) return res.status(400).json({ ok: false, error: 'NAME_TOO_LONG' });
      const sanitizedName = sanitizeHtml(trimmedName);
      if (!sanitizedName || sanitizedName.length < 2) return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
      update.name = sanitizedName;
    }

    if (picture !== undefined) {
      const { isValidPictureUrl } = await import('../../utils/security.mjs');
      const isLocalProxy = typeof picture === 'string' && (picture.startsWith('/api/avatars/') || picture.includes('cotuong.xyz/api/avatars/'));
      if (picture && !isLocalProxy && !isValidPictureUrl(picture)) return res.status(400).json({ ok: false, error: 'INVALID_PICTURE_FORMAT' });

      if (!isLocalProxy) {
        update.picture = picture || null;
        if (update.picture) {
          const { downloadAndValidateAvatar } = await import('../../services/avatarService.mjs');
          downloadAndValidateAvatar(user.uid, update.picture).catch((err) => {
            logger.warn(`[USERS] Background avatar download failed for ${user.uid}:`, err);
          });
        }
      }
    }

    await users.updateOne({ uid: user.uid }, { $set: update });

    if (redisClient?.isReady) {
      try {
        const keys = await redisClient.keys('players:*');
        if (keys.length > 0) await redisClient.del(keys);
        await redisClient.del(`user:summary:${user.uid}`);
      } catch (e) { logger.error('[profile] Redis invalidation failed', e); }
    }
    return res.json({ ok: true, name: update.name, picture: update.picture });
  } catch (e) {
    logger.error('POST /profile failed', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.patch('/profile/settings', requireUser, async (req, res) => {
  try {
    const { notificationSettings } = req.body;
    if (!notificationSettings) return res.status(400).json({ ok: false, error: 'MISSING_SETTINGS' });
    const users = await getUsersCol();
    await users.updateOne({ uid: req.user.uid }, { $set: { notificationSettings, updatedAt: Date.now() } });
    return res.json({ ok: true });
  } catch (e) {
    logger.error('PATCH /profile/settings failed', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

export default router;

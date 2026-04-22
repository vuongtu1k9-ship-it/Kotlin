import express from 'express';
import { logger } from '../logger.mjs';
import { getUsersCol, getGamesCol, getPuzzleSolutionsCol, getPuzzlesCol } from '../mongo.mjs';
import { ObjectId } from 'mongodb';
import { requireUser } from '../utils/auth.mjs';
import { saveSubscription } from '../push.mjs';
import { redisClient } from '../services/cache.mjs';
import { attachThumbnailsToGames } from '../services/thumbnailHelper.mjs';
import { safeString, escapeRegex, safeNumber, sanitizeHtml } from '../utils/security.mjs';
import { getRealIp } from '../utils/ip.mjs';
import { getConfig } from '../services/siteConfig.mjs';
import { resolveUser, getAvatarUrl } from '../utils/userHelpers.mjs';
import { getParticipantFilter, getGameStatus, fetchPlayerSummaries, getPlayerNames, getPlayerUids } from '../utils/gameHelpers.mjs';

const router = express.Router();

router.get('/me/active-game', requireUser, async (req, res) => {
  try {
    const { findActiveRoomForUid } = await import('../services/roomManager.mjs');
    const roomId = await findActiveRoomForUid(req.user.uid);
    res.json({ ok: true, roomId });
  } catch (e) {
    logger.error('[USERS] /me/active-game failed:', e);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

router.get('/players', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const page = Math.max(1, safeNumber(req.query?.page, 1));
    const limit = Math.max(1, Math.min(200, safeNumber(req.query?.limit, 100)));
    const search = safeString(req.query?.search);
    
    const cacheKey = `players:${limit}:${page}:${search || 'all'}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`[REDIS] GET ${cacheKey} miss/failed`, e); }
    }

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { uid: { $regex: safeSearch, $options: 'i' } },
        { slug: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const users = await getUsersCol();
    const total = await users.countDocuments(query);
    const list = await users
      .find(query, { projection: { _id: 0, uid: 1, slug: 1, name: 1, picture: 1, elo: 1, gamesPlayed: 1 } })
      .sort({ elo: -1, gamesPlayed: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const { onlineUids, playingRoomByUid, customStatusByUid } = await import('../socket/presence.mjs');

    const response = {
      ok: true,
      players: list.map((u) => ({
        ...u,
        picture: u.picture ? `/api/avatars/${u.uid}.webp` : null,
        elo: Number(u.elo ?? 1200),
        gamesPlayed: Number(u.gamesPlayed ?? 0),
        online: onlineUids.has(u.uid),
        customStatus: customStatusByUid.get(u.uid) || u.customStatus || 'online',
        playingRoomId: playingRoomByUid.get(u.uid) || null,
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };

    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 30, JSON.stringify(response)); } catch (e) { logger.debug(`[REDIS] SET ${cacheKey} failed`, e); }
    }
    return res.json(response);
  } catch (e) {
    logger.error('GET /players failed', e);
    return res.status(500).json({ ok: false, error: 'PLAYERS_FAILED' });
  }
});

router.get('/users/:id/summary', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    const u = await resolveUser(id);

    if (!u) {
      logger.debug(`GET /users/:id/summary - User not found: ${id}`, {
        ip: getRealIp(req),
        ua: req.get('user-agent'),
        path: req.path
      });
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }


    logger.info(`[users] summary FOUND for id="${id}" (UID: ${u.uid})`);

    // Cache public profile data (rank is expensive - cache separately)
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
        user: { 
          uid: u.uid, 
          name: u.name, 
          picture: getAvatarUrl(u), 
          notificationSettings: u.notificationSettings || { roomInvitations: true } 
        },
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

    // isFollowing is per-requester, not cached
    const reqUser = await requireUser(req);
    let isFollowing = false;
    if (reqUser?.uid) {
      isFollowing = (publicData._followerUids || []).includes(reqUser.uid);
    }

    const userToReturn = { ...publicData.user };
    if (userToReturn.picture && (userToReturn.picture.startsWith('http'))) {
      userToReturn.picture = `/api/avatars/${userToReturn.uid}.webp`;
    }

    const resData = {
      ok: true,
      user: userToReturn,
      elo: publicData.elo,
      rank: publicData.rank,
      gamesPlayed: publicData.gamesPlayed,
      followersCount: publicData.followersCount,
      followingCount: publicData.followingCount,
      isFollowing,
      inventory: publicData.inventory,
    };

    // Only expose notificationSettings to the owner
    if (reqUser?.uid && reqUser.uid === u.uid) {
      resData.user.notificationSettings = u.notificationSettings || { roomInvitations: true };
    }

    return res.json(resData);
  } catch (e) {
    logger.error('GET /users/:id/summary failed', e);
    return res.status(500).json({ ok: false, error: 'SUMMARY_FAILED' });
  }
});

router.get('/users/:id/games', async (req, res) => {
  try {
    const id = safeString(req.params.id);
    const limit = safeNumber(req.query?.limit, 50);
    const validLimit = Math.max(1, Math.min(200, limit));
    const users = await getUsersCol();
    const games = await getGamesCol();

    // Resolve id to uid
    const u = await resolveUser(id);
    const uid = u ? u.uid : id;


    // Determine if the requesting user is one of the two players
    // (private games are only visible to participants)
    const reqUser = await requireUser(req);
    const requesterUid = reqUser?.uid || null;
    const isParticipant = requesterUid === uid;

    const playerFilter = getParticipantFilter(uid, isParticipant);

    const docs = await games
      .find(playerFilter,
        { projection: { _id: 1, status: 1, timeMode: 1, updatedAt: 1, createdAt: 1, state: 1, position: 1, lastposition: 1, isPrivate: 1, players: 1 } }
      )
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
    
    const uidsToFetch = new Set();
    docs.forEach(d => {
      const uids = getPlayerUids(d);
      if (uids.red) uidsToFetch.add(String(uids.red));
      if (uids.black) uidsToFetch.add(String(uids.black));
    });
    const playerSummaries = await fetchPlayerSummaries(Array.from(uidsToFetch));

    await attachThumbnailsToGames(docs);

    const list = docs.map((d) => {
      const ps = getPlayerUids(d);
      const st = d.state || {};
      const status = getGameStatus(d);
      const pNames = getPlayerNames(d);
      return {
        gameId: d._id,
        status,
        timeMode: d.timeMode || st.timeMode || 'standard',
        finished: status === 'finished',
        winner: st.winner ?? null,
        endedBy: st.endedBy ?? null,
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
        thumbBoard: d.thumbBoard ?? null,
        thumbPosition: d.thumbPosition ?? null,
        players: {
          redUid: ps.red || null,
          blackUid: ps.black || null,
          redName: pNames.red || pNames.redName || playerSummaries.get(String(ps.red))?.name || (ps.red ? 'Kỳ thủ' : null),
          blackName: pNames.black || pNames.blackName || playerSummaries.get(String(ps.black))?.name || (ps.black ? 'Kỳ thủ' : null),
        }
      };
    });

    return res.json({ ok: true, games: list });
  } catch (e) {
    logger.debug('GET /users/:id/games failed', e);
    return res.status(500).json({ ok: false, error: 'USER_GAMES_FAILED' });
  }
});

router.post('/push/subscribe', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid && !user?.sub) {
    logger.warn(`POST /push/subscribe 401 - UNAUTHORIZED (IP: ${req.ip})`);
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ ok: false, error: 'MISSING_SUBSCRIPTION' });
    await saveSubscription(user.uid, subscription);
    return res.json({ ok: true });
  } catch (e) {
    logger.error('POST /push/subscribe failed', e);
    return res.status(500).json({ ok: false, error: 'SUBSCRIBE_FAILED' });
  }
});

// Public endpoint: serve VAPID public key to browser clients
// This key is public by design and safe to expose. It comes exclusively from Environment.
router.get('/push/vapid-key', async (_req, res) => {
  try {
    const key = await getConfig('push.vapidPublic');
    // Return 200 (OK) even if not configured to avoid log spam, let frontend handle null key
    return res.json({ ok: !!key, key: key || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.post('/users/status', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    const { status } = req.body;
    if (!['online', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'INVALID_STATUS' });
    }

    const users = await getUsersCol();
    await users.updateOne({ uid: user.uid }, { $set: { customStatus: status, updatedAt: Date.now() } });

    const { customStatusByUid, getIo } = await import('../socket/presence.mjs');
    customStatusByUid.set(user.uid, status);
    
    const io = getIo();
    if (io) {
      const { getPresenceForUid } = await import('../socket/presence.mjs');
      io.emit('presence:update', getPresenceForUid(user.uid));
      io.emit('presence:status_changed', { uid: user.uid, status });
    }
    
    return res.json({ ok: true });
  } catch (e) {
    logger.error('POST /users/status failed', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.post('/users/follow/:targetUid', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    const targetUid = safeString(req.params.targetUid);
    if (user.uid === targetUid) return res.status(400).json({ ok: false, error: 'CANNOT_FOLLOW_SELF' });

    const users = await getUsersCol();
    const currDbUser = await users.findOne({ uid: user.uid });
    const isFollowing = (currDbUser?.followingUids || []).includes(targetUid);
    
    if (isFollowing) {
      // Unfollow
      await users.updateOne({ uid: user.uid }, { $pull: { followingUids: targetUid } });
      await users.updateOne({ uid: targetUid }, { $pull: { followerUids: user.uid } });
    } else {
      // Follow
      await users.updateOne({ uid: user.uid }, { $addToSet: { followingUids: targetUid } });
      await users.updateOne({ uid: targetUid }, { $addToSet: { followerUids: user.uid } });
      
      const { getMessagesCol } = await import('../mongo.mjs');
      const msgCol = await getMessagesCol();
      const msgId = new (await import('mongodb')).ObjectId();
      await msgCol.insertOne({
        _id: msgId,
        fromUid: user.uid,
        fromName: user.name,
        fromPicture: user.picture || null,
        toUid: targetUid,
        type: 'new_follower',
        content: '',
        status: 'unread',
        createdAt: Date.now()
      });

      const { getIo } = await import('../socket/presence.mjs');
      const io = getIo();
      if (io) {
        io.to('user:' + targetUid).emit('new_follower', { uid: user.uid, name: user.name });
      }

      // Browser Push Notification
      try {
        const { sendNotification } = await import('../push.mjs');
        await sendNotification(targetUid, {
          title: 'Người theo dõi mới',
          body: `${user.name || 'Ai đó'} đã bắt đầu theo dõi bạn.`,
          data: { url: `/player/${user.uid}` }
        });
      } catch (pushErr) {
        logger.error('[Follow] Push notification failed', pushErr);
      }
    }

    if (redisClient?.isReady) {
      try {
        // Invalidate summary cache for both users so follow count is fresh
        await redisClient.del(`user:summary:${user.uid}`, `user:summary:${targetUid}`);
      } catch (e) { logger.debug('Redis del user summaries failed', e); }
    }

    return res.json({ ok: true, isFollowing: !isFollowing });
  } catch (e) {
    logger.error('POST /users/follow failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

router.get('/users/:uid/following', async (req, res) => {
  try {
    const targetUid = String(req.params.uid);
    if (!targetUid) return res.status(400).json({ ok: false, error: 'BAD_REQUEST' });

    const users = await getUsersCol();
    const currDbUser = await users.findOne({ uid: targetUid });
    const followingUids = currDbUser?.followingUids || [];

    if (followingUids.length === 0) return res.json({ ok: true, following: [] });

    const { onlineUids, playingRoomByUid, customStatusByUid } = await import('../socket/presence.mjs');
    const followingList = await users.find({ uid: { $in: followingUids } }).toArray();
    
    return res.json({
      ok: true,
      following: followingList.map(f => ({
        uid: f.uid,
        name: f.name,
        picture: f.picture || null,
        elo: Number(f.elo ?? 1200),
        online: onlineUids.has(f.uid),
        customStatus: customStatusByUid.get(f.uid) || f.customStatus || 'offline',
        playingRoomId: playingRoomByUid.get(f.uid) || null,
      })).sort((a,b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
    });
  } catch (e) {
    logger.error('GET /users/following failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

router.get('/users/:uid/followers', async (req, res) => {
  try {
    const targetUid = String(req.params.uid);
    if (!targetUid) return res.status(400).json({ ok: false, error: 'BAD_REQUEST' });

    const users = await getUsersCol();
    const currDbUser = await users.findOne({ uid: targetUid });
    const followerUids = currDbUser?.followerUids || [];

    if (followerUids.length === 0) return res.json({ ok: true, followers: [] });

    const { onlineUids, playingRoomByUid, customStatusByUid } = await import('../socket/presence.mjs');
    const followerList = await users.find({ uid: { $in: followerUids } }).toArray();
    
    return res.json({
      ok: true,
      followers: followerList.map(f => ({
        uid: f.uid,
        name: f.name,
        picture: f.picture ? `/api/avatars/${f.uid}.webp` : null,
        elo: Number(f.elo ?? 1200),
        online: onlineUids.has(f.uid),
        customStatus: customStatusByUid.get(f.uid) || f.customStatus || 'offline',
        playingRoomId: playingRoomByUid.get(f.uid) || null,
      })).sort((a,b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
    });
  } catch (e) {
    logger.error('GET /users/followers failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    logger.info(`[profile] Update request for user ${user.uid}:`, req.body);
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
      const { isValidPictureUrl } = await import('../utils/security.mjs');
      
      const isLocalProxy = typeof picture === 'string' && (picture.startsWith('/api/avatars/') || picture.includes('cotuong.xyz/api/avatars/'));
      
      if (picture && !isLocalProxy && !isValidPictureUrl(picture)) {
        return res.status(400).json({ ok: false, error: 'INVALID_PICTURE_FORMAT' });
      }

      if (isLocalProxy) {
        // Skip updating picture if it's already using our local proxy URL
        logger.debug(`[profile] Skipping picture update for ${user.uid} as it is already a proxy URL`);
      } else {
        update.picture = picture || null;
        
        // Trigger background cache update
        if (update.picture) {
          const { downloadAndValidateAvatar } = await import('../services/avatarService.mjs');
          downloadAndValidateAvatar(user.uid, update.picture).catch((err) => {
            logger.warn(`[USERS] Background avatar download failed for ${user.uid}:`, err);
          });
        }
      }
    }


    const result = await users.updateOne({ uid: user.uid }, { $set: update });
    logger.info(`[profile] DB update result for ${user.uid}:`, result);

    // Invalidate Redis cache for player lists and user summary
    if (redisClient?.isReady) {
      try {
        const keys = await redisClient.keys('players:*');
        if (keys.length > 0) await redisClient.del(keys);
        await redisClient.del(`user:summary:${user.uid}`);
        logger.info(`[profile] Invalidated cache for user ${user.uid}`);
      } catch (e) {
        logger.error('[profile] Redis invalidation failed', e);
      }
    }

    // Update session/cache if needed (in this app, AuthContext refreshes via /auth/me)
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
    await users.updateOne(
      { uid: req.user.uid },
      { $set: { notificationSettings, updatedAt: Date.now() } }
    );

    return res.json({ ok: true });
  } catch (e) {
    logger.error('PATCH /profile/settings failed', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.get('/users/:id/solves', async (req, res) => {
  try {
    const id = safeString(req.params.id).toLowerCase();
    const users = await getUsersCol();
    const solutionsCol = await getPuzzleSolutionsCol();
    const puzzlesCol = await getPuzzlesCol();

    // Resolve id (slug or uid) to actual uid
    const u = await users.findOne({ 
      $or: [ { uid: id }, { slug: id } ]
    });
    const uid = u ? u.uid : id;

    const cacheKey = `user:solves:${uid}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`Redis GET ${cacheKey} miss/failed`, e); }
    }

    // Fetch solutions for this user
    const solutions = await solutionsCol
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
      
    const puzzleIds = solutions.map(s => s.puzzleId);
    if (puzzleIds.length === 0) return res.json({ ok: true, solves: [] });

    // Fetch corresponding puzzle metadata (names, board thumbs)
    const puzzles = await puzzlesCol.find({
      $or: [
        { uid: { $in: puzzleIds } },
        { _id: { $in: puzzleIds.filter(pid => pid.length === 24 && ObjectId.isValid(pid)).map(pid => new ObjectId(pid)) } }
      ]
    }).toArray();

    // Mapping details
    const result = solutions.map(sol => {
      const p = puzzles.find(puz => puz.uid === sol.puzzleId || String(puz._id) === sol.puzzleId);
      return {
        uid: sol.puzzleId,
        solvedAt: sol.createdAt,
        moveCount: sol.moveCount,
        puzzleName: p?.name || 'Thế cờ ẩn',
        level: p?.level,
        thumbBoard: Array.isArray(p?.board) ? p.board : null
      };
    });

    const response = { ok: true, solves: result };
    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); } catch (e) { logger.debug(`Redis SET ${cacheKey} failed`, e); }
    }
    return res.json({ ok: true, solves: result });
    } catch (e) {
    logger.error('GET /users/:id/solves failed', e);
    return res.status(500).json({ ok: false, error: 'SOLVES_FAILED' });
    }
    });

    router.get('/users/bots', async (req, res) => {
      try {
        const users = await getUsersCol();
        const bots = await users.find({ $or: [{ role: 'bot' }, { isBot: true }] }).toArray();
        res.json({ ok: true, bots: bots.map(b => ({ uid: b.uid, name: b.name, elo: b.elo || 1200, picture: b.picture })) });
      } catch (e) {
        logger.error('[users] /bots failed:', e);
        res.status(500).json({ ok: false, error: 'Internal server error' });
      }
    });

    router.get('/users/:uid1/vs/:uid2', async (req, res) => {
      try {
        const u1 = safeString(req.params.uid1).toLowerCase();
        const u2 = safeString(req.params.uid2).toLowerCase();

        const games = await getGamesCol();

        // Resolve UIDs/Slugs to actual UIDs
        const users = await getUsersCol();
        const user1 = await users.findOne({ $or: [{ uid: u1 }, { slug: u1 }] });
        const user2 = await users.findOne({ $or: [{ uid: u2 }, { slug: u2 }] });
        
        const finalU1 = user1?.uid || u1;
        const finalU2 = user2?.uid || u2;

        const uids1 = [finalU1];
        const uids2 = [finalU2];
        try { if (finalU1.length === 24) uids1.push(new ObjectId(finalU1)); } catch(e){ }
        try { if (finalU2.length === 24) uids2.push(new ObjectId(finalU2)); } catch(e){ }

        const isBot1 = user1?.role === 'bot' || user1?.isBot;
        const isBot2 = user2?.role === 'bot' || user2?.isBot;

        // Find all finished games between these two users
        const filter = {
          $or: [
            { status: 'finished' },
            { 'state.finished': true }
          ],
          $and: [
            {
              $or: [
                { 'playerUids.red': { $in: uids1 }, 'playerUids.black': { $in: uids2 } },
                { 'playerUids.red': { $in: uids2 }, 'playerUids.black': { $in: uids1 } },
                { 'state.playerUids.red': { $in: uids1 }, 'state.playerUids.black': { $in: uids2 } },
                { 'state.playerUids.red': { $in: uids2 }, 'state.playerUids.black': { $in: uids1 } },
                // Name-based fallback for bots (to capture history even if UIDs were inconsistently tracked)
                (isBot1 && isBot2) ? { 'playerNames.red': user1.name, 'playerNames.black': user2.name } : null,
                (isBot1 && isBot2) ? { 'playerNames.red': user2.name, 'playerNames.black': user1.name } : null,
                (isBot1 && !isBot2) ? { 'playerNames.red': user1.name, 'playerUids.black': { $in: uids2 } } : null,
                (isBot1 && !isBot2) ? { 'playerNames.black': user1.name, 'playerUids.red': { $in: uids2 } } : null,
                (!isBot1 && isBot2) ? { 'playerNames.red': user2.name, 'playerUids.black': { $in: uids1 } } : null,
                (!isBot1 && isBot2) ? { 'playerNames.black': user2.name, 'playerUids.red': { $in: uids1 } } : null,
              ].filter(Boolean)
            }
          ]
        };

        const projection = {
          _id: 1,
          'state.winner': 1,
          'state.playerUids': 1,
          'state.playerNames': 1,
          playerUids: 1,
          playerNames: 1,
          players: 1,
          title: 1,
          puzzleName: 1,
          createdAt: 1,
          updatedAt: 1
        };

        // Use aggregation for both stats and recent games
        const result = await games.aggregate([
          { $match: filter },
          {
            $facet: {
              stats: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    u1Wins: {
                      $sum: {
                        $cond: [
                          {
                            $eq: [
                              {
                                $switch: {
                                  branches: [
                                    { case: { $eq: ["$state.winner", "red"] }, then: { $ifNull: ["$playerUids.red", "$state.playerUids.red"] } },
                                    { case: { $eq: ["$state.winner", "black"] }, then: { $ifNull: ["$playerUids.black", "$state.playerUids.black"] } }
                                  ],
                                  default: null
                                }
                              },
                               finalU1
                            ]
                          },
                          1,
                          0
                        ]
                      }
                    },
                    u2Wins: {
                      $sum: {
                        $cond: [
                          {
                            $eq: [
                              {
                                $switch: {
                                  branches: [
                                    { case: { $eq: ["$state.winner", "red"] }, then: { $ifNull: ["$playerUids.red", "$state.playerUids.red"] } },
                                    { case: { $eq: ["$state.winner", "black"] }, then: { $ifNull: ["$playerUids.black", "$state.playerUids.black"] } }
                                  ],
                                  default: null
                                }
                              },
                               finalU2
                            ]
                          },
                          1,
                          0
                        ]
                      }
                    },
                    draws: {
                      $sum: {
                        $cond: [{ $not: ["$state.winner"] }, 1, 0]
                      }
                    }
                  }
                }
              ],
              recentGames: [
                { $sort: { updatedAt: -1 } },
                { $limit: 10 },
                { $project: projection }
              ]
            }
          }
        ]).toArray();

        const stats = result[0]?.stats[0] || { total: 0, u1Wins: 0, u2Wins: 0, draws: 0 };
        delete stats._id;

        const recentGames = (result[0]?.recentGames || []).map(g => {
          const ps = g.playerUids || g.state?.playerUids || {};
          const pNames = g.playerNames || g.state?.playerNames || g.players || {};
          return {
            gameId: g._id,
            title: g.title,
            puzzleName: g.puzzleName,
            winner: g.state?.winner,
            playerUids: ps,
            playerNames: {
              red: pNames.red || pNames.redName || 'Kỳ thủ Đỏ',
              black: pNames.black || pNames.blackName || 'Kỳ thủ Đen'
            },
            createdAt: g.createdAt,
            updatedAt: g.updatedAt
          };
        });

        return res.json({ ok: true, stats, recentGames });
      } catch (e) {
        logger.error('GET /users/:uid1/vs/:uid2 failed', e);
        return res.status(500).json({ ok: false, error: 'H2H_FAILED' });
      }
    });

    export default router;


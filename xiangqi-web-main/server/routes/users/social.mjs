import express from 'express';
import { logger } from '../../logger.mjs';
import { getUsersCol } from '../../mongo.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { redisClient } from '../../services/cache.mjs';
import { safeString } from '../../utils/security.mjs';

const router = express.Router();

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

    const { customStatusByUid, getIo } = await import('../../socket/presence.mjs');
    customStatusByUid.set(user.uid, status);
    
    const io = getIo();
    if (io) {
      const { getPresenceForUid } = await import('../../socket/presence.mjs');
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
      await users.updateOne({ uid: user.uid }, { $pull: { followingUids: targetUid } });
      await users.updateOne({ uid: targetUid }, { $pull: { followerUids: user.uid } });
    } else {
      await users.updateOne({ uid: user.uid }, { $addToSet: { followingUids: targetUid } });
      await users.updateOne({ uid: targetUid }, { $addToSet: { followerUids: user.uid } });
      
      const { getMessagesCol } = await import('../../mongo.mjs');
      const msgCol = await getMessagesCol();
      const msgId = new (await import('mongodb')).ObjectId();
      await msgCol.insertOne({
        _id: msgId, fromUid: user.uid, fromName: user.name, fromPicture: user.picture || null,
        toUid: targetUid, type: 'new_follower', content: '', status: 'unread', createdAt: Date.now()
      });

      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) {
        io.to('user:' + targetUid).emit('new_follower', { uid: user.uid, name: user.name });
      }

      try {
        const { sendNotification } = await import('../../push.mjs');
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
      try { await redisClient.del(`user:summary:${user.uid}`, `user:summary:${targetUid}`); } catch (e) { }
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
    const { onlineUids, playingRoomByUid, customStatusByUid } = await import('../../socket/presence.mjs');
    const followingList = await users.find({ uid: { $in: followingUids } }).toArray();
    return res.json({
      ok: true,
      following: followingList.map(f => ({
        uid: f.uid, name: f.name, picture: f.picture || null, elo: Number(f.elo ?? 1200),
        online: onlineUids.has(f.uid), customStatus: customStatusByUid.get(f.uid) || f.customStatus || 'offline',
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
    const { onlineUids, playingRoomByUid, customStatusByUid } = await import('../../socket/presence.mjs');
    const followerList = await users.find({ uid: { $in: followerUids } }).toArray();
    return res.json({
      ok: true,
      followers: followerList.map(f => ({
        uid: f.uid, name: f.name, picture: f.picture ? `/api/avatars/${f.uid}.webp` : null, elo: Number(f.elo ?? 1200),
        online: onlineUids.has(f.uid), customStatus: customStatusByUid.get(f.uid) || f.customStatus || 'offline',
        playingRoomId: playingRoomByUid.get(f.uid) || null,
      })).sort((a,b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
    });
  } catch (e) {
    logger.error('GET /users/followers failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

export default router;

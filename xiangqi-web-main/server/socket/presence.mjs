import { logger } from '../logger.mjs';
import { transformUser } from '../users.mjs';

export const onlineUids = new Set();
export const customStatusByUid = new Map();
export const playingRoomByUid = new Map();
/**
 * activityByUid tracks the in-game state:
 *  'idle'       – online, not in any room
 *  'spectating' – watching a match without a seat
 *  'waiting'    – seated in a room, game not yet started
 *  'playing'    – actively in a started match
 */
export const activityByUid = new Map();
export const socketsByUid = new Map();
export const playerInfoByUid = new Map(); // Stores { name, picture, elo, rank }

let globalIo = null;
export function setIo(ioInstance) { globalIo = ioInstance; }
export function getIo() { return globalIo; }

export function setPlayerInfoForUid(uid, info) {
  if (!uid) return;
  playerInfoByUid.set(String(uid), info);
}

export function getPresenceForUid(uid, requesterUid = null) {
  const u = String(uid || '');
  const info = playerInfoByUid.get(u) || {};
  const isActuallyOnline = onlineUids.has(u);
  const cStatus = customStatusByUid.get(u) || 'online';

  // Invisible logic:
  // - Global broadcast (requesterUid=null) -> offline
  // - Self (requesterUid=uid) -> online
  // - Others (requesterUid!=uid) -> offline
  let onlineResult = isActuallyOnline;
  if (cStatus === 'invisible') {
    if (requesterUid && String(requesterUid) === u) {
      // online for self
    } else {
      onlineResult = false;
    }
  } else if (cStatus === 'offline') {
    onlineResult = false;
  }

  const activity = onlineResult ? (activityByUid.get(u) || 'idle') : 'idle';

  const presence = {
    uid: u,
    online: onlineResult,
    customStatus: cStatus,
    activityStatus: activity,
    playingRoomId: onlineResult ? (playingRoomByUid.get(u) || null) : null,
    ...transformUser(info),
  };

  return presence;
}

export function setCustomStatus(uid, status) {
  if (!uid) return;
  const u = String(uid);
  if (!status || status === 'auto' || status === 'online') {
    customStatusByUid.delete(u);
  } else {
    customStatusByUid.set(u, status);
  }
  
  // Broadcast the change!
  const io = getIo();
  if (io) {
    io.emit('presence:update', getPresenceForUid(u));
  }
}

/**
 * Updates activityByUid for a set of player uids and broadcasts presence:update for each.
 * @param {string[]} uids
 * @param {'idle'|'waiting'|'playing'|'spectating'} activity
 */
export function broadcastActivityChange(uids, activity) {
  const io = globalIo;
  for (const uid of uids) {
    if (!uid) continue;
    const u = String(uid);
    if (activity === 'idle') {
      activityByUid.delete(u);
    } else {
      activityByUid.set(u, activity);
    }
    logger.debug(`[PRESENCE] Activity Change -> UID: ${u} | New Activity: ${activity}`);
    if (io) io.emit('presence:update', getPresenceForUid(u));
  }
}

/**
 * Broadcasts a room invitation to all idle users.
 * Also sends push notifications if enabled in user settings.
 * @param {any} io - Socket.io instance
 * @param {string} roomId
 * @param {string} creatorName
 * @param {string} timeMode
 * @param {string} creatorUid
 */
export async function broadcastToIdleUsers(io, roomId, creatorName, timeMode, creatorUid) {
  if (!io) return;

  const allOnline = Array.from(onlineUids);
  const targetUids = [];
  const safeCreatorUid = String(creatorUid || '').toLowerCase();
  
  for (const uid of allOnline) {
    const u = String(uid).toLowerCase();
    // User is idle if they are online but NOT in activityByUid (or activity is explicitly 'idle')
    const activity = activityByUid.get(u) || 'idle';
    if (activity === 'idle' && u !== safeCreatorUid) {
      targetUids.push(u);
    }
  }

  logger.info(`[PRESENCE] broadcastToIdleUsers: TotalOnline=${allOnline.length}, IdleTargets=${targetUids.length}, Room=${roomId}, Creator=${creatorName} (UID:${safeCreatorUid})`);

  if (targetUids.length === 0) return;

  // 1. Real-time Socket Broadcast
  const invitationPayload = { roomId, creatorName, timeMode, createdAt: Date.now() };
  for (const uid of targetUids) {
    const userRoom = 'user:' + uid;
    const socketCount = io.sockets.adapter.rooms.get(userRoom)?.size || 0;
    
    if (socketCount > 0) {
      logger.info(`[PRESENCE] Sending socket invite to ${uid} via ${userRoom} (${socketCount} active sockets)`);
      io.to(userRoom).emit('room:invitation', invitationPayload);
      // Also send bell notification for persistence
      io.to(userRoom).emit('notification:bell', {
        id: 'invite-' + roomId + '-' + Date.now(),
        type: 'invitation',
        title: 'Có phòng mới được mở',
        message: `${timeMode}, bởi ${creatorName}`,
        actionUrl: `/game/${roomId}`,
        time: new Date().toISOString()
      });
    } else {
      logger.debug(`[PRESENCE] User ${uid} is idle but has 0 active sockets. Skipping socket invite.`);
    }
  }

  // 2. Browser Push Notification (for those who have it enabled)
  try {
    const { getUsersCol } = await import('../mongo.mjs');
    const { sendNotification } = await import('../push.mjs');
    const usersCol = await getUsersCol();
    
    const usersWithSettings = await usersCol.find(
      { uid: { $in: targetUids } },
      { projection: { uid: 1, notificationSettings: 1 } }
    ).toArray();

    logger.debug(`[PRESENCE] Checking settings for ${usersWithSettings.length} idle users for push`);

    for (const user of usersWithSettings) {
      if (user.notificationSettings?.roomInvitations !== false) {
        logger.debug(`[PRESENCE] Triggering push invite for UID: ${user.uid}`);
        sendNotification(user.uid, {
          title: 'Lời mời từ phòng mới',
          body: `Kỳ thủ ${creatorName} vừa mở phòng mới (${timeMode}). Tham gia ngay!`,
          data: { url: `/game/${roomId}` }
        })
        .then(() => logger.info(`[PRESENCE] Push invite SUCCESS for UID: ${user.uid}`))
        .catch(err => logger.debug(`[PRESENCE] Push invite failed for ${user.uid}`, err));
      } else {
        logger.debug(`[PRESENCE] User ${user.uid} has invitations DISABLED`);
      }
    }
  } catch (e) {
    logger.error('[PRESENCE] broadcastToIdleUsers push failed:', e);
  }
}

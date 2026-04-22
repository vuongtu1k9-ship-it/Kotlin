import { ObjectId } from 'mongodb';
import { logger } from '../logger.mjs';
import { getDb } from '../mongo.mjs';
import { sendNotification } from '../push.mjs';
import { createInitialState } from '../services/gameState.mjs';
import { rooms, makeRoomId, saveRoom, findActiveRoomForUid } from '../services/roomManager.mjs';
import { broadcastRoomUpdate } from './utils.mjs';
import { getPresenceForUid } from './presence.mjs';
import { transformUser } from '../users.mjs';

// In-memory store for pending challenges
// Key: challengeId (string), Value: challenge object
const pendingChallenges = new Map();

export function registerChallengeHandlers(io, socket) {
  const uid = socket.data.user?.uid;
  if (!uid) return;

  // Sync pending or recently finished challenges for this user on connection
  const myPendingChallenges = [];
  for (const c of pendingChallenges.values()) {
    if (c.senderUid === uid || c.targetUid === uid) {
      myPendingChallenges.push(c);
    }
  }
  if (myPendingChallenges.length > 0) {
    socket.emit('challenge:sync', myPendingChallenges);
  }

  socket.on('challenge:send', async (data) => {
    const user = socket.data.user;
    if (!user || user.provider === 'guest') {
      return socket.emit('challenge:error', { message: 'Vui lòng đăng nhập để thực hiện mời thi đấu.' });
    }

    // Defensive log for diagnosis
    logger.info('[ChallengeHandlers] Incoming challenge:send data:', data);

    console.log(`\n⚔️ [SOCKET: challenge:send] -> senderUid: ${uid} | targetUid: ${data.targetUid} | targetName: ${data.targetName}`);
    try {
      const targetUidRaw = data.targetUid;
      if (!targetUidRaw || targetUidRaw === uid) return;
      const targetUid = String(targetUidRaw).toLowerCase();
      const targetName = data.targetName;
      const challengeConfig = data.challengeConfig;

      // check if sender is already in a game
      const senderActiveRoom = await findActiveRoomForUid(uid);
      if (senderActiveRoom) {
        return socket.emit('challenge:error', { 
          message: 'Bạn đang có một ván đấu chưa kết thúc. Vui lòng hoàn thành trước khi mời thi đấu người khác.',
          roomId: senderActiveRoom 
        });
      }

      const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const myInfo = getPresenceForUid(uid);
      const senderName = myInfo?.name || socket.data.user?.name || 'Người chơi';
      const senderPicture = transformUser(myInfo || socket.data.user)?.picture || null;
      
      const challenge = {
        id: challengeId,
        senderUid: uid,
        senderName,
        senderPicture,
        targetUid,
        targetName,
        config: challengeConfig || { mode: 'standard' },
        createdAt: Date.now(),
        status: 'pending'
      };

      pendingChallenges.set(challengeId, challenge);

      // Clean up old challenges (older than 10 minutes)
      const tenMinsAgo = Date.now() - 10 * 60 * 1000;
      for (const [id, c] of pendingChallenges.entries()) {
        if (c.createdAt < tenMinsAgo) pendingChallenges.delete(id);
      }

      // 1. Check if target is busy
      const targetPresence = getPresenceForUid(targetUid, uid);
      const isBusy = targetPresence?.customStatus === 'busy';

      // 2. Emit to target if online
      io.to('user:' + targetUid).emit('challenge:received', { ...challenge, isBusyTarget: isBusy });

      // 3. Send push notification to target
      const pushTitle = `Mời thi đấu từ ${senderName}`;
      const pushBody = `Chế độ: ${challenge.config.mode || 'Tiêu chuẩn'} - Bạn có nhận lời không?`;
      console.log(`[CHALLENGE_PUSH] Pre-flight -> Sender: ${uid}, Target: ${targetUid}, Title: ${pushTitle}`);
      sendNotification(targetUid, {
        title: pushTitle,
        body: pushBody,
        data: { action: 'challenge', url: '/' }
      }).catch(err => {
        console.error('[ChallengeHandlers] Push error:', err);
        logger.error('[ChallengeHandlers] Push error:', err);
      });
      
      // Notify sender that it was sent, include busy status
      socket.emit('challenge:status', {
        challengeId,
        status: 'sent',
        targetName,
        isBusyTarget: isBusy,
        challenge
      });

    } catch (e) {
      logger.error('[ChallengeHandlers] challenge:send error', e);
      socket.emit('challenge:error', { message: 'Lỗi gửi lời mời thi đấu' });
    }
  });

  socket.on('challenge:reply', async (data) => {
    console.log(`\n🛡️ [SOCKET: challenge:reply] -> Challenge ID: ${data?.challengeId} | Status: ${data?.status} | User UID: ${uid}`);
    try {
      const { challengeId, status } = data; // status: 'accept' | 'decline' | 'wait'
      if (!challengeId || !status) return;

      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) {
        return socket.emit('challenge:error', { message: 'Lời mời không tồn tại hoặc đã hết hạn.' });
      }

      // Security check: only the target can reply
      if (challenge.targetUid !== uid) {
        return socket.emit('challenge:error', { message: 'Không thể phản hồi lời mời của người khác.' });
      }

      // Cannot reply to an already resolved challenge
      if (challenge.status !== 'pending' && status !== 'wait') {
         return; // already processed
      }

      challenge.status = status;

      // Notify both parties of the result
      const replyPayload = { 
        challengeId, 
        status, 
        targetName: socket.data.user?.name || challenge.targetName,
        senderName: challenge.senderName
      };
      io.to('user:' + challenge.senderUid).emit('challenge:status', replyPayload);
      io.to('user:' + challenge.targetUid).emit('challenge:status', replyPayload);

      if (status === 'accept') {
        const senderUid = challenge.senderUid;
        const targetUid = challenge.targetUid;
        
        if (senderUid === targetUid) {
          return socket.emit('challenge:error', { message: 'Không thể tự mời thi đấu chính mình.' });
        }

        const senderActiveRoom = await findActiveRoomForUid(senderUid);
        if (senderActiveRoom) {
          return socket.emit('challenge:error', { message: 'Đối thủ hiện đang trong một ván đấu khác.' });
        }

        const receiverActiveRoom = await findActiveRoomForUid(targetUid);
        if (receiverActiveRoom) {
           return socket.emit('challenge:error', { message: 'Bạn đang trong một ván đấu khác. Vui lòng hoàn thành trước.' });
        }

        const senderPresence = getPresenceForUid(senderUid);
        if (!senderPresence.online) {
          return socket.emit('challenge:error', { 
            message: 'Người mời thi đấu đã ngoại tuyến. Không thể bắt đầu ván đấu.' 
          });
        }

        const roomId = makeRoomId();
        let initialBoard = null;
        let normalizedSetupId = null;

        // Puzzle logic
        if (challenge.config.puzzleId) {
          const db = await getDb();
          const pcol = db.collection('puzzles');
          const doc = await pcol.findOne({ _id: new ObjectId(String(challenge.config.puzzleId)) });
          if (doc?.board) {
            const b = doc.board;
            if (Array.isArray(b) && b.length === 10 && b.every(r => Array.isArray(r) && r.length === 9)) {
              initialBoard = b.map((row, r) =>
                row.map((p, c) => {
                  if (!p) return null;
                  const side = p.side === 'red' || p.side === 'black' ? p.side : null;
                  const type = String(p.type || '');
                  if (!side || !type) return null;
                  return { ...p, side, type, position: { row: r, col: c }, hasMoved: true };
                })
              );
              normalizedSetupId = String(doc._id);
            }
          }
        }

        const timeMode = challenge.config.timeMode || challenge.config.mode || 'standard';
        const isPrivate = !!(challenge.config.isPrivate);
        const isRanked = challenge.config.boardType === 'standard' && !isPrivate && !challenge.config.puzzleId;

        const playerUids = { red: senderUid, black: targetUid };
        const myPresence = getPresenceForUid(targetUid); // target (me)
        const targetName = myPresence?.name || socket.data.user?.name || challenge.targetName;
        const playerNames = { red: challenge.senderName, black: targetName };

        const st = createInitialState({ 
          timeMode, 
          board: initialBoard, 
          setupId: normalizedSetupId,
          playerUids,
          playerNames
        });
        st.isPrivate = isPrivate;
        st.isRanked = isRanked;
        st.isFixed = true;

        rooms.set(roomId, st);
        await saveRoom(roomId, st, { isPrivate, isRanked, playerNames, playerUids, isFixed: true });
        
        broadcastRoomUpdate(io, roomId);

        // Notify both players that the challenge is accepted and the room is ready
        const payload = {
          challengeId,
          roomId,
          status: 'accepted'
        };

        io.to('user:' + challenge.senderUid).emit('challenge:accepted', payload);
        socket.emit('challenge:accepted', payload); // to receiver (myself)

        // Note: we don't delete it from Map here so it can be synced to bell history.
        // It will be cleaned up by a timer if we implement one, or manually by user.
      }

    } catch (e) {
      logger.error('[ChallengeHandlers] challenge:reply error', e);
      socket.emit('challenge:error', { message: 'Lỗi phản hồi hệ thống' });
    }
  });

  socket.on('challenge:cancel', (data) => {
    try {
      const { challengeId } = data;
      const challenge = pendingChallenges.get(challengeId);
      if (challenge && challenge.senderUid === uid && (challenge.status === 'pending' || challenge.status === 'wait')) {
        challenge.status = 'canceled';
        io.to('user:' + challenge.targetUid).emit('challenge:canceled', { challengeId });
        io.to('user:' + challenge.senderUid).emit('challenge:canceled', { challengeId });
      }
    } catch(e) {
      logger.error('[ChallengeHandlers] challenge:cancel error', e);
    }
  });
}

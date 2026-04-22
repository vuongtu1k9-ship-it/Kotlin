import { getDb, getMessagesCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { rooms } from '../services/roomManager.mjs';
import { getChatName } from './utils.mjs';
import { socketsByUid } from './presence.mjs';
import { sendNotification } from '../push.mjs';
import { transformUser } from '../users.mjs';

export function registerInviteHandlers(io, socket) {
  const handleInviteSend = async ({ toUid, roomId } = {}, ack) => {
    try {
      const rid = String(roomId || socket.data.roomId || '');
      const target = String(toUid || '').trim();
      if (!rid || !rooms.get(rid)) {
        if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
        return;
      }
      if (!target) {
        if (typeof ack === 'function') ack({ ok: false, error: 'NO_TARGET' });
        return;
      }
      if (target === socket.data.user?.uid) {
        if (typeof ack === 'function') ack({ ok: false, error: 'CANNOT_INVITE_SELF' });
        return;
      }
      // must be player in this room
      if (socket.data.role !== 'player' || socket.data.roomId !== rid) {
        if (typeof ack === 'function') ack({ ok: false, error: 'NOT_IN_ROOM' });
        return;
      }

      const col = await getMessagesCol();
      const now = Date.now();
      const doc = {
        fromUid: String(socket.data.user?.uid || 'unknown'),
        fromName: getChatName(socket),
        fromPicture: transformUser(socket.data.user)?.picture || null,
        toUid: target,
        type: 'challenge',
        content: `Mời bạn vào phòng ${rid}`,
        challengeConfig: {
          roomId: rid,
          mode: rooms.get(rid)?.timeMode || 'standard'
        },
        status: 'unread',
        createdAt: now,
      };
      const ins = await col.insertOne(doc);
      const payload = { ...doc, _id: ins.insertedId };

      // realtime deliver via the unified direct_message event
      io.to('user:' + target).emit('direct_message', payload);

      // ALSO emit to the dm room so Chat component updates!
      const uids = [doc.fromUid, doc.toUid].sort();
      const dmRoomId = `dm::${uids[0]}::${uids[1]}`;
      const chatMsg = {
         roomId: dmRoomId,
         senderUid: doc.fromUid,
         senderName: doc.fromName,
         senderPicture: doc.fromPicture,
         text: doc.content,
         createdAt: doc.createdAt,
         type: 'challenge',
         status: 'unread',
         messageId: String(payload._id),
         challengeConfig: doc.challengeConfig
      };
      io.to('user:' + doc.fromUid).emit('chat:message', chatMsg);
      io.to('user:' + doc.toUid).emit('chat:message', chatMsg);

      // Push notification (background)
      const pushPayload = {
        title: 'Lời mời thi đấu',
        body: `${doc.fromName} mời bạn vào phòng ${rid}`,
        data: { url: `/game/${rid}` }
      };
      sendNotification(target, pushPayload).catch(err => logger.debug('Invite push failed', err));

      if (typeof ack === 'function') ack({ ok: true, invite: payload });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: 'INVITE_FAILED' });
      logger.error('invite:send failed', e);
    }
  };
  socket.on('invite:send', handleInviteSend);
  socket.on('invite:create', handleInviteSend);

  const handleInviteRespond = async ({ id, action } = {}, ack) => {
    try {
      const invId = String(id || '');
      const act = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : null;
      if (!invId || !act) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_REQUEST' });
        return;
      }

      const col = await getMessagesCol();
      const { ObjectId } = await import('mongodb');
      const oid = new ObjectId(invId);
      const now = Date.now();

      const me = String(socket.data.user?.uid || '');
      const msg = await col.findOne({ _id: oid });
      if (!msg || String(msg.toUid) !== me) {
        if (typeof ack === 'function') ack({ ok: false, error: 'NOT_FOUND' });
        return;
      }

      if (msg.status === 'accepted' || msg.status === 'declined') {
        if (typeof ack === 'function') ack({ ok: true, invite: msg });
        return;
      }

      const status = act === 'accept' ? 'accepted' : 'declined';
      await col.updateOne({ _id: oid }, { $set: { status, respondedAt: now } });
      const next = { ...msg, status, respondedAt: now };

      // notify inviter via unified challenge_accepted event if accepted
      if (status === 'accepted' && msg.challengeConfig?.roomId) {
        io.to('user:' + msg.fromUid).emit('challenge_accepted', { messageId: invId, roomId: msg.challengeConfig.roomId });
      } else {
        io.to('user:' + msg.fromUid).emit('challenge_declined', { messageId: invId });
      }

      // Live update chat ui of both players
      // const uids = [msg.fromUid, msg.toUid].sort();
      io.to('user:' + msg.fromUid).emit('chat:message:update', { messageId: invId, status });
      io.to('user:' + msg.toUid).emit('chat:message:update', { messageId: invId, status });

      if (typeof ack === 'function') ack({ ok: true, invite: next });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: 'RESPOND_FAILED' });
      logger.error('invite:respond failed', e);
    }
  };
  socket.on('invite:respond', handleInviteRespond);
  socket.on('invite:accept', (payload = {}, ack) => handleInviteRespond({ ...payload, action: 'accept' }, ack));
}

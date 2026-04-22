import { getChatHistory, saveChatMessage } from '../chat.mjs';
import { rooms, loadRoom } from '../services/roomManager.mjs';
import { ensureUserFromJwtPayload } from '../users.mjs';
import { sendNotification } from '../push.mjs';
import { logger } from '../logger.mjs';
import { sanitizeHtml } from '../utils/security.mjs';

export function registerChatHandlers(io, socket) {
  socket.on('chat:join', async ({ roomId } = {}) => {
    try {
      const rid = String(roomId || '');
      const isDm = rid.startsWith('dm::') || rid.startsWith('dm_');
      
      if (isDm) {
         const user = await ensureUserFromJwtPayload(socket.data.user);
         if (!user) { logger.warn('[CHAT] chat:join failed: No user found for JWT'); return; }
         const separator = rid.startsWith('dm::') ? '::' : '_';
         const parts = rid.split(separator);
         
         const userUidStr = String(user.uid);
         if (parts.length !== 3) { logger.warn(`[CHAT] chat:join failed: Bad rid format: ${rid}`); return; }
         if (!parts.includes(userUidStr)) { logger.warn(`[CHAT] chat:join unauthorized: uid ${userUidStr} attempted to join ${rid}`); return; }
      }
      
      if (rid === 'global' || isDm || rooms.has(rid)) {
        let h = await getChatHistory(rid);
        if (isDm) {
           logger.debug(`[CHAT] chat:join success for DM room ${rid} (history: ${h.length} messages)`);
        }
        
        socket.emit('chat:history', { roomId: rid, messages: h });
        if (rooms.has(rid)) {
          const state = rooms.get(rid);
          socket.emit('room:players', {
            roomId: rid,
            players: { red: !!state.players.red, black: !!state.players.black },
            playerUids: state.playerUids,
            spectators: Array.from(state.spectators.values())
          });
        }
      }
    } catch (e) {
      logger.error('[CHAT] chat:join exception:', e.message);
    }
  });

  socket.on('chat:send', async ({ roomId, text } = {}, ack) => {
    logger.debug(`[CHAT] chat:send received: room=${roomId}, text="${text?.substring(0, 50)}..."`);
    try {
      const rid = String(roomId || '');
      const rawText = String(text || '').trim();
      const msgText = sanitizeHtml(rawText);
      
      if (!msgText) {
        if (typeof ack === 'function') ack({ ok: false, error: 'EMPTY' });
        return;
      }
      if (msgText.length > 500) {
        if (typeof ack === 'function') ack({ ok: false, error: 'TOO_LONG' });
        return;
      }

      const user = await ensureUserFromJwtPayload(socket.data.user);
      if (!user || user.provider === 'guest') {
        if (typeof ack === 'function') ack({ ok: false, error: 'GUEST_RESTRICTED' });
        return;
      }

      const isDm = rid.startsWith('dm::') || rid.startsWith('dm_');
      let targetUids = null;

      if (isDm) {
         const separator = rid.startsWith('dm::') ? '::' : '_';
         const parts = rid.split(separator);
         if (parts.length !== 3) {
            logger.warn(`[CHAT] chat:send failed: Invalid DM rid format: ${rid}`);
            return;
         }
         targetUids = [parts[1], parts[2]];
         if (!targetUids.includes(String(user.uid))) {
           logger.warn(`[CHAT] chat:send unauthorized DM: uid ${user.uid} attempted to send to ${rid}`);
           if (typeof ack === 'function') ack({ ok: false, error: 'NOT_AUTHORIZED' });
           return;
         }
      } else if (rid !== 'global') {
        const st = await loadRoom(rid);
        if (!st) {
          if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
          return;
        }
      }
      
      const msg = await saveChatMessage({
        roomId: rid,
        senderUid: user.uid,
        text: msgText,
        name: user.name || 'User',
        picture: user.picture || null,
      });

      if (isDm) {
        const toUid = targetUids.find(u => u !== String(user.uid));
        const chatMsg = {
          messageId: msg._id.toString(),
          roomId: rid,
          senderUid: user.uid,
          senderName: user.name || 'User',
          senderPicture: user.picture || null,
          text: msgText,
          createdAt: msg.createdAt,
          type: 'text',
          status: 'unread'
        };

        logger.debug(`[CHAT] chat:send emitting DM to participants: ${targetUids.join(', ')}`);

        // Notify both participants via chat:message (for GlobalChatWidget)
        io.to('user:' + targetUids[0]).emit('chat:message', chatMsg);
        io.to('user:' + targetUids[1]).emit('chat:message', chatMsg);
        
        // ALSO notify via direct_message (for InboxWidget)

        const inboxMsg = {
          _id: msg._id.toString(),
          fromUid: user.uid,
          fromName: user.name,
          fromPicture: user.picture,
          toUid,
          type: 'text',
          content: msgText,
          status: 'unread',
          createdAt: msg.createdAt
        };
        io.to('user:' + toUid).emit('direct_message', inboxMsg);

        // Push notification (background)
        const pushPayload = {
          title: 'Tin nhắn từ ' + (user.name || 'Người dùng'),
          body: msgText,
          data: { url: '/messages' } // DM list page (placeholder)
        };
        logger.info(`[CHAT] DM sent from ${user.uid} to ${toUid}. Triggering push...`);
        sendNotification(toUid, pushPayload).catch((e) => {
          logger.error('[CHAT] Push notification failed:', e.message);
        });
      } else if (rid === 'global') {
        io.emit('chat:message', msg);
      } else {
        io.to(rid).emit('chat:message', msg);
      }

      if (typeof ack === 'function') ack({ ok: true });
    } catch (e) {
      logger.error('[CHAT] chat:send exception:', e.message);
      if (typeof ack === 'function') ack({ ok: false, error: 'SEND_FAILED' });
    }
  });
}

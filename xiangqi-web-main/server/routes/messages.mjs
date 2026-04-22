import express from 'express';
import { logger } from '../logger.mjs';
import { ObjectId } from 'mongodb';
import { getMessagesCol, getDb } from '../mongo.mjs';
import { requireUser } from '../utils/auth.mjs';
import { getIo } from '../socket/presence.mjs';
import { createInitialState } from '../services/gameState.mjs';
import { rooms, makeRoomId, saveRoom } from '../services/roomManager.mjs';
import { broadcastRoomUpdate } from '../socket/utils.mjs';
import { isInCheck } from '../moveLogic.mjs';
import { sendNotification } from '../push.mjs';
import { saveChatMessage } from '../chat.mjs';

const router = express.Router();

// GET /messages/inbox
router.get('/messages/inbox', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  
  try {
    const col = await getMessagesCol();
    const myUid = user.uid;
    
    // Fetch both sent and received messages so we can reconstruct threads
    const docs = await col
      .find({ $or: [{ fromUid: myUid }, { toUid: myUid }] })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Mark as read immediately if the user is the recipient (toUid)
    // In a real app we might only do this on a specific PATCH route,
    // but doing it here simplifies the "Inbox viewing" experience.
    const unreadIds = docs.filter(d => d.toUid === myUid && d.status === 'unread').map(d => d._id);
    if (unreadIds.length > 0) {
      await col.updateMany({ _id: { $in: unreadIds } }, { $set: { status: 'read' } });
      docs.forEach(d => { if (unreadIds.includes(d._id)) d.status = 'read'; });
    }

    return res.json({ ok: true, messages: docs });
  } catch (e) {
    logger.error('[MESSAGES] GET /messages/inbox failed:', e.message);
    return res.status(500).json({ ok: false, error: 'INBOX_FAILED' });
  }
});

// POST /messages
router.post('/messages', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const myUid = user.uid;
    const { toUid, type = 'text', content = '' } = req.body;

    if (!toUid || typeof toUid !== 'string') return res.status(400).json({ ok: false, error: 'MISSING_TOUID' });
    if (toUid === myUid) return res.status(400).json({ ok: false, error: 'CANNOT_MESSAGE_SELF' });

    const message = {
      fromUid: myUid,
      fromName: user.name,
      fromPicture: user.picture,
      toUid,
      type, // 'text' | 'new_follower'
      content,
      status: 'unread',
      createdAt: Date.now()
    };

    const col = await getMessagesCol();
    const result = await col.insertOne(message);
    message._id = result.insertedId;

    // Mirror to chat_messages so it appears in DM chat history
    const dmRoomId = `dm::${[myUid, toUid].sort().join('::')}`;
    await saveChatMessage({
      roomId: dmRoomId,
      senderUid: myUid,
      text: content,
      name: user.name || 'User',
      picture: user.picture || null,
      extra: { type, messageId: message._id.toString(), status: 'unread' }
    }).catch(err => logger.error('[MESSAGES] DM chat history mirror failed:', err.message));

    // Real-time alert
    const io = getIo();
    if (io) {
      io.to('user:' + toUid).emit('direct_message', message);

      const chatMsgPayload = {
        messageId: message._id.toString(),
        roomId: dmRoomId,
        senderUid: myUid,
        senderName: user.name || 'User',
        senderPicture: user.picture || null,
        text: content,
        createdAt: message.createdAt,
        type: type,
        status: message.status
      };
      io.to(`user:${myUid}`).emit('chat:message', chatMsgPayload);
      io.to(`user:${toUid}`).emit('chat:message', chatMsgPayload);
    }

    // Push notification (background)
    const notificationPayload = {
      title: 'Tin nhắn mới từ ' + (user.name || 'Người dùng'),
      body: content,
      data: { url: '/message/' + message._id }
    };
    sendNotification(toUid, notificationPayload).catch(err => logger.error('[MESSAGES] Message push notification failed:', err.message));
    
    logger.info(`[MESSAGES] Message sent from ${myUid} to ${toUid} (type: ${type})`);
    return res.json({ ok: true, message });
  } catch (e) {
    logger.error('[MESSAGES] POST /messages failed:', e.message);
    return res.status(500).json({ ok: false, error: 'SEND_MESSAGE_FAILED' });
  }
});



export default router;

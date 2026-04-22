import { getDb } from './mongo.mjs';

export async function getChatCol() {
  const db = await getDb();
  return db.collection('chat_messages');
}

export async function saveChatMessage({ roomId, senderUid, text, name, picture, extra = {} }) {
  const col = await getChatCol();
  const msg = {
    roomId,
    senderUid,
    senderName: name || 'User',
    senderPicture: picture || null,
    text,
    createdAt: Date.now(),
    ...extra,
  };
  await col.insertOne(msg);
  return msg;
}

export async function getChatHistory(roomId, limit = 50) {
  const col = await getChatCol();
  return col
    .find({ roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
    .then(arr => arr.reverse());
}

export async function ensureChatIndexes() {
  const col = await getChatCol();
  await col.createIndex({ roomId: 1, createdAt: -1 });
}

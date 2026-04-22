import { logger } from '../../logger.mjs';
import { rooms, hydrateFromDb, getRoomSummary } from '../../services/roomManager.mjs';
import { getConfig } from '../../services/siteConfig.mjs';
import { getGamesCol } from '../../mongo.mjs';
import { onlineUids, getPresenceForUid } from '../presence.mjs';

export function registerLobbyHandlers(io, socket) {
  socket.on('lobby:list', async (ack) => {
    try {
      const col = await getGamesCol();
      const maxRooms = await getConfig('game.maxActiveRooms').catch(() => 500);
      const docs = await col
        .find({ status: { $in: ['open', 'started'] } }, { projection: { _id: 1, updatedAt: 1, createdAt: 1, state: 1, timeMode: 1, timeControl: 1, status: 1, playerUids: 1, playerNames: 1 } })
        .sort({ createdAt: -1 })
        .limit(maxRooms)
        .toArray();

      const list = docs
        .map((d) => {
          const rid = d._id;
          const st = rooms.get(rid) || hydrateFromDb(d);
          if (!st) return null;
          if (st.isPrivate) return null;
          return getRoomSummary(rid, st);
        })
        .filter(Boolean);

      if (typeof ack === 'function') ack({ ok: true, rooms: list });
      else socket.emit('lobby:list', { ok: true, rooms: list });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: 'LOBBY_LIST_FAILED' });
      logger.error('[LOBBY_HANDLERS] lobby:list exception:', e.message);
    }
  });

  socket.on('presence:list', (ack) => {
    try {
      const uids = Array.from(onlineUids.values());
      const items = uids.map((uid) => getPresenceForUid(uid));
      if (typeof ack === 'function') ack({ ok: true, presence: items });
      else socket.emit('presence:list', { ok: true, presence: items });
    } catch (e) {
      logger.error('[LOBBY_HANDLERS] presence:list error', e);
      if (typeof ack === 'function') ack({ ok: false, error: 'PRESENCE_LIST_FAILED' });
    }
  });
}

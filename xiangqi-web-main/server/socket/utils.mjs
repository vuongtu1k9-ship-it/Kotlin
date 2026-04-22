import { rooms, getRoomSummary, findActiveRoomForUid } from '../services/roomManager.mjs';

export function getChatName(socket) {
  const u = socket.data?.user;
  if (!u) return 'Guest';
  return u.name || u.email || u.uid || 'User';
}

/**
 * Proactively notifies a user (via their private 'user:<uid>' room) 
 * about whether they have an active game.
 */
export async function notifyActiveGameUpdate(io, uid) {
  if (!uid) return;
  try {
    const roomId = await findActiveRoomForUid(uid);
    io.to('user:' + uid).emit('room:active_game', { roomId: roomId || null });
  } catch (e) {
    // ignore
  }
}

export const broadcastRoomUpdate = (io, roomId) => {
  const state = rooms.get(roomId);
  if (!state) return;
  const summary = getRoomSummary(roomId, state);
  io.to(roomId).emit('room:update', summary);
  // Private rooms must NOT appear in the public lobby feed
  if (!state.isPrivate) {
    io.emit('lobby:update', summary);
  }

  // Also notify players about their active game status
  if (state.playerUids?.red) notifyActiveGameUpdate(io, state.playerUids.red);
  if (state.playerUids?.black) notifyActiveGameUpdate(io, state.playerUids.black);
};

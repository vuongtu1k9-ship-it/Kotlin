import { loadRoom, saveRoom, rooms, makeRoomId } from '../../../services/roomManager.mjs';
import { logger } from '../../../logger.mjs';
import { createInitialState } from '../../../services/gameState.mjs';
import { broadcastRoomUpdate } from '../../utils.mjs';
import { scoreGameIfNeeded } from '../../../scoring.mjs';
import { broadcastActivityChange, playingRoomByUid } from '../../presence.mjs';
import { invalidateImageCache } from '../../../utils/cache.mjs';

function clearPlayersActivity(state) {
  const uids = [state?.playerUids?.red, state?.playerUids?.black].filter(Boolean);
  for (const u of uids) playingRoomByUid.delete(String(u));
  broadcastActivityChange(uids, 'idle');
}

export function registerControlHandler(io, socket) {
  socket.on('game:resign', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state || state.finished || !state.started) { if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' }); return; }
    const side = socket.data.side; if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' }); return; }
    if (state.moveHistory?.length === 0) { if (typeof ack === 'function') ack({ ok: true }); return; }
    state.finished = true; state.started = false; state.winner = side === 'red' ? 'black' : 'red'; state.endedBy = 'resign'; state.updatedAt = Date.now();
    await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
    io.to(roomId).emit('game:over', { roomId, finished: true, winner: state.winner, endedBy: state.endedBy });
    broadcastRoomUpdate(io, roomId); scoreGameOfNeeded(roomId).catch(() => {}); clearPlayersActivity(state); invalidateImageCache(`game-${roomId}`);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:draw:request', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase(), state = await loadRoom(roomId);
    if (!state || state.finished || !state.started) { if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' }); return; }
    const side = socket.data.side; if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' }); return; }
    io.to(roomId).emit('game:draw:request', { roomId, side });
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:draw:response', async ({ roomId: rawRoomId, accepted } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase(), state = await loadRoom(roomId);
    if (!state || state.finished || !state.started) { if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' }); return; }
    const side = socket.data.side; if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' }); return; }
    if (accepted) {
      state.finished = true; state.started = false; state.winner = null; state.endedBy = 'draw'; state.updatedAt = Date.now();
      await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
      io.to(roomId).emit('game:over', { roomId, finished: true, winner: null, endedBy: 'draw' });
      broadcastRoomUpdate(io, roomId); scoreGameIfNeeded(roomId).catch(() => {}); clearPlayersActivity(state);
    } else { io.to(roomId).emit('game:draw:declined', { roomId, side }); }
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:rematch:request', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase(), state = await loadRoom(roomId);
    if (!state || !state.finished) { if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' }); return; }
    const side = socket.data.side; if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' }); return; }
    io.to(roomId).emit('game:rematch:request', { roomId, side });
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:rematch:response', async ({ roomId: rawRoomId, accepted } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase(), state = await loadRoom(roomId);
    if (!state || !state.finished) { if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' }); return; }
    const side = socket.data.side; if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' }); return; }
    if (accepted) {
      const newRoomId = makeRoomId(), nextState = createInitialState({ timeMode: state.timeMode || 'standard', timeControl: state.timeControl, setupId: state.setupId });
      nextState.playerUids.red = state.playerUids.black; nextState.playerUids.black = state.playerUids.red;
      nextState.playerNames.red = state.playerNames.black; nextState.playerNames.black = state.playerNames.red;
      nextState.isPrivate = state.isPrivate; nextState.isRanked = state.isRanked; nextState.isFixed = state.isFixed; nextState.boardType = state.boardType;
      await saveRoom(newRoomId, nextState); rooms.set(newRoomId, nextState);
      io.to(roomId).emit('game:rematch:start', { roomId, newRoomId });
    } else { io.to(roomId).emit('game:rematch:declined', { roomId, side }); }
    if (typeof ack === 'function') ack({ ok: true });
  });
}

import { loadRoom } from '../../../services/roomManager.mjs';
import { getCurrentClock } from '../../../services/gameState.mjs';

export function registerSyncHandler(io, socket) {
  socket.on('game:sync', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state) {
      if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }
    const payload = {
      ok: true, roomId, serverMoveIndex: state.serverMoveIndex, currentPlayer: state.currentPlayer,
      moveHistory: state.moveHistory, started: state.started, finished: state.finished,
      winner: state.winner, endedBy: state.endedBy, clock: getCurrentClock(state),
      serverTime: Date.now(), timeMode: state.timeMode, timeControl: state.timeControl,
      spectators: Array.from(state.spectators.values()),
      players: {
        red: Boolean(state.players.red), black: Boolean(state.players.black),
        redUid: state.playerUids?.red || null, blackUid: state.playerUids?.black || null,
        redName: state.playerNames?.red || null, blackName: state.playerNames?.black || null,
      },
      playerUids: state.playerUids, playerNames: state.playerNames, board: state.board, updatedAt: state.updatedAt,
    };
    if (typeof ack === 'function') ack(payload);
    else socket.emit('game:state', payload);
  });
}

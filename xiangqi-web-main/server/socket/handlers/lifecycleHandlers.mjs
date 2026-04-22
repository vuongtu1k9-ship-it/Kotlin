import { ObjectId } from 'mongodb';
import { logger } from '../../logger.mjs';
import { rooms, loadRoom, saveRoom, deleteRoom, getRoomSummary, makeRoomId, findActiveRoomForUid, hydrateFromDb } from '../../services/roomManager.mjs';
import { ensureUserFromJwtPayload } from '../../users.mjs';
import { getChatHistory } from '../../chat.mjs';
import { createInitialState } from '../../services/gameState.mjs';
import { getDb } from '../../mongo.mjs';
import { broadcastRoomUpdate } from '../utils.mjs';
import { playingRoomByUid, broadcastActivityChange, broadcastToIdleUsers } from '../presence.mjs';
import { isInCheck } from '../../moveLogic.mjs';

export function registerLifecycleHandlers(io, socket) {
  socket.on('room:mine', async (ack) => {
    try {
      const uid = socket.data.user?.uid;
      if (!uid) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      const activeRoomId = await findActiveRoomForUid(uid);
      if (typeof ack === 'function') ack({ ok: true, roomId: activeRoomId });
    } catch (e) {
      logger.error('[LIFECYCLE_HANDLERS] room:mine failed:', e);
      if (typeof ack === 'function') ack({ ok: false });
    }
  });

  socket.on('room:active_check', async () => {
    try {
      const uid = socket.data.user?.uid;
      if (!uid) return;
      const activeRoomId = await findActiveRoomForUid(uid);
      socket.emit('room:active_game', { roomId: activeRoomId });
    } catch (e) {
      logger.error('[LIFECYCLE_HANDLERS] room:active_check failed:', e);
    }
  });

  socket.on('room:create', async ({ timeMode, setupId, tournamentId, isPrivate, boardType, isFixed } = {}, ack) => {
    try {
      const user = await ensureUserFromJwtPayload(socket.data.user).catch(() => null);
      if (!user || user.provider === 'guest') {
        if (typeof ack === 'function') ack({ ok: false, error: 'GUEST_RESTRICTION', message: 'Bạn cần đăng nhập để tạo bàn mới.' });
        return;
      }
      const uid = String(user.uid);
      const name = user.name || 'Người dùng';
      const activeRoomId = await findActiveRoomForUid(uid);
      if (activeRoomId) {
        if (typeof ack === 'function') ack({ ok: false, error: 'ALREADY_IN_GAME', roomId: activeRoomId });
        return;
      }
      const roomId = makeRoomId();
      let initialBoard = null, normalizedSetupId = null, puzzleName = null;
      if (setupId) {
        try {
          const db = await getDb();
          let doc;
          if (String(setupId).length >= 4 && String(setupId).length <= 10) {
            doc = await db.collection('puzzles').findOne({ uid: String(setupId) });
          }
          if (!doc && ObjectId.isValid(setupId)) {
            doc = await db.collection('puzzles').findOne({ _id: new ObjectId(String(setupId)) });
          }
          if (!doc?.board) {
            if (typeof ack === 'function') ack({ ok: false, error: 'SETUP_NOT_FOUND' });
            return;
          }
          let b = doc.board, next = [];
          const typeMap = { king: 'general', pawn: 'soldier' };
          if (Array.isArray(b) && b.length === 10 && Array.isArray(b[0])) {
            next = b.map((row, r) => row.map((p, c) => {
              if (!p) return null;
              const side = p.side === 'red' || p.side === 'black' ? p.side : null;
              let type = String(p.type || '');
              if (typeMap[type]) type = typeMap[type];
              if (!side || !type) return null;
              return { ...p, side, type, position: { row: r, col: c }, hasMoved: true };
            }));
          } else if (Array.isArray(b)) {
            for (let r = 0; r < 10; r++) next[r] = new Array(9).fill(null);
            for (const entry of b) {
              if (typeof entry !== 'string' || entry.length === 0) continue;
              const colIdx = entry.indexOf(':'); if (colIdx < 2) continue;
              const withSide = entry.substring(0, colIdx), posStr = entry.substring(colIdx + 1);
              const sideLabel = withSide.charAt(0); let rawType = withSide.substring(1);
              if (typeMap[rawType]) rawType = typeMap[rawType];
              let side = sideLabel === 'r' ? 'red' : sideLabel === 'b' ? 'black' : null;
              if (!side || !rawType) continue;
              const row = parseInt(posStr.charAt(0), 10), col = parseInt(posStr.charAt(1), 10);
              if (isNaN(row) || isNaN(col) || row < 0 || row > 9 || col < 0 || col > 8) continue;
              next[row][col] = { id: `${side}-${rawType}-${row}${col}`, side, type: rawType, position: { row, col }, hasMoved: true };
            }
          }
          initialBoard = next; normalizedSetupId = doc.uid || String(doc._id); puzzleName = doc.name;
        } catch (e) {
          if (typeof ack === 'function') ack({ ok: false, error: 'LOAD_SETUP_FAILED' });
          logger.error('[LIFECYCLE_HANDLERS] room:create setup load failed:', e.message);
          return;
        }
      }
      const st = createInitialState({ timeMode: timeMode || 'standard', board: initialBoard, setupId: normalizedSetupId, tournamentId });
      st.isPrivate = !!isPrivate; st.isFixed = !!isFixed || !!tournamentId;
      st.boardType = boardType || (normalizedSetupId ? 'puzzle' : 'standard');
      st.playerUids.black = uid; st.playerNames.black = user?.name || 'Khách';
      const isBot = (user?.email || user?.emailLower || '').toLowerCase().endsWith('@cotuong.xyz');
      st.playerIsBot = { red: false, black: isBot };
      st.isRanked = !st.isPrivate && st.boardType === 'standard' && !tournamentId;
      if (puzzleName) st.puzzleName = puzzleName;
      st.createdBy = uid;
      if (setupId) {
        st.players.black = socket.id; st.playerUids.black = uid;
        st.playerNames.black = user?.name || user?.email || uid;
        socket.data.side = 'black'; socket.data.roomId = roomId; socket.join(roomId);
      }
      await saveRoom(roomId, st, { status: 'open', isPrivate: st.isPrivate, isRanked: st.isRanked, isFixed: st.isFixed, boardType: st.boardType, setupId: normalizedSetupId });
      rooms.set(roomId, st);
      broadcastRoomUpdate(io, roomId);
      if (!st.isPrivate && !st.tournamentId && !st.isFixed) {
        const creatorName = st.playerNames.black || st.playerNames.red || user?.name || user?.email || 'Kỳ thủ';
        broadcastToIdleUsers(io, roomId, creatorName, st.timeMode, uid);
      }
      if (typeof ack === 'function') ack({ ok: true, roomId });
    } catch (e) {
      logger.error('[LIFECYCLE_HANDLERS] room:create failure:', e);
      if (typeof ack === 'function') ack({ ok: false, error: 'CREATE_ROOM_FAILED' });
    }
  });

  socket.on('room:watch', async ({ roomId } = {}, ack) => {
    try {
      const state = await loadRoom(roomId);
      if (!state) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' }); return; }
      const u = await ensureUserFromJwtPayload(socket.data.user);
      if (state.isPrivate) {
        const uids = Object.values(state.playerUids || {}).map(v => String(v)).filter(v => v && v !== 'null');
        if (!u?.uid || !uids.includes(String(u.uid))) {
          if (typeof ack === 'function') ack({ ok: false, error: 'PRIVATE_ROOM', detail: 'Phòng này là riêng tư.' });
          return;
        }
      }
      state.spectators.set(socket.id, { uid: u?.uid || socket.id, name: u?.name || 'Khách', picture: u?.picture || null });
      const rid = String(roomId || '').toLowerCase();
      socket.data.roomId = rid; socket.data.side = null; socket.data.role = 'spectator'; socket.join(rid);
      if (u?.uid) broadcastActivityChange([u.uid], 'spectating');
      state.updatedAt = Date.now();
      getChatHistory(roomId).then(h => socket.emit('chat:history', { roomId, messages: h })).catch(() => {});
      saveRoom(roomId, state).catch(() => {});
      broadcastRoomUpdate(io, roomId);
      if (typeof ack === 'function') {
        const summary = getRoomSummary(roomId, state);
        ack({ ok: true, roomId, role: 'spectator', serverMoveIndex: state.serverMoveIndex, currentPlayer: state.currentPlayer, moveHistory: state.moveHistory, started: state.started, finished: state.finished, winner: state.winner, endedBy: state.endedBy, players: { red: Boolean(state.players.red), black: Boolean(state.players.black), redUid: state.playerUids?.red || null, blackUid: state.playerUids?.black || null, redName: state.playerNames?.red || null, blackName: state.playerNames?.black || null }, playerUids: state.playerUids, playerNames: state.playerNames, board: state.board, updatedAt: state.updatedAt, clock: summary.clock, serverTime: Date.now() });
      }
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: 'WATCH_FAILED' });
      logger.error('[LIFECYCLE_HANDLERS] room:watch exception:', e.message);
    }
  });

  socket.on('room:join', async ({ roomId } = {}, ack) => {
    try {
      const state = await loadRoom(roomId);
      if (!state) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' }); return; }
      if (state.finished) { if (typeof ack === 'function') ack({ ok: false, error: 'GAME_FINISHED' }); return; }
      const userDoc = await ensureUserFromJwtPayload(socket.data.user).catch(() => null);
      if (!userDoc || userDoc.provider === 'guest') {
        if (typeof ack === 'function') ack({ ok: false, error: 'GUEST_RESTRICTION', message: 'Cần đăng nhập để chơi.' });
        return;
      }
      const myUid = String(userDoc.uid);
      const activeRoomId = await findActiveRoomForUid(myUid);
      if (activeRoomId && activeRoomId !== roomId) { if (typeof ack === 'function') ack({ ok: false, error: 'ALREADY_IN_GAME', roomId: activeRoomId }); return; }

      let side = null;
      if (String(state.playerUids.red) === myUid) side = 'red';
      else if (String(state.playerUids.black) === myUid) side = 'black';
      if (!side) {
        if (!state.players.black && !state.playerUids.black) side = 'black';
        else if (!state.players.red && !state.playerUids.red) side = 'red';
      }
      if (state.tournamentId || state.isFixed) {
        if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_LOCKED' }); return; }
      }
      if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_FULL' }); return; }

      state.spectators.delete(socket.id);
      state.players[side] = socket.id; state.playerUids[side] = myUid;
      state.playerIsBot[side] = (userDoc.email || userDoc.emailLower || '').toLowerCase().endsWith('@cotuong.xyz');
      if (!state.playerNames) state.playerNames = { red: null, black: null };
      state.playerNames[side] = userDoc.name || 'Kỳ thủ';

      const rid = String(roomId).toLowerCase();
      socket.data.roomId = rid; socket.data.side = side; socket.data.role = 'player';
      playingRoomByUid.set(myUid, rid);
      broadcastActivityChange([myUid], state.started ? 'playing' : 'waiting');
      socket.join(rid);
      state.updatedAt = Date.now();
      getChatHistory(roomId).then(h => socket.emit('chat:history', { roomId, messages: h })).catch(() => {});
      await saveRoom(roomId, state, { status: state.started ? 'started' : 'open', clock: state.clock, timeMode: state.timeMode, playerUids: state.playerUids, playerNames: state.playerNames });
      io.to(roomId).emit('room:players', { roomId, players: { red: Boolean(state.players.red), black: Boolean(state.players.black) }, playerUids: state.playerUids, playerNames: state.playerNames, spectators: Array.from(state.spectators.values()), started: state.started, finished: state.finished, winner: state.winner, endedBy: state.endedBy });
      broadcastRoomUpdate(io, roomId);
      if (typeof ack === 'function') {
        const summary = getRoomSummary(roomId, state);
        ack({ ok: true, roomId, side, players: { red: Boolean(state.players.red), black: Boolean(state.players.black), redUid: state.playerUids?.red || null, blackUid: state.playerUids?.black || null, redName: state.playerNames?.red || null, blackName: state.playerNames?.black || null }, playerUids: state.playerUids, playerNames: state.playerNames, started: state.started, finished: state.finished, winner: state.winner, endedBy: state.endedBy, serverMoveIndex: state.serverMoveIndex, currentPlayer: state.currentPlayer, moveHistory: state.moveHistory, board: state.board, updatedAt: state.updatedAt, clock: summary.clock, serverTime: Date.now() });
      }
    } catch (e) {
      logger.error('[LIFECYCLE_HANDLERS] room:join error:', e);
      if (typeof ack === 'function') ack({ ok: false, error: 'INTERNAL_ERROR' });
    }
  });

  socket.on('room:leave', async ({ roomId } = {}, ack) => {
    try {
      const state = await loadRoom(roomId);
      if (!state) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' }); return; }
      const side = socket.data.side, role = socket.data.role, myUid = socket.data.user?.uid ? String(socket.data.user.uid) : null, moves = state.moveHistory?.length ?? 0;
      if (role === 'spectator' || !side) { state.spectators.delete(socket.id); if (myUid) broadcastActivityChange([myUid], 'idle'); }
      else {
        if (state.players[side] === socket.id) state.players[side] = null;
        if (!state.started && moves === 0) { state.playerUids[side] = null; if (state.playerNames) state.playerNames[side] = null; if (myUid) broadcastActivityChange([myUid], 'idle'); }
      }
      io.to(roomId).emit('room:players', { roomId, players: { red: Boolean(state.players.red), black: Boolean(state.players.black) }, playerUids: state.playerUids, playerNames: state.playerNames, spectators: Array.from(state.spectators.values()), started: state.started, finished: state.finished });
      socket.leave(roomId); socket.data.roomId = null; socket.data.side = null; socket.data.role = null;
      state.updatedAt = Date.now();
      if (!state.players.red && !state.players.black && !state.finished && (moves === 0 || !(state.isFixed || state.tournamentId))) {
        await deleteRoom(roomId); broadcastRoomUpdate(io, roomId);
      } else {
        await saveRoom(roomId, state, { playerUids: state.playerUids, playerNames: state.playerNames });
        broadcastRoomUpdate(io, roomId);
      }
      if (typeof ack === 'function') ack({ ok: true });
    } catch (e) {
      logger.error('[LIFECYCLE_HANDLERS] room:leave error:', e);
    }
  });

  socket.on('room:swap', async ({ roomId: rawRoomId, accept } = {}, ack) => {
    try {
      const rid = String(rawRoomId || '').toLowerCase(), state = await loadRoom(rid);
      if (!state) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' }); return; }
      if (state.moveHistory?.length > 0) { if (typeof ack === 'function') ack({ ok: false, error: 'GAME_STARTED' }); return; }
      const side = socket.data.side; if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_IN_ROOM' }); return; }
      const opSide = side === 'red' ? 'black' : 'red', opSocketId = state.players[opSide], opUid = state.playerUids[opSide], myUid = state.playerUids[side];
      if (!opSocketId) { if (typeof ack === 'function') ack({ ok: false, error: 'WAIT_FOR_OPPONENT' }); return; }
      if (accept === undefined) {
        if (opUid) io.to('user:' + opUid).emit('game:swap:request', { roomId: rid, side });
        if (typeof ack === 'function') ack({ ok: true });
      } else if (accept === true) {
        state.players[side] = opSocketId; state.players[opSide] = socket.id;
        state.playerUids[side] = opUid; state.playerUids[opSide] = myUid;
        const myName = state.playerNames?.[side], opName = state.playerNames?.[opSide];
        if (state.playerNames) { state.playerNames[side] = opName; state.playerNames[opSide] = myName; }
        socket.data.side = opSide; const opSocket = io.sockets.sockets.get(opSocketId); if (opSocket) opSocket.data.side = side;
        if (state.clock) { const rRed = state.clock.remainingMs.red, rBlack = state.clock.remainingMs.black; state.clock.remainingMs.red = rBlack; state.clock.remainingMs.black = rRed; }
        state.updatedAt = Date.now();
        await saveRoom(rid, state, { playerUids: state.playerUids, playerNames: state.playerNames, clock: state.clock });
        io.to(rid).emit('room:players', { roomId: rid, players: { red: true, black: true }, playerUids: state.playerUids, playerNames: state.playerNames, spectators: Array.from(state.spectators.values()) });
        broadcastRoomUpdate(io, rid); io.to(rid).emit('game:swap:success', { roomId: rid, side, opSide });
        if (typeof ack === 'function') ack({ ok: true });
      } else {
        io.to(rid).emit('game:swap:declined', { roomId: rid, side });
        if (typeof ack === 'function') ack({ ok: true });
      }
    } catch (e) {
      logger.error('[LIFECYCLE_HANDLERS] room:swap error:', e);
    }
  });
}

import { ObjectId } from 'mongodb';
import { logger } from '../logger.mjs';
import { rooms, loadRoom, saveRoom, deleteRoom, hydrateFromDb, getRoomSummary, makeRoomId, findActiveRoomForUid } from '../services/roomManager.mjs';
import { ensureUserFromJwtPayload } from '../users.mjs';
import { getChatHistory } from '../chat.mjs';
import { createInitialState, startTurnClock } from '../services/gameState.mjs';
import { getConfig } from '../services/siteConfig.mjs';
import { getDb, getGamesCol } from '../mongo.mjs';
import { broadcastRoomUpdate } from './utils.mjs';
import { onlineUids, getPresenceForUid, playingRoomByUid, activityByUid, socketsByUid, broadcastActivityChange, broadcastToIdleUsers } from './presence.mjs';
import { isInCheck } from '../moveLogic.mjs';

function emitPresenceUpdate(io, uid) {
  if (!uid) return;
  io.emit('presence:update', getPresenceForUid(uid));
}

export function registerRoomHandlers(io, socket) {


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
      logger.error('[ROOM_HANDLERS] room:mine failed:', e);
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
      logger.error('[ROOM_HANDLERS] room:active_check failed:', e);
    }
  });

  socket.on('room:create', async ({ timeMode, setupId, tournamentId, isPrivate, boardType, isFixed } = {}, ack) => {

    try {
      const user = await ensureUserFromJwtPayload(socket.data.user).catch(() => null);
      const guestAllowed = await getConfig('site.guestAllowed').catch(() => true);
      
      const isGuest = !user || user.provider === 'guest';
      if (isGuest && !guestAllowed) {
        if (typeof ack === 'function') ack({ ok: false, error: 'GUEST_RESTRICTION', message: 'Bạn cần đăng nhập để tạo bàn mới.' });
        return;
      }
      
      const uid = user?.uid ? String(user.uid) : `guest-${socket.id}`;
      const name = user?.name || 'Khách';

      // Single active game check (Only for logged-in users)
      if (user && user.provider !== 'guest') {
        const activeRoomId = await findActiveRoomForUid(uid);
        if (activeRoomId) {
          if (typeof ack === 'function') ack({ ok: false, error: 'ALREADY_IN_GAME', roomId: activeRoomId });
          return;
        }
      }

      const roomId = makeRoomId();
      logger.info(`[ROOM_HANDLERS] room:create request: roomId=${roomId} setupId=${setupId} user=${uid} (Guest: ${isGuest})`);

      let initialBoard = null;
      let normalizedSetupId = null;
      let puzzleName = null;

      if (setupId) {
        try {
          const db = await getDb();
          const col = db.collection('puzzles');
          
          let doc;
          // Support UID lookup first
          if (String(setupId).length >= 4 && String(setupId).length <= 10) {
            doc = await db.collection('puzzles').findOne({ uid: String(setupId) });
            if (!doc) doc = await db.collection('puzzles').findOne({ uid: String(setupId) });
          }
          if (!doc && ObjectId.isValid(setupId)) {
            const oid = new ObjectId(String(setupId));
            doc = await db.collection('puzzles').findOne({ _id: oid });
            if (!doc) doc = await db.collection('puzzles').findOne({ _id: oid });
          }

          if (!doc?.board) {
            if (typeof ack === 'function') ack({ ok: false, error: 'SETUP_NOT_FOUND' });
            return;
          }

          let b = doc.board;
          let next = [];

          const typeMap = {
            king: 'general',
            pawn: 'soldier'
          };

          if (Array.isArray(b) && b.length === 10 && Array.isArray(b[0])) {
            // New format: 2D object array
            next = b.map((row, r) =>
              row.map((p, c) => {
                if (!p) return null;
                const side = p.side === 'red' || p.side === 'black' ? p.side : null;
                let type = String(p.type || '');
                if (typeMap[type]) type = typeMap[type];
                if (!side || !type) return null;
                return {
                  ...p,
                  side,
                  type,
                  position: { row: r, col: c },
                  hasMoved: true,
                };
              })
            );
          } else if (Array.isArray(b)) {
            // Legacy format: 1D array of strings like ['rpawn:01', 'bking:04', ...]
            for (let r = 0; r < 10; r++) {
              next[r] = new Array(9).fill(null);
            }
            for (const entry of b) {
              if (typeof entry !== 'string' || entry.length === 0) continue;
              const colonIdx = entry.indexOf(':');
              if (colonIdx < 2) continue;
              const withSide = entry.substring(0, colonIdx);
              const posStr   = entry.substring(colonIdx + 1);
              const sideLabel = withSide.charAt(0);
              let rawType = withSide.substring(1);
              
              if (typeMap[rawType]) rawType = typeMap[rawType];
              
              let side = null;
              if (sideLabel === 'r') side = 'red';
              else if (sideLabel === 'b') side = 'black';
              if (!side || !rawType) continue;
              
              const row = parseInt(posStr.charAt(0), 10);
              const col = parseInt(posStr.charAt(1), 10);
              if (isNaN(row) || isNaN(col) || row < 0 || row > 9 || col < 0 || col > 8) continue;
              
              const id = `${side}-${rawType}-${row}${col}`;
              next[row][col] = { id, side, type: rawType, position: { row, col }, hasMoved: true };
            }
          } else {
            logger.error('[ROOM_HANDLERS] setup board invalid format:', typeof b);
            if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_SETUP_BOARD' });
            return;
          }

          let redG = 0;
          let blackG = 0;
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
              const p = next[r][c];
              if (p?.type === 'general' || p?.type === 'king') {
                if (p.side === 'red') redG++;
                if (p.side === 'black') blackG++;
              }
            }
          }
          if (redG < 1 || blackG < 1) {
            if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_SETUP_GENERALS' });
            return;
          }
          if (isInCheck('red', next) && isInCheck('black', next)) {
            if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_SETUP_BOTH_IN_CHECK' });
            return;
          }

          initialBoard = next;
          normalizedSetupId = doc.uid || String(doc._id);
          puzzleName = doc.name; // Get puzzle name
        } catch (e) {
          if (typeof ack === 'function') ack({ ok: false, error: 'LOAD_SETUP_FAILED' });
          logger.error('[ROOM_HANDLERS] room:create setup load failed:', e.message);
          return;
        }
      }

      logger.debug(`[ROOM_HANDLERS] Creating room: isPrivate=${isPrivate}, tournamentId=${tournamentId}, isFixed=${isFixed}, uid=${uid}`);
      const st = createInitialState({ timeMode: timeMode || 'standard', board: initialBoard, setupId: normalizedSetupId, tournamentId });
      st.isPrivate = !!isPrivate;
      st.isFixed = !!isFixed || !!tournamentId;
      st.boardType = boardType || (normalizedSetupId ? 'puzzle' : 'standard');
      st.playerUids.black = uid;
      st.playerNames.black = user?.name || 'Khách';
      const isBot = (user?.email || user?.emailLower || '').toLowerCase().endsWith('@cotuong.xyz');
      st.playerIsBot = { red: false, black: isBot };
      // Puzzles are NEVER ranked
      st.isRanked = !st.isPrivate && st.boardType === 'standard' && !tournamentId;

      if (puzzleName) st.puzzleName = puzzleName;
      st.createdBy = uid;
      
      // For puzzle matches, creator joins as Black by default as requested
      if (setupId) {
        st.players.black = socket.id;
        st.playerUids.black = uid;
        st.playerNames.black = user?.name || user?.email || uid;
        socket.data.side = 'black';
        socket.data.roomId = roomId;
        socket.join(roomId);
      }

      // Persist to DB immediately so Lobby/Redirects work
      await saveRoom(roomId, st, { 
        status: 'open', 
        isPrivate: st.isPrivate,
        isRanked: st.isRanked,
        isFixed: st.isFixed,
        boardType: st.boardType,
        setupId: normalizedSetupId 
      });

      rooms.set(roomId, st);
      broadcastRoomUpdate(io, roomId);

      // Automated Invitations for Public Rooms
      logger.info(`[ROOM_HANDLERS] Automated Invite PRE-CHECK: roomId=${roomId}, isPrivate=${st.isPrivate}, tournamentId=${st.tournamentId}, isFixed=${st.isFixed}`);
      if (!st.isPrivate && !st.tournamentId && !st.isFixed) {
        const user = socket.data.user || {};
        const creatorName = st.playerNames.black || st.playerNames.red || user.name || user.email || 'Kỳ thủ';
        logger.info(`[ROOM_HANDLERS] Triggering broadcastToIdleUsers for room ${roomId} by ${creatorName} (uid: ${uid})`);
        broadcastToIdleUsers(io, roomId, creatorName, st.timeMode, uid);
      }

      if (typeof ack === 'function') ack({ ok: true, roomId });
    } catch (e) {
      logger.error('[ROOM_HANDLERS] room:create critical failure:', e);
      if (typeof ack === 'function') ack({ ok: false, error: 'CREATE_ROOM_FAILED' });
    }
  });

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
          // Never expose private rooms in the public lobby
          if (st.isPrivate) return null;
          return getRoomSummary(rid, st);
        })
        .filter(Boolean);

      if (typeof ack === 'function') ack({ ok: true, rooms: list });
      else socket.emit('lobby:list', { ok: true, rooms: list });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: 'LOBBY_LIST_FAILED' });
      logger.error('[ROOM_HANDLERS] lobby:list exception:', e.message);
    }
  });

  socket.on('presence:list', (ack) => {
    try {
      const uids = Array.from(onlineUids.values());
      const items = uids.map((uid) => getPresenceForUid(uid));
      if (typeof ack === 'function') ack({ ok: true, presence: items });
      else socket.emit('presence:list', { ok: true, presence: items });
    } catch (e) {
      logger.error('[ROOM_HANDLERS] presence:list error', e);
      if (typeof ack === 'function') ack({ ok: false, error: 'PRESENCE_LIST_FAILED' });
    }
  });


  socket.on('room:watch', async ({ roomId } = {}, ack) => {
    try {
      const state = await loadRoom(roomId);
      if (!state) {
        if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
        return;
      }

      const u = await ensureUserFromJwtPayload(socket.data.user);

      // Private room: strictly only the two players may join/watch
      if (state.isPrivate) {
        const uids = Object.values(state.playerUids || {}).map(v => String(v)).filter(v => v && v !== 'null');
        if (!u?.uid || !uids.includes(String(u.uid))) {
          if (typeof ack === 'function') ack({ ok: false, error: 'PRIVATE_ROOM', detail: 'Phòng này là riêng tư. Chỉ kỳ thủ được chỉ định mới có thể vào.' });
          return;
        }
      }

      state.spectators.set(socket.id, {
        uid: u?.uid || socket.id,
        name: u?.name || 'Khách',
        picture: u?.picture || null,
      });
      const rid = String(roomId || '').toLowerCase();
      socket.data.roomId = rid;
      socket.data.side = null;
      socket.data.role = 'spectator';
      socket.join(rid);

      // Mark this user as spectating
      if (u?.uid) broadcastActivityChange([u.uid], 'spectating');

      state.updatedAt = Date.now();
      getChatHistory(roomId)
        .then(h => socket.emit('chat:history', { roomId, messages: h }))
        .catch(err => logger.error(`[ROOM_HANDLERS] getChatHistory failed for room ${roomId}:`, err.message));

      saveRoom(roomId, state)
        .catch(err => logger.error(`[ROOM_HANDLERS] saveRoom failed for room ${roomId} (spectator join):`, err.message));
      broadcastRoomUpdate(io, roomId);

      if (typeof ack === 'function') {
        ack({
          ok: true,
          roomId,
          role: 'spectator',
          serverMoveIndex: state.serverMoveIndex,
          currentPlayer: state.currentPlayer,
          moveHistory: state.moveHistory,
          started: state.started,
          finished: state.finished,
          winner: state.winner,
          endedBy: state.endedBy,
          players: {
            red: Boolean(state.players.red),
            black: Boolean(state.players.black),
            redUid: state.playerUids?.red || null,
            blackUid: state.playerUids?.black || null,
            redName: state.playerNames?.red || null,
            blackName: state.playerNames?.black || null,
          },
          playerUids: state.playerUids,
          playerNames: state.playerNames,
          board: state.board,
          updatedAt: state.updatedAt,
          clock: getRoomSummary(roomId, state).clock,
          serverTime: Date.now(),
        });
      }
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: 'WATCH_FAILED' });
      logger.error('[ROOM_HANDLERS] room:watch exception:', e.message);
    }
  });

  socket.on('room:join', async ({ roomId } = {}, ack) => {
    try {
      const state = await loadRoom(roomId);
      if (!state) {
        if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
        return;
      }
      if (state.finished) {
        if (typeof ack === 'function') ack({ ok: false, error: 'GAME_FINISHED' });
        return;
      }

      // 1. Resolve Identity & Active Status BEFORE deciding side
      const userDoc = await ensureUserFromJwtPayload(socket.data.user).catch(() => null);
      
      if (!userDoc || (userDoc.provider === 'guest' && !asSpectator)) {
        if (typeof ack === 'function') ack({ ok: false, error: 'GUEST_RESTRICTION', message: 'Bạn cần đăng nhập để ngồi vào bàn và thi đấu.' });
        return;
      }

      const myUid = (userDoc?.uid || socket.data.user?.uid) 
        ? String(userDoc?.uid || socket.data.user?.uid) 
        : `guest-${socket.id}`;
      
      if (myUid) {
        const activeRoomId = await findActiveRoomForUid(myUid);
        if (activeRoomId && activeRoomId !== roomId) {
          if (typeof ack === 'function') ack({ ok: false, error: 'ALREADY_IN_GAME', roomId: activeRoomId });
          return;
        }
      }


      // 2. Determine Side (Synchronous block to prevent interleaving during seat selection)
      let side = null;

      if (myUid) {
        if (String(state.playerUids.red) === myUid) side = 'red';
        else if (String(state.playerUids.black) === myUid) side = 'black';
      }

      if (!side) {
        const redAvailable = !state.players.red && !state.playerUids.red;
        const blackAvailable = !state.players.black && !state.playerUids.black;
        
        // Pick a side based on availability
        if (blackAvailable && redAvailable) side = 'black';
        else if (blackAvailable) side = 'black';
        else if (redAvailable) side = 'red';

        // Final check: if we just picked a side but the user is ALREADY in the other slot (race condition)
        // This is a safety net for Guest-to-Known transitions or extreme concurrency
        if (side && myUid) {
          const otherSide = side === 'red' ? 'black' : 'red';
          if (String(state.playerUids[otherSide]) === myUid) {
            side = otherSide;
          }
        }
      }

      // Strict enforcement for Locked/Tournament/Fixed rooms
      if (state.tournamentId || state.isFixed) {
        if (!side) {
          logger.warn(`[room:join] ROOM_LOCKED for uid=${myUid} roomId=${roomId}`);
          const players = Object.values(state.playerNames || {}).filter(Boolean).join(' vs ');
          if (typeof ack === 'function') ack({ 
            ok: false, 
            error: 'ROOM_LOCKED', 
            detail: `Ván đấu này đã được ấn định cho ${players || 'người chơi khác'}. Bạn chỉ có thể theo dõi với vai trò khán giả.` 
          });
          return;
        }
      }

      if (!side) {
        logger.warn(`[room:join] ROOM_FULL for uid=${myUid} roomId=${roomId} playerUids=`, state.playerUids);
        if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_FULL' });
        return;
      }

      // 3. Assign and Seat
      state.spectators.delete(socket.id);
      state.players[side] = socket.id;
      state.playerUids[side] = myUid;
      const isJoiningBot = (userDoc?.email || userDoc?.emailLower || '').toLowerCase().endsWith('@cotuong.xyz');
      state.playerIsBot[side] = isJoiningBot;
      if (!state.playerNames) state.playerNames = { red: null, black: null };
      state.playerNames[side] = userDoc?.name || 'Kỳ thủ';

      const rid = String(roomId || '').toLowerCase();
      socket.data.roomId = rid;
      socket.data.side = side;
      socket.data.role = 'player';
      
      if (myUid) {
        playingRoomByUid.set(myUid, rid);
        const activity = state.started ? 'playing' : 'waiting';
        broadcastActivityChange([myUid], activity);
      }
      socket.join(rid);

    state.updatedAt = Date.now();

    state.updatedAt = Date.now();
    getChatHistory(roomId)
      .then(h => socket.emit('chat:history', { roomId, messages: h }))
      .catch(err => logger.error(`[ROOM_HANDLERS] getChatHistory failed for room ${roomId}:`, err.message));

    await saveRoom(roomId, state, {
      status: state.started ? 'started' : 'open',
      clock: state.clock,
      timeMode: state.timeMode,
      timeControl: state.timeControl,
      playerUids: state.playerUids,
      playerNames: state.playerNames,
    });

    io.to(roomId).emit('room:players', {
      roomId,
      players: {
        red: Boolean(state.players.red),
        black: Boolean(state.players.black),
      },
      playerUids: state.playerUids,
      playerNames: state.playerNames,
      playersElo: {
        red: side === 'red' ? Number(userDoc?.elo ?? 1200) : undefined,
        black: side === 'black' ? Number(userDoc?.elo ?? 1200) : undefined,
      },
      spectators: Array.from(state.spectators.values()),
      started: state.started,
      finished: state.finished,
      winner: state.winner,
      endedBy: state.endedBy,
    });

    broadcastRoomUpdate(io, roomId);

    if (typeof ack === 'function') {
      ack({
        ok: true,
        roomId,
        side,
        players: {
          red: Boolean(state.players.red),
          black: Boolean(state.players.black),
          redUid: state.playerUids?.red || null,
          blackUid: state.playerUids?.black || null,
          redName: state.playerNames?.red || null,
          blackName: state.playerNames?.black || null,
        },
        playerUids: state.playerUids,
        playerNames: state.playerNames,
        started: state.started,
        finished: state.finished,
        winner: state.winner,
        endedBy: state.endedBy,
        serverMoveIndex: state.serverMoveIndex,
        currentPlayer: state.currentPlayer,
        moveHistory: state.moveHistory,
        board: state.board,
        updatedAt: state.updatedAt,
        clock: getRoomSummary(roomId, state).clock,
        serverTime: Date.now(),
      });
    }
    } catch (e) {
      logger.error('[room:join] error:', e);
      if (typeof ack === 'function') ack({ ok: false, error: 'INTERNAL_ERROR' });
    }
  });

  socket.on('room:leave', async ({ roomId, explicit } = {}, ack) => {
    const state = await loadRoom(roomId);
    if (!state) {
      if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }

    const side = socket.data.side;
    const role = socket.data.role;
    const myUid = socket.data.user?.uid ? String(socket.data.user.uid) : null;
    const moves = state.moveHistory?.length ?? 0;

    // 1. Spectator leaves
    if (role === 'spectator' || !side) {
      state.spectators.delete(socket.id);
      if (myUid) broadcastActivityChange([myUid], 'idle');
    } 
    // 2. Participant leaves
    else {
      if (state.players[side] === socket.id) state.players[side] = null;
      
      // If game not started, clear the seat entirely
      if (!state.started && moves === 0) {
        state.playerUids[side] = null;
        if (state.playerNames) state.playerNames[side] = null;
        if (myUid) broadcastActivityChange([myUid], 'idle');
      }

      // Handle un-start if one player leaves a non-started but "started:true" room (corner case)
      if (state.started && moves === 0) {
        state.playerUids[side] = null;
        if (state.playerNames) state.playerNames[side] = null;
        state.started = false;
        
        const { createInitialState } = await import('../services/gameState.mjs');
        const st = createInitialState({ timeMode: state.timeMode, timeControl: state.timeControl, setupId: state.setupId });
        state.board = st.board;
        state.clock = st.clock;
        state.currentPlayer = st.currentPlayer;
        state.serverMoveIndex = st.serverMoveIndex;
        state.moveHistory = st.moveHistory;

        io.to(roomId).emit('game:state', {
          ok: true,
          roomId,
          serverMoveIndex: state.serverMoveIndex,
          currentPlayer: state.currentPlayer,
          moveHistory: state.moveHistory,
          started: false,
          clock: state.clock,
        });
      }
    }

    // Always broadcast updated players list BEFORE potential deletion
    io.to(roomId).emit('room:players', {
      roomId,
      players: {
        red: Boolean(state.players.red),
        black: Boolean(state.players.black),
      },
      playerUids: state.playerUids,
      playerNames: state.playerNames,
      spectators: Array.from(state.spectators.values()),
      started: state.started,
      finished: state.finished,
    });

    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.side = null;
    socket.data.role = null;

    state.updatedAt = Date.now();

    // Deletion evaluation
    const noPlayersLeft = !state.players.red && !state.players.black;
    const isChallengeRoom = state.isFixed || state.tournamentId;

    if (noPlayersLeft && !state.finished) {
       // Delete orphans or challenge rooms that never started
       if (moves === 0 || !isChallengeRoom) {
         logger.info(`[cleanup] room ${roomId} deleted on leave (moves=${moves})`);
         await deleteRoom(roomId);
         broadcastRoomUpdate(io, roomId);
         if (typeof ack === 'function') ack({ ok: true });
         return;
       }
    }

    await saveRoom(roomId, state, { playerUids: state.playerUids, playerNames: state.playerNames });
    broadcastRoomUpdate(io, roomId);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('room:swap', async ({ roomId: rawRoomId, accept } = {}, ack) => {
    const rid = String(rawRoomId || '').toLowerCase();
    const roomId = rid; // Re-assign to fix all downstream usage
    const state = await loadRoom(rid);
    if (!state) {
      if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }
    
    if (state.moveHistory?.length > 0) {
      if (typeof ack === 'function') ack({ ok: false, error: 'GAME_STARTED' });
      return;
    }

    const side = socket.data.side;
    if (!side) {
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_IN_ROOM' });
      return;
    }

    const opSide = side === 'red' ? 'black' : 'red';
    const opSocketId = state.players[opSide];
    const opUid = state.playerUids[opSide];
    const myUid = state.playerUids[side];

    logger.info(`[room:swap] Request from side=${side}, rid=${rid}, opUid=${opUid}, opSocketId=${opSocketId}`);

    if (!opSocketId) {
      if (typeof ack === 'function') ack({ ok: false, error: 'WAIT_FOR_OPPONENT' });
      return;
    }

    if (accept === undefined) {
      if (opUid) {
        logger.info(`[room:swap] Broadcasting to user:${opUid} and room:${rid}`);
        io.to('user:' + opUid).emit('game:swap:request', { roomId: rid, side });
        io.to(rid).emit('game:swap:request', { roomId: rid, side }); // redundant for safety
      }
      if (typeof ack === 'function') ack({ ok: true });
    } else if (accept === true) {
      const opUid = state.playerUids[opSide];

      state.players[side] = opSocketId;
      state.players[opSide] = socket.id;

      state.playerUids[side] = opUid;
      state.playerUids[opSide] = myUid;

      const myName = state.playerNames?.[side];
      const opName = state.playerNames?.[opSide];
      if (state.playerNames) {
        state.playerNames[side] = opName;
        state.playerNames[opSide] = myName;
      }

      socket.data.side = opSide;
      const opSocket = io.sockets.sockets.get(opSocketId);
      if (opSocket) opSocket.data.side = side;

      if (state.clock) {
        const rRed = state.clock.remainingMs.red;
        const rBlack = state.clock.remainingMs.black;
        state.clock.remainingMs.red = rBlack;
        state.clock.remainingMs.black = rRed;
      }

      state.updatedAt = Date.now();
      await saveRoom(roomId, state, { playerUids: state.playerUids, playerNames: state.playerNames, clock: state.clock });
      
      io.to(roomId).emit('room:players', {
        roomId,
        players: { red: true, black: true },
        playerUids: state.playerUids,
        playerNames: state.playerNames,
        spectators: Array.from(state.spectators.values()),
        started: state.started,
        finished: state.finished,
        winner: state.winner,
        endedBy: state.endedBy,
      });
      broadcastRoomUpdate(io, roomId);
      
      io.to(roomId).emit('game:swap:success', { roomId, side, opSide });

      if (typeof ack === 'function') ack({ ok: true });
    } else {
      io.to(roomId).emit('game:swap:declined', { roomId, side });
      if (typeof ack === 'function') ack({ ok: true });
    }
  });

  socket.on('entity:join', async ({ type, id } = {}, ack) => {
    try {
      if (!type || !id) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_PARAMS' });
        return;
      }
      const room = `comments:${type}:${id}`;
      socket.join(room);
      logger.debug(`[Socket] User joined entity room: ${room}`);
      if (typeof ack === 'function') ack({ ok: true });
    } catch (e) {
      logger.error('[ROOM_HANDLERS] entity:join exception:', e.message);
      if (typeof ack === 'function') ack({ ok: false, error: 'JOIN_FAILED' });
    }
  });

  socket.on('entity:leave', async ({ type, id } = {}, ack) => {
    try {
      if (type && id) {
        const room = `comments:${type}:${id}`;
        socket.leave(room);
      }
      if (typeof ack === 'function') ack({ ok: true });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false });
    }
  });
}

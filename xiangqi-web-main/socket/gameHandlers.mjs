import { loadRoom, saveRoom, rooms, makeRoomId } from '../services/roomManager.mjs';
import { logger } from '../logger.mjs';
import { checkTimeout, applyClockSpend, startTurnClock, hasAnyLegalMove, getCurrentClock, createInitialState } from '../services/gameState.mjs';
import { broadcastRoomUpdate } from './utils.mjs';
import { applyMoveToBoardInPlace, isLegalMove, isInCheck } from '../moveLogic.mjs';
import { scoreGameIfNeeded } from '../scoring.mjs';
import { getMovesCol } from '../mongo.mjs';
import { broadcastActivityChange, playingRoomByUid } from './presence.mjs';
import { boardToFen } from '../fen.mjs';
import { isInsufficientMaterial, detectForbiddenRepetition, countRepetitions } from '../utils/drawRules.mjs';
import { invalidateImageCache } from '../utils/cache.mjs';

function clearPlayersActivity(state) {
  const uids = [state?.playerUids?.red, state?.playerUids?.black].filter(Boolean);
  for (const u of uids) playingRoomByUid.delete(String(u));
  broadcastActivityChange(uids, 'idle');
}

export function registerGameHandlers(io, socket) {
  socket.on('game:move', async ({ roomId: rawRoomId, move, clientMoveIndex, lastServerMoveIndex } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    if (!roomId) {
      if (typeof ack === 'function') ack({ ok: false, error: 'BAD_ROOM_ID' });
      return;
    }
    const state = await loadRoom(roomId);
    if (!state) {
      logger.warn(`[game:move] ROOM_NOT_FOUND (roomId: ${roomId})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }
    if (state.finished) {
      logger.warn(`[game:move] GAME_FINISHED (roomId: ${roomId})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'GAME_FINISHED' });
      return;
    }

    logger.debug(`[game:move DEBUG] roomId=${roomId} started=${state.started} serverMoveIndex=${state.serverMoveIndex} pUids=${JSON.stringify(state.playerUids)}`);

    if (!state.started) {
      if (state.serverMoveIndex === 0) {
        logger.debug(`[game:move DEBUG] entering auto-start path (roomId=${roomId})`);
        const hasBoth = state.playerUids?.red && state.playerUids?.black;
        logger.debug(`[game:move DEBUG] hasBoth=${!!hasBoth} pUids=${JSON.stringify(state.playerUids)}`);
        if (!hasBoth) {
          if (typeof ack === 'function') ack({ ok: false, error: 'WAIT_FOR_OPPONENT' });
          return;
        }
      } else {
        logger.debug(`[game:move DEBUG] entering non-zero skip path (roomId=${roomId}, serverMoveIndex=${state.serverMoveIndex})`);
        // If serverMoveIndex > 0 but started is false, we should technically be started.
        // This handles potential race conditions or manual state fixes.
        state.started = true;
      }
    }

    const side = socket.data.side;
    if (!side) {
      logger.warn(`[game:move] NOT_IN_ROOM (roomId: ${roomId}, socket: ${socket.id})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_IN_ROOM' });
      return;
    }

    const now = Date.now();
    // timeout check (server-authoritative)
    const t = checkTimeout(state, now);
    if (t) {
      state.finished = true;
      state.started = false;
      state.endedBy = 'timeout';
      state.winner = t.loser === 'red' ? 'black' : 'red';
      state.updatedAt = now;
      await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
      io.to(roomId).emit('game:over', { roomId, finished: true, winner: state.winner, endedBy: state.endedBy });
      broadcastRoomUpdate(io, roomId);
      scoreGameIfNeeded(roomId).catch((e) => logger.error('scoreGameIfNeeded failed', e));
      logger.warn(`[game:move] TIMEOUT (roomId: ${roomId}, loser: ${t.loser})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'TIMEOUT' });
      return;
    }

    // sequencing / conflict check
    if (typeof lastServerMoveIndex === 'number' && lastServerMoveIndex !== state.serverMoveIndex) {
      logger.warn(`[game:move] OUT_OF_SYNC (roomId: ${roomId}, client: ${lastServerMoveIndex}, server: ${state.serverMoveIndex})`);
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'OUT_OF_SYNC', serverMoveIndex: state.serverMoveIndex });
      }
      return;
    }

    // turn enforcement
    if (side !== state.currentPlayer) {
      logger.warn(`[game:move] NOT_YOUR_TURN (roomId: ${roomId}, side: ${side}, expected: ${state.currentPlayer})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_YOUR_TURN' });
      return;
    }

    // payload validation
    if (!move || !move.from || !move.to) {
      logger.warn(`[game:move] BAD_MOVE payload (roomId: ${roomId}, move: ${JSON.stringify(move)})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'BAD_MOVE' });
      return;
    }

    // Coordinate validation (XSS / Out of bounds prevention)
    const { from, to } = move;
    const isValidCoord = (c) => typeof c?.row === 'number' && typeof c?.col === 'number' &&
                                 c.row >= 0 && c.row <= 9 && c.col >= 0 && c.col <= 8;

    if (!isValidCoord(from) || !isValidCoord(to)) {
      logger.warn(`[game:move] INVALID_COORDINATES (roomId: ${roomId}, from: ${JSON.stringify(from)}, to: ${JSON.stringify(to)})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_COORDINATES' });
      return;
    }

    const piece = state.board?.[from.row]?.[from.col] ?? null;
    if (!piece) {
      logger.warn(`[game:move] NO_PIECE at from: ${JSON.stringify(from)} (roomId: ${roomId})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'NO_PIECE' });
      return;
    }
    if (piece.side !== side) {
      logger.warn(`[game:move] NOT_YOUR_PIECE (roomId: ${roomId}, pieceSide: ${piece.side}, mySide: ${side})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_YOUR_PIECE' });
      return;
    }

    if (!isLegalMove(piece, to, state.board)) {
      logger.warn(`[game:move] ILLEGAL_MOVE logic rejected (roomId: ${roomId}, piece: ${piece.type}, from: ${JSON.stringify(from)}, to: ${JSON.stringify(to)})`);
      if (typeof ack === 'function') ack({ ok: false, error: 'ILLEGAL_MOVE' });
      return;
    }

    // Apply server-authoritative move
    const applied = applyMoveToBoardInPlace(state.board, from, to);
    if (!applied.ok) {
      logger.warn(`[game:move] ILLEGAL_MOVE apply fails (roomId: ${roomId}, error: ${applied.error})`);
      if (typeof ack === 'function') ack({ ok: false, error: applied.error || 'ILLEGAL_MOVE' });
      return;
    }
    state.board = applied.nextBoard;

    const sanitizedMove = {
      from,
      to,
      piece: applied.movedPiece,
      capturedPiece: applied.capturedPiece ?? undefined,
    };

    const nextSide = state.currentPlayer; 
    const inCheck = isInCheck(nextSide, state.board);
    
    // Detect Chase: attacking any opponent piece except General/Soldier-uncrossed
    let inChase = false;
    const attacker = side;
    const movedPiece = state.board[to.row][to.col];
    
    // Check all opponent pieces
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = state.board[r][c];
        if (!p || p.side === attacker) continue;
        if (p.type === 'general') continue; // That's a check, not a chase rule
        if (p.type === 'soldier') {
           // Not crossed river
           const crossed = p.side === 'red' ? p.position.row <= 4 : p.position.row >= 5;
           if (!crossed) continue;
        }
        
        // If our moved piece attacks this piece, it's a chase
        if (isValidMove(movedPiece.type, to, p.position, attacker, state.board)) {
          inChase = true;
          break;
        }
      }
      if (inChase) break;
    }

    state.serverMoveIndex += 1;
    state.moveHistory.push({ 
      ...sanitizedMove, 
      side, 
      clientMoveIndex: clientMoveIndex ?? null,
      isCheck: inCheck,
      isChase: inChase
    });

    // Update FEN history and half-move clock (120 half-moves = 60 full moves rule)
    if (sanitizedMove.capturedPiece) {
      state.halfMoveClock = 0; // Only captures reset the 60-move counter in Xiangqi.
    } else {
      state.halfMoveClock = (state.halfMoveClock || 0) + 1;
    }
    
    // Switch turn before calculating FEN to get the correct "side to move"
    state.currentPlayer = state.currentPlayer === 'red' ? 'black' : 'red';
    
    const currentFen = boardToFen(state.board, state.currentPlayer);
    state.positionHistory = (state.positionHistory || []).concat(currentFen);
    
    startTurnClock(state, state.currentPlayer);

    if (!state.started && state.serverMoveIndex === 1) {
      state.started = true;
      state.finished = false;
      state.winner = null;
      state.endedBy = null;
      logger.info(`[game:move] Auto-starting match in room ${roomId} (first move made)`);
      
      if (state.playerUids) {
        const uids = [state.playerUids.red, state.playerUids.black].filter(Boolean);
        broadcastActivityChange(uids, 'playing');
      }
    }

    state.updatedAt = now;
    await saveRoom(roomId, state, { status: state.started ? 'started' : 'open', clock: state.clock });

    // Persist move event (append-only)
    try {
      const moves = await getMovesCol();
      await moves.updateOne(
        { gameId: roomId, ply: state.serverMoveIndex },
        {
          $setOnInsert: {
            gameId: roomId,
            ply: state.serverMoveIndex,
            side,
            move: sanitizedMove,
            fen: currentFen,
            ts: now,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      logger.error('save move failed', e);
    }

    invalidateImageCache(`game-${roomId}`);

    io.to(roomId).emit('game:move', {
      roomId,
      move: sanitizedMove,
      side,
      serverMoveIndex: state.serverMoveIndex,
      currentPlayer: state.currentPlayer,
      started: state.started,
      clock: getCurrentClock(state),
      serverTime: now,
    });

    // Server-side game over detection
    const any = hasAnyLegalMove(nextSide, state.board);
    
    // Draw Detection
    const moveLimit60 = state.halfMoveClock >= 120;
    const isRepetition = countRepetitions(state.positionHistory).count >= 3;
    const isInsufficient = isInsufficientMaterial(state.board);
    
    // Rule: Bot vs Bot automatically draw after 185 moves (Legacy, kept for bot infrastructure)
    const bothBots = state.playerIsBot?.red && state.playerIsBot?.black;
    const moveLimitReached = state.serverMoveIndex >= 185;

    if (!any || (bothBots && moveLimitReached) || moveLimit60 || isRepetition || isInsufficient) {
      const inCheck = isInCheck(nextSide, state.board);
      state.finished = true;
      state.started = false;

      if ((bothBots && moveLimitReached && any) || (moveLimit60 && any)) {
          state.winner = null;
          state.endedBy = 'draw';
          logger.info(`[game:move] Match in room ${roomId} ended as DRAW (60-move rule or bot limit)`);
      } else if (isRepetition && any) {
          // Check for forbidden repetition (Perpetual Check/Chase)
          const forbiddenSide = detectForbiddenRepetition(state);
          if (forbiddenSide) {
              state.winner = forbiddenSide === 'red' ? 'black' : 'red';
              state.endedBy = 'perpetual';
              logger.info(`[game:move] Match in room ${roomId} ended as LOSS for ${forbiddenSide} (Perpetual Rule)`);
          } else {
              state.winner = null;
              state.endedBy = 'draw';
              logger.info(`[game:move] Match in room ${roomId} ended as DRAW (Threefold Repetition)`);
          }
      } else if (isInsufficient && any) {
          state.winner = null;
          state.endedBy = 'draw';
          logger.info(`[game:move] Match in room ${roomId} ended as DRAW (Insufficient Material)`);
      } else {
        state.winner = nextSide === 'red' ? 'black' : 'red';
        state.endedBy = inCheck ? 'checkmate' : 'stalemate';
      }

      io.to(roomId).emit('game:over', {
        roomId,
        finished: true,
        winner: state.winner,
        endedBy: state.endedBy,
      });

      state.updatedAt = Date.now();
      await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
      scoreGameIfNeeded(roomId).catch((e) => logger.error('scoreGameIfNeeded failed', e));
      clearPlayersActivity(state);
    }

    broadcastRoomUpdate(io, roomId);

    if (typeof ack === 'function') ack({ ok: true, serverMoveIndex: state.serverMoveIndex, currentPlayer: state.currentPlayer });
  });

  socket.on('game:resign', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state || state.finished || !state.started) {
      if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' });
      return;
    }
    const side = socket.data.side;
    if (!side) {
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' });
      return;
    }

    // Defensive: don't allow resignation at 0 moves to avoid accidental win signals
    // Leave room should handle the reset if no moves are made.
    if (state.moveHistory?.length === 0) {
      if (typeof ack === 'function') ack({ ok: true });
      return;
    }

    state.finished = true;
    state.started = false;
    state.winner = side === 'red' ? 'black' : 'red';
    state.endedBy = 'resign';
    state.updatedAt = Date.now();

    await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
    io.to(roomId).emit('game:over', { roomId, finished: true, winner: state.winner, endedBy: state.endedBy });
    broadcastRoomUpdate(io, roomId);
    scoreGameIfNeeded(roomId).catch((e) => logger.error('scoreGameIfNeeded failed', e));
    clearPlayersActivity(state);
    invalidateImageCache(`game-${roomId}`);

    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:draw:request', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state || state.finished || !state.started) {
      if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' });
      return;
    }
    const side = socket.data.side;
    if (!side) {
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' });
      return;
    }
    // Forward the request to the other side
    io.to(roomId).emit('game:draw:request', { roomId, side });
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:draw:response', async ({ roomId: rawRoomId, accepted } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state || state.finished || !state.started) {
       if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' });
       return;
    }
    const side = socket.data.side;
    if (!side) {
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' });
      return;
    }

    if (accepted) {
      state.finished = true;
      state.started = false;
      state.winner = null;
      state.endedBy = 'draw';
      state.updatedAt = Date.now();

      await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
      io.to(roomId).emit('game:over', { roomId, finished: true, winner: null, endedBy: 'draw' });
      broadcastRoomUpdate(io, roomId);
      scoreGameIfNeeded(roomId).catch((e) => logger.error('scoreGameIfNeeded failed', e));
      clearPlayersActivity(state);
    } else {
      io.to(roomId).emit('game:draw:declined', { roomId, side });
    }

    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:rematch:request', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state || !state.finished) {
       if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' });
       return;
    }
    const side = socket.data.side;
    if (!side) {
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' });
      return;
    }
    io.to(roomId).emit('game:rematch:request', { roomId, side });
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:rematch:response', async ({ roomId: rawRoomId, accepted } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state || !state.finished) {
       if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_STATE' });
       return;
    }
    const side = socket.data.side;
    if (!side) {
      if (typeof ack === 'function') ack({ ok: false, error: 'NOT_A_PLAYER' });
      return;
    }

    if (accepted) {
      const newRoomId = makeRoomId();
      const nextState = createInitialState({ 
        timeMode: state.timeMode || 'standard',
        timeControl: state.timeControl,
        setupId: state.setupId
      });
      
      // Swap sides for rematch
      nextState.playerUids.red = state.playerUids.black;
      nextState.playerUids.black = state.playerUids.red;
      nextState.playerNames.red = state.playerNames.black;
      nextState.playerNames.black = state.playerNames.red;
      nextState.isPrivate = state.isPrivate;
      nextState.isRanked = state.isRanked;
      nextState.isFixed = state.isFixed;
      nextState.boardType = state.boardType;
      
      await saveRoom(newRoomId, nextState);
      rooms.set(newRoomId, nextState);
      
      io.to(roomId).emit('game:rematch:start', { roomId, newRoomId });
    } else {
      io.to(roomId).emit('game:rematch:declined', { roomId, side });
    }
    
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('game:sync', async ({ roomId: rawRoomId } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    const state = await loadRoom(roomId);
    if (!state) {
      if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }
    const payload = {
      ok: true,
      roomId,
      serverMoveIndex: state.serverMoveIndex,
      currentPlayer: state.currentPlayer,
      moveHistory: state.moveHistory,
      started: state.started,
      finished: state.finished,
      winner: state.winner,
      endedBy: state.endedBy,
      clock: getCurrentClock(state),
      serverTime: Date.now(),
      timeMode: state.timeMode,
      timeControl: state.timeControl,
      spectators: Array.from(state.spectators.values()),
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
    };
    if (typeof ack === 'function') ack(payload);
    else socket.emit('game:state', payload);
  });
}

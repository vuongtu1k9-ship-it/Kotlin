import { loadRoom, saveRoom } from '../../../services/roomManager.mjs';
import { logger } from '../../../logger.mjs';
import { checkTimeout, applyClockSpend, startTurnClock, hasAnyLegalMove, getCurrentClock } from '../../../services/gameState.mjs';
import { broadcastRoomUpdate } from '../../utils.mjs';
import { applyMoveToBoardInPlace, isLegalMove, isInCheck, isValidMove } from '../../../moveLogic.mjs';
import { scoreGameIfNeeded } from '../../../scoring.mjs';
import { getMovesCol } from '../../../mongo.mjs';
import { broadcastActivityChange, playingRoomByUid } from '../../presence.mjs';
import { boardToFen } from '../../../fen.mjs';
import { isInsufficientMaterial, detectForbiddenRepetition, countRepetitions } from '../../../utils/drawRules.mjs';
import { invalidateImageCache } from '../../../utils/cache.mjs';

function clearPlayersActivity(state) {
  const uids = [state?.playerUids?.red, state?.playerUids?.black].filter(Boolean);
  for (const u of uids) playingRoomByUid.delete(String(u));
  broadcastActivityChange(uids, 'idle');
}

export function registerMoveHandler(io, socket) {
  socket.on('game:move', async ({ roomId: rawRoomId, move, clientMoveIndex, lastServerMoveIndex } = {}, ack) => {
    const roomId = String(rawRoomId || '').toLowerCase();
    if (!roomId) { if (typeof ack === 'function') ack({ ok: false, error: 'BAD_ROOM_ID' }); return; }
    const state = await loadRoom(roomId);
    if (!state) { if (typeof ack === 'function') ack({ ok: false, error: 'ROOM_NOT_FOUND' }); return; }
    if (state.finished) { if (typeof ack === 'function') ack({ ok: false, error: 'GAME_FINISHED' }); return; }

    if (!state.started) {
      if (state.serverMoveIndex === 0) {
        if (!(state.playerUids?.red && state.playerUids?.black)) {
          if (typeof ack === 'function') ack({ ok: false, error: 'WAIT_FOR_OPPONENT' }); return;
        }
      } else { state.started = true; }
    }

    const side = socket.data.side;
    if (!side) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_IN_ROOM' }); return; }

    const now = Date.now();
    const t = checkTimeout(state, now);
    if (t) {
      state.finished = true; state.started = false; state.endedBy = 'timeout'; state.winner = t.loser === 'red' ? 'black' : 'red'; state.updatedAt = now;
      await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
      io.to(roomId).emit('game:over', { roomId, finished: true, winner: state.winner, endedBy: state.endedBy });
      broadcastRoomUpdate(io, roomId); scoreGameIfNeeded(roomId).catch(() => {});
      if (typeof ack === 'function') ack({ ok: false, error: 'TIMEOUT' }); return;
    }

    if (typeof lastServerMoveIndex === 'number' && lastServerMoveIndex !== state.serverMoveIndex) {
      if (typeof ack === 'function') ack({ ok: false, error: 'OUT_OF_SYNC', serverMoveIndex: state.serverMoveIndex }); return;
    }
    if (side !== state.currentPlayer) { if (typeof ack === 'function') ack({ ok: false, error: 'NOT_YOUR_TURN' }); return; }
    if (!move || !move.from || !move.to) { if (typeof ack === 'function') ack({ ok: false, error: 'BAD_MOVE' }); return; }

    const { from, to } = move;
    const isValidCoord = (c) => typeof c?.row === 'number' && typeof c?.col === 'number' && c.row >= 0 && c.row <= 9 && c.col >= 0 && c.col <= 8;
    if (!isValidCoord(from) || !isValidCoord(to)) { if (typeof ack === 'function') ack({ ok: false, error: 'INVALID_COORDINATES' }); return; }

    const piece = state.board?.[from.row]?.[from.col] ?? null;
    if (!piece || piece.side !== side) { if (typeof ack === 'function') ack({ ok: false, error: 'ILLEGAL_MOVE' }); return; }
    if (!isLegalMove(piece, to, state.board)) { if (typeof ack === 'function') ack({ ok: false, error: 'ILLEGAL_MOVE' }); return; }

    const applied = applyMoveToBoardInPlace(state.board, from, to);
    if (!applied.ok) { if (typeof ack === 'function') ack({ ok: false, error: applied.error || 'ILLEGAL_MOVE' }); return; }
    state.board = applied.nextBoard;

    const sanitizedMove = { from, to, piece: applied.movedPiece, capturedPiece: applied.capturedPiece ?? undefined };
    const nextSide = state.currentPlayer; const inCheck = isInCheck(nextSide, state.board);
    
    let inChase = false; const attractor = side; const movedPiece = state.board[to.row][to.col];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = state.board[r][c]; if (!p || p.side === attractor || p.type === 'general') continue;
        if (p.type === 'soldier' && !(p.side === 'red' ? p.position.row <= 4 : p.position.row >= 5)) continue;
        if (isValidMove(movedPiece.type, to, p.position, attractor, state.board)) { inChase = true; break; }
      }
      if (inChase) break;
    }

    state.serverMoveIndex += 1;
    state.moveHistory.push({ ...sanitizedMove, side, clientMoveIndex: clientMoveIndex ?? null, isCheck: inCheck, isChase: inChase });
    state.halfMoveClock = sanitizedMove.capturedPiece ? 0 : (state.halfMoveClock || 0) + 1;
    
    applyClockSpend(state, side, now);
    state.currentPlayer = state.currentPlayer === 'red' ? 'black' : 'red';
    const currentFen = boardToFen(state.board, state.currentPlayer);
    state.positionHistory = (state.positionHistory || []).concat(currentFen);
    startTurnClock(state, state.currentPlayer);

    if (!state.started && state.serverMoveIndex === 1) {
      state.started = true; state.finished = false; state.winner = null; state.endedBy = null;
      if (state.playerUids) broadcastActivityChange([state.playerUids.red, state.playerUids.black].filter(Boolean), 'playing');
    }

    state.updatedAt = now;
    await saveRoom(roomId, state, { status: state.started ? 'started' : 'open', clock: state.clock });
    try {
      const moves = await getMovesCol();
      await moves.updateOne({ gameId: roomId, ply: state.serverMoveIndex }, { $setOnInsert: { gameId: roomId, ply: state.serverMoveIndex, side, move: sanitizedMove, fen: currentFen, ts: now } }, { upsert: true });
    } catch (e) { logger.error('[MOVE_HANDLER] save move failed:', e); }

    invalidateImageCache(`game-${roomId}`);
    io.to(roomId).emit('game:move', { roomId, move: sanitizedMove, side, serverMoveIndex: state.serverMoveIndex, currentPlayer: state.currentPlayer, started: state.started, clock: getCurrentClock(state), serverTime: now });

    const any = hasAnyLegalMove(nextSide, state.board);
    const moveLimit60 = state.halfMoveClock >= 120;
    const isRepetition = countRepetitions(state.positionHistory).count >= 3;
    const isInsufficient = isInsufficientMaterial(state.board);
    const bothBots = state.playerIsBot?.red && state.playerIsBot?.black;
    const moveLimitReached = state.serverMoveIndex >= 185;

    if (!any || (bothBots && moveLimitReached) || moveLimit60 || isRepetition || isInsufficient) {
      state.finished = true; state.started = false; let drawReason = '';
      if ((bothBots && moveLimitReached && any) || (moveLimit60 && any)) {
          state.winner = null; state.endedBy = 'draw'; drawReason = moveLimit60 ? 'Luật 60 nước đi' : 'Giới hạn Bot';
      } else if (isRepetition && any) {
          const forbiddenSide = detectForbiddenRepetition(state);
          if (forbiddenSide) { state.winner = forbiddenSide === 'red' ? 'black' : 'red'; state.endedBy = 'perpetual'; drawReason = `Vi phạm luật Chiếu dai/Đuổi dai`; }
          else { state.winner = null; state.endedBy = 'draw'; drawReason = 'Lặp lại 3 lần'; }
      } else if (isInsufficient && any) { state.winner = null; state.endedBy = 'draw'; drawReason = 'Hết quân tấn công'; }
      else { state.winner = nextSide === 'red' ? 'black' : 'red'; state.endedBy = isInCheck(nextSide, state.board) ? 'checkmate' : 'stalemate'; }

      io.to(roomId).emit('game:over', { roomId, finished: true, winner: state.winner, endedBy: state.endedBy, reason: drawReason });
      state.updatedAt = Date.now();
      await saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
      scoreGameIfNeeded(roomId).catch(() => {}); clearPlayersActivity(state);
    }
    broadcastRoomUpdate(io, roomId);
    if (typeof ack === 'function') ack({ ok: true, serverMoveIndex: state.serverMoveIndex, currentPlayer: state.currentPlayer });
  });
}

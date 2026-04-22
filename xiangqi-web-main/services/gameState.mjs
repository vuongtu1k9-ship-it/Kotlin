import { createInitialBoard, isLegalMove } from '../moveLogic.mjs';
import { logger } from '../logger.mjs';

export function createInitialState({ timeMode = 'standard', timeControl, board, setupId, tournamentId, playerUids, playerNames } = {}) {
  if (board) logger.log(`[gameState] createInitialState with CUSTOM board (setupId=${setupId})`);
  else logger.log(`[gameState] createInitialState with STANDARD board`);
  
  const now = Date.now();
  const tc =
    timeControl ||
    (timeMode === 'blitz'
      ? { totalMs: 5 * 60_000, perMoveMs: 30_000 }
      : timeMode === 'rapid'
        ? { totalMs: 15 * 60_000, perMoveMs: 60_000 }
        : timeMode === 'slow'
          ? { totalMs: 60 * 60_000, perMoveMs: 5 * 60_000 }
          : { totalMs: 30 * 60_000, perMoveMs: 3 * 60_000 }); // standard

  return {
    serverMoveIndex: 0,
    currentPlayer: 'red',
    board: board || createInitialBoard(),
    setupId: setupId || null,
    tournamentId: tournamentId || null,
    moveHistory: [],
    positionHistory: [], // [fen1, fen2, ...]
    halfMoveClock: 0, // consecutive non-capture moves (half-moves)

    // gameplay
    started: false,
    finished: false,
    winner: null, // 'red' | 'black' | null
    endedBy: null, // 'checkmate' | 'stalemate' | 'timeout' | null


    // time control
    timeMode,
    timeControl: tc,
    clock: {
      remainingMs: { red: tc.totalMs, black: tc.totalMs },
      turnSide: null,
      turnStartedAt: null,
      perMoveDeadlineAt: null,
    },

    // occupancy (ephemeral)
    players: { red: null, black: null },
    playerUids: playerUids || { red: null, black: null },
    playerNames: playerNames || { red: null, black: null },
    playerIsBot: { red: false, black: false },
    spectators: new Map(),

    createdAt: now,
    updatedAt: now,
  };
}

export function startTurnClock(state, side) {
  if (!state.clock) return;

  // The clock only turns on after Red makes the very first move (length > 0)
  if (!state.moveHistory || state.moveHistory.length === 0) return;

  const now = Date.now();
  state.clock.turnSide = side;
  state.clock.turnStartedAt = now;
  const perMoveMs = state.timeControl?.perMoveMs ?? 3 * 60_000;
  const remaining = state.clock.remainingMs?.[side] ?? 0;
  const deadlineIn = Math.max(0, Math.min(perMoveMs, remaining));
  state.clock.perMoveDeadlineAt = now + deadlineIn;
}

export function applyClockSpend(state, side, now) {
  if (!state.clock?.turnStartedAt) return;
  const elapsed = Math.max(0, now - state.clock.turnStartedAt);
  const prev = state.clock.remainingMs?.[side] ?? 0;
  state.clock.remainingMs[side] = Math.max(0, prev - elapsed);
}

export function checkTimeout(state, now) {
  if (!state.started || state.finished) return null;
  const side = state.clock?.turnSide;
  if (!side) return null;

  // Players do not lose by timeout on their very first move.
  // Their time still ticks down (and will affect subsequent moves), but the game won't end.
  if (state.moveHistory) {
    if (side === 'red' && state.moveHistory.length === 0) return null;
  }

  const remaining = state.clock?.remainingMs?.[side] ?? 0;
  const perMoveDeadlineAt = state.clock?.perMoveDeadlineAt ?? null;
  if (remaining <= 0) return { loser: side, reason: 'total' };
  if (perMoveDeadlineAt && now > perMoveDeadlineAt) return { loser: side, reason: 'perMove' };
  return null;
}

/**
 * Returns a copy of the clock with remainingMs dynamically adjusted for the active turn.
 */
export function getCurrentClock(state) {
  if (!state.clock) return null;
  const now = Date.now();
  const clock = {
    ...state.clock,
    remainingMs: { ...state.clock.remainingMs }
  };
  if (state.started && !state.finished && clock.turnSide && clock.turnStartedAt) {
    const elapsed = Math.max(0, now - clock.turnStartedAt);
    clock.remainingMs[clock.turnSide] = Math.max(0, clock.remainingMs[clock.turnSide] - elapsed);
  }
  return clock;
}

export function hasAnyLegalMove(side, board) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board?.[r]?.[c] ?? null;
      if (!p || p.side !== side) continue;
      for (let rr = 0; rr < 10; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (isLegalMove(p, { row: rr, col: cc }, board)) return true;
        }
      }
    }
  }
  return false;
}

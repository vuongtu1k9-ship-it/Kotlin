// engine.ts - Upgraded Xiangqi AI Engine (Strength-Focused)

import type { Move, Piece, PieceSide, PieceType, Position } from '../types';
import { isInCheck, isLegalMove } from '../utils/moveLogic';
import { logger } from '../utils/logger';
import { getPiecePositionalBonus } from './pst';

export type AiLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type AiConfig = {
  enabled: boolean;
  side: PieceSide;
  level: AiLevel;
  botId?: string;
  engine?: 'web' | 'pikafish';
};

// ─── Constants ───────────────────────────────────────────────────────────────

const INF = 999_999;
const MATE_SCORE = 900_000;

const pieceValue: Record<PieceType, number> = {
  general: 10_000,
  advisor: 120,
  elephant: 120,
  horse: 320,
  chariot: 650,
  cannon: 360,
  soldier: 100,
};

// Mobility weight per piece type (points per legal move available)
const MOBILITY_WEIGHT: Partial<Record<PieceType, number>> = {
  chariot: 3,
  cannon: 2,
  horse: 5,
  soldier: 1,
};

// ─── Zobrist Hashing ─────────────────────────────────────────────────────────

const PIECE_TYPES: PieceType[] = ['general', 'advisor', 'elephant', 'horse', 'chariot', 'cannon', 'soldier'];
const SIDES: PieceSide[] = ['red', 'black'];

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = Math.imul(1_664_525, s) + 1_013_904_223; return (s >>> 0) / 0x1_0000_0000; };
}

const _rng = lcg(0xdeadbeef);
const zobristTable: Record<string, number> = {};

for (const side of SIDES) {
  for (const type of PIECE_TYPES) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        zobristTable[`${type}_${side}_${r}_${c}`] =
          ((_rng() * 0xffff) | 0) ^ (((_rng() * 0xffff) | 0) << 16);
      }
    }
  }
}
const ZOBRIST_BLACK_SIDE = (_rng() * 0xffff_ffff) >>> 0;

function computeZobrist(board: (Piece | null)[][], sideToMove: PieceSide): number {
  let h = sideToMove === 'black' ? ZOBRIST_BLACK_SIDE : 0;
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      const p = board[r]?.[c];
      if (p) h ^= zobristTable[`${p.type}_${p.side}_${r}_${c}`] ?? 0;
    }
  return h;
}

// ─── Transposition Table ─────────────────────────────────────────────────────

const enum TTFlag { EXACT, LOWER, UPPER }

type TTEntry = { hash: number; depth: number; score: number; flag: TTFlag; best?: Move };

const TT_SIZE = 1 << 21; // 2M slots
const tt: (TTEntry | undefined)[] = new Array(TT_SIZE);
const ttIdx = (h: number) => (h >>> 0) % TT_SIZE;

function ttProbe(hash: number, depth: number, alpha: number, beta: number)
  : { hit: true; score: number; best?: Move } | { hit: false; best?: Move } {
  const e = tt[ttIdx(hash)];
  if (!e || e.hash !== hash) return { hit: false };
  const best = e.best;
  if (e.depth < depth) return { hit: false, best };       // shallow — still use best move
  if (e.flag === TTFlag.EXACT) return { hit: true, score: e.score, best };
  if (e.flag === TTFlag.LOWER && e.score >= beta) return { hit: true, score: e.score, best };
  if (e.flag === TTFlag.UPPER && e.score <= alpha) return { hit: true, score: e.score, best };
  return { hit: false, best };
}

function ttStore(hash: number, depth: number, score: number, flag: TTFlag, best?: Move): void {
  const idx = ttIdx(hash);
  const e = tt[idx];
  if (!e || e.depth <= depth || e.hash !== hash) tt[idx] = { hash, depth, score, flag, best };
}

// ─── Killer Moves & History Heuristic ────────────────────────────────────────

const MAX_PLY = 32;
const killers: Array<[Move | undefined, Move | undefined]> =
  Array.from({ length: MAX_PLY }, () => [undefined, undefined]);

const historyTable: Record<PieceType, number[][]> = {} as any;
for (const t of PIECE_TYPES) historyTable[t] = Array.from({ length: 10 }, () => new Array(9).fill(0));

function storeKiller(ply: number, move: Move): void {
  if (ply >= MAX_PLY) return;
  const [k0] = killers[ply];
  if (!moveEq(k0, move)) killers[ply] = [move, k0];
}

function storeHistory(move: Move, depth: number): void {
  historyTable[move.piece.type][move.to.row][move.to.col] += depth * depth;
}

function moveEq(a: Move | undefined, b: Move | undefined): boolean {
  return !!(a && b &&
    a.from.row === b.from.row && a.from.col === b.from.col &&
    a.to.row === b.to.row && a.to.col === b.to.col);
}

function isKillerMove(move: Move, ply: number): boolean {
  if (ply >= MAX_PLY) return false;
  const [k0, k1] = killers[ply];
  return moveEq(k0, move) || moveEq(k1, move);
}

function resetSearchState(): void {
  for (let i = 0; i < MAX_PLY; i++) killers[i] = [undefined, undefined];
  for (const t of PIECE_TYPES) for (let r = 0; r < 10; r++) historyTable[t][r].fill(0);
}

// ─── Move Generation ─────────────────────────────────────────────────────────

export function generateLegalMoves(side: PieceSide, board: (Piece | null)[][]): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      const p = board[r]?.[c];
      if (!p || p.side !== side) continue;
      for (let rr = 0; rr < 10; rr++)
        for (let cc = 0; cc < 9; cc++) {
          const to: Position = { row: rr, col: cc };
          if (!isLegalMove(p, to, board)) continue;
          const cap = board[rr]?.[cc] ?? undefined;
          moves.push({ from: p.position, to, piece: p, capturedPiece: cap });
        }
    }
  return moves;
}

export function applyMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
  const next = board.map((r) => r.slice());
  const moving = next[move.from.row][move.from.col] ?? move.piece;
  next[move.from.row][move.from.col] = null;
  next[move.to.row][move.to.col] = { ...moving, position: { ...move.to }, hasMoved: true };
  return next;
}

// ─── Static Exchange Evaluation (SEE) ────────────────────────────────────────
// Determines if a capture sequence on a square is winning/losing.
// Returns estimated material gain (positive = good for attacker).

function see(board: (Piece | null)[][], move: Move): number {
  if (!move.capturedPiece) return 0;

  const gain: number[] = [];
  let capturedValue = pieceValue[move.capturedPiece.type];
  gain.push(capturedValue);

  // Simulate the capture and look for recaptures
  const sim = applyMove(board, move);
  const toR = move.to.row, toC = move.to.col;
  const opp = move.piece.side === 'red' ? 'black' : 'red';

  // Find smallest attacker of the square for the opponent
  let currentSide = opp;
  let depth = 1;
  const MAX_SEE_DEPTH = 10;

  while (depth < MAX_SEE_DEPTH) {
    let smallestValue = Infinity;
    let smallestAttacker: Move | null = null;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = sim[r]?.[c];
        if (!p || p.side !== currentSide) continue;
        if (isLegalMove(p, { row: toR, col: toC }, sim)) {
          const v = pieceValue[p.type];
          if (v < smallestValue) { smallestValue = v; smallestAttacker = { from: p.position, to: { row: toR, col: toC }, piece: p, capturedPiece: sim[toR]?.[toC] ?? undefined }; }
        }
      }
    }

    if (!smallestAttacker) break;

    capturedValue = pieceValue[smallestAttacker.piece.type];
    gain.push(capturedValue);
    depth++;
    currentSide = currentSide === 'red' ? 'black' : 'red';
  }

  // Minimax back through gain array
  for (let i = gain.length - 2; i >= 0; i--) {
    gain[i] = Math.max(-gain[i + 1], gain[i]);
  }
  return gain[0];
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

function countPieces(board: (Piece | null)[][]): number {
  let n = 0;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) if (board[r]?.[c]) n++;
  return n;
}

function evaluate(board: (Piece | null)[][], perspective: PieceSide): number {
  let score = 0;
  const totalPieces = countPieces(board);
  const isEndgame = totalPieces <= 10; // fewer pieces = endgame

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r]?.[c];
      if (!p) continue;

      const material = pieceValue[p.type];
      const pst = getPiecePositionalBonus(p.type, p.side, r, c);

      // Mobility
      let mob = 0;
      const mw = MOBILITY_WEIGHT[p.type];
      if (mw) {
        let mobCount = 0;
        for (let rr = 0; rr < 10; rr++)
          for (let cc = 0; cc < 9; cc++)
            if (isLegalMove(p, { row: rr, col: cc }, board)) mobCount++;
        mob = mobCount * mw;
      }

      // Soldier promotion: advanced soldiers are worth more
      let soldierBonus = 0;
      if (p.type === 'soldier') {
        const crossed = p.side === 'red' ? r < 5 : r >= 5;
        if (crossed) soldierBonus = isEndgame ? 60 : 30;
      }

      // Chariot on open file bonus
      let chariotBonus = 0;
      if (p.type === 'chariot') {
        let blockers = 0;
        for (let rr = 0; rr < 10; rr++) if (rr !== r && board[rr]?.[c]) blockers++;
        if (blockers === 0) chariotBonus = 30;
      }

      const v = material + pst + mob + soldierBonus + chariotBonus;
      score += p.side === perspective ? v : -v;
    }
  }

  // Check pressure
  const opp = perspective === 'red' ? 'black' : 'red';
  if (isInCheck(perspective, board)) score -= 150;
  if (isInCheck(opp, board)) score += 100;

  // Endgame: reward active general (closer to center of palace = better)
  if (isEndgame) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board[r]?.[c];
        if (p?.type === 'general') {
          const centerCol = 4;
          const colDist = Math.abs(c - centerCol);
          const generalCenterBonus = (2 - colDist) * 5;
          score += p.side === perspective ? generalCenterBonus : -generalCenterBonus;
        }
      }
    }
  }

  return score;
}

// ─── Move Ordering ────────────────────────────────────────────────────────────

function scoreMove(m: Move, ply: number, ttBest?: Move): number {
  // 1. TT best move
  if (moveEq(m, ttBest)) return 2_000_000;

  // 2. Winning/neutral captures via SEE (losing captures go near bottom)
  if (m.capturedPiece) {
    const seeVal = pieceValue[m.capturedPiece.type] - pieceValue[m.piece.type];
    // Full SEE only when potentially losing
    const gain = seeVal >= 0 ? seeVal : -1;
    return gain >= 0
      ? 1_000_000 + gain
      : 800_000 + gain; // losing captures still above quiet moves but below good captures
  }

  // 3. Killer moves
  if (isKillerMove(m, ply)) return 600_000;

  // 4. History + PST delta
  const histScore = historyTable[m.piece.type][m.to.row][m.to.col];
  const pstDelta = getPiecePositionalBonus(m.piece.type, m.piece.side, m.to.row, m.to.col)
    - getPiecePositionalBonus(m.piece.type, m.piece.side, m.from.row, m.from.col);
  return histScore + pstDelta * 2;
}

function orderMoves(moves: Move[], ply: number, ttBest?: Move): Move[] {
  return moves
    .map((m) => ({ m, s: scoreMove(m, ply, ttBest) }))
    .sort((a, b) => b.s - a.s)
    .map(({ m }) => m);
}

// ─── Quiescence Search ───────────────────────────────────────────────────────

function quiescence(
  board: (Piece | null)[][],
  sideToMove: PieceSide,
  alpha: number,
  beta: number,
  perspective: PieceSide,
  stopAt: number,
  ply: number
): number {
  if (Date.now() > stopAt) return evaluate(board, perspective);

  const standPat = evaluate(board, perspective);
  const maximizing = sideToMove === perspective;

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;
  }

  const moves = generateLegalMoves(sideToMove, board);

  // In quiescence: search captures + check evasions
  const inCheck = isInCheck(sideToMove, board);
  const qMoves = inCheck ? moves : moves.filter((m) => m.capturedPiece);
  if (qMoves.length === 0) return standPat;

  // SEE pruning: skip clearly losing captures in quiet positions
  const filtered = inCheck
    ? qMoves
    : qMoves.filter((m) => !m.capturedPiece || see(board, m) >= 0);

  const ordered = orderMoves(filtered, ply);
  const nextSide = sideToMove === 'red' ? 'black' : 'red';

  let best = standPat;
  for (const m of ordered) {
    if (Date.now() > stopAt) break;
    const next = applyMove(board, m);
    const v = quiescence(next, nextSide, alpha, beta, perspective, stopAt, ply + 1);
    if (maximizing) {
      if (v > best) best = v;
      if (v > alpha) alpha = v;
    } else {
      if (v < best) best = v;
      if (v < beta) beta = v;
    }
    if (beta <= alpha) break;
  }
  return best;
}

// ─── Minimax (PVS + NMP + LMR + Extensions) ──────────────────────────────────

const NULL_MOVE_R = 2;

function minimax(
  board: (Piece | null)[][],
  sideToMove: PieceSide,
  depth: number,
  alpha: number,
  beta: number,
  perspective: PieceSide,
  stopAt: number,
  ply: number,
  allowNull: boolean
): number {
  if (Date.now() > stopAt) return evaluate(board, perspective);

  // ── TT probe ────────────────────────────────────────────────────
  const hash = computeZobrist(board, sideToMove);
  const ttResult = ttProbe(hash, depth, alpha, beta);
  if (ttResult.hit) return ttResult.score;
  const ttBestMove = ttResult.best;

  // ── Terminal / horizon ───────────────────────────────────────────
  if (depth <= 0) {
    const q = quiescence(board, sideToMove, alpha, beta, perspective, stopAt, ply);
    ttStore(hash, 0, q, TTFlag.EXACT);
    return q;
  }

  const maximizing = sideToMove === perspective;
  const nextSide = sideToMove === 'red' ? 'black' : 'red';
  const inCheck = isInCheck(sideToMove, board);

  // ── Check Extension: don't reduce when in check ──────────────────
  const extension = inCheck ? 1 : 0;
  const searchDepth = depth + extension;

  // ── Null Move Pruning ────────────────────────────────────────────
  if (allowNull && searchDepth >= NULL_MOVE_R + 1 && maximizing && !inCheck) {
    const nullScore = minimax(
      board, nextSide, searchDepth - 1 - NULL_MOVE_R,
      beta - 1, beta, perspective, stopAt, ply + 1, false
    );
    if (nullScore >= beta) {
      ttStore(hash, searchDepth, beta, TTFlag.LOWER);
      return beta;
    }
  }

  const moves = generateLegalMoves(sideToMove, board);
  if (moves.length === 0) {
    // No moves: checkmate or stalemate — loss for side to move
    return sideToMove === perspective ? -(MATE_SCORE - ply) : (MATE_SCORE - ply);
  }

  const ordered = orderMoves(moves, ply, ttBestMove);
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove: Move | undefined;
  let flag: TTFlag = maximizing ? TTFlag.UPPER : TTFlag.LOWER;
  let movesSearched = 0;

  for (const m of ordered) {
    if (Date.now() > stopAt) break;

    const next = applyMove(board, m);
    const isCapture = !!m.capturedPiece;
    const givesCheck = isInCheck(nextSide, next);

    // ── LMR: reduce late quiet moves ────────────────────────────────
    const shouldReduce =
      searchDepth >= 3 &&
      movesSearched >= 4 &&
      !isCapture &&
      !isKillerMove(m, ply) &&
      !inCheck &&
      !givesCheck;

    const reduction = shouldReduce ? Math.max(1, Math.floor(Math.log(movesSearched) * 0.8)) : 0;
    const childDepth = searchDepth - 1 - reduction;

    // ── PVS ─────────────────────────────────────────────────────────
    let v: number;
    if (movesSearched === 0) {
      v = minimax(next, nextSide, searchDepth - 1, alpha, beta, perspective, stopAt, ply + 1, true);
    } else {
      // Null-window probe
      const [nAlpha, nBeta] = maximizing ? [alpha, alpha + 1] : [beta - 1, beta];
      v = minimax(next, nextSide, childDepth, nAlpha, nBeta, perspective, stopAt, ply + 1, true);

      // Re-search if failed or reduced
      const needsFull = maximizing
        ? (v > alpha && (v < beta || reduction > 0))
        : (v < beta && (v > alpha || reduction > 0));
      if (needsFull) {
        v = minimax(next, nextSide, searchDepth - 1, alpha, beta, perspective, stopAt, ply + 1, true);
      }
    }

    movesSearched++;

    if (maximizing) {
      if (v > bestScore) { bestScore = v; bestMove = m; }
      if (v > alpha) { alpha = v; flag = TTFlag.EXACT; }
      if (beta <= alpha) {
        if (!isCapture) { storeKiller(ply, m); storeHistory(m, searchDepth); }
        ttStore(hash, searchDepth, beta, TTFlag.LOWER, m);
        return beta;
      }
    } else {
      if (v < bestScore) { bestScore = v; bestMove = m; }
      if (v < beta) { beta = v; flag = TTFlag.EXACT; }
      if (beta <= alpha) {
        if (!isCapture) { storeKiller(ply, m); storeHistory(m, searchDepth); }
        ttStore(hash, searchDepth, alpha, TTFlag.UPPER, m);
        return alpha;
      }
    }
  }

  ttStore(hash, searchDepth, bestScore, flag, bestMove);
  return bestScore;
}

// ─── Level Config ─────────────────────────────────────────────────────────────

function getLevelParams(level: AiLevel): { kind: 'random' | 'heuristic' | 'minimax'; depth: number; timeMs: number } {
  switch (level) {
    case 1: return { kind: 'minimax', depth: 7, timeMs: 7500 };  // Previously level 9
    case 2: return { kind: 'minimax', depth: 9, timeMs: 12000 }; // Previously level 10
    // Levels 3-6 (Server engines)
    case 3: return { kind: 'minimax', depth: 2, timeMs: 3000 }; 
    case 4: return { kind: 'minimax', depth: 4, timeMs: 6000 };
    case 5: return { kind: 'minimax', depth: 6, timeMs: 9000 };
    case 6: return { kind: 'minimax', depth: 9, timeMs: 12000 };
  }
}

// ─── Heuristic (levels 2-3) ───────────────────────────────────────────────────

function scoreOnePly(move: Move, board: (Piece | null)[][], side: PieceSide): number {
  let s = 0;
  if (move.capturedPiece) s += pieceValue[move.capturedPiece.type] * 2 - pieceValue[move.piece.type] * 0.1;
  s += getPiecePositionalBonus(move.piece.type, side, move.to.row, move.to.col);
  const next = applyMove(board, move);
  const opp = side === 'red' ? 'black' : 'red';
  if (isInCheck(opp, next)) s += 120;
  if (isInCheck(side, next)) s -= 9999;
  return s;
}

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Root Search: Iterative Deepening + Aspiration Windows ───────────────────

import { makeMoveFromCoords, requestPikafishBestMove } from './pikafishApi';

export async function chooseAiMove(params: {
  board: (Piece | null)[][];
  side: PieceSide;
  level: AiLevel;
  botId?: string;
  engine?: 'web' | 'pikafish';
  history?: Move[];
  initialFen?: string;
}): Promise<Move | null> {
  const { board, side, level, botId, engine = 'web', history, initialFen } = params;
  const moves = generateLegalMoves(side, board);
  if (moves.length === 0) return null;

  // External engines
  if (engine === 'pikafish') {
    const movetimes: Record<number, number> = {
      1: 800, 2: 800,  // Fallbacks
      3: 800, 4: 1200, 5: 2000, 6: 3000
    };
    logger.info(`[AI] Engine: ${engine}, level=${level}, botId=${botId || 'none'}, history_len=${history?.length || 0}`);
    const uciHistory = history?.map(m => moveToUci(m));
    const best = await requestPikafishBestMove({
      board,
      side,
      movetimeMs: movetimes[level] ?? 5000,
      engine,
      botId,
      history: uciHistory,
      initialFen
    });
    if (!best.ok) {
      logger.warn(`[AI] Pikafish unavailable (${(best as any).error}), falling back to web engine`);
      // Fall through to web engine below
    } else {
      const mv = makeMoveFromCoords(board, best.from, best.to);
      if (mv) return mv;
      logger.warn('[AI] Invalid engine move, falling back to web engine');
    }
  }

  const cfg = getLevelParams(level);
  if (cfg.kind === 'random') return pickRandom(moves);

  if (cfg.kind === 'heuristic') {
    const scored = moves.map((m) => ({ move: m, score: scoreOnePly(m, board, side) }));
    scored.sort((a, b) => b.score - a.score);
    const topK = level === 2 ? Math.min(8, scored.length) : Math.min(3, scored.length);
    return pickRandom(scored.slice(0, topK)).move;
  }

  // ── Iterative Deepening + Aspiration Windows ──────────────────────
  resetSearchState();

  const stopAt = Date.now() + cfg.timeMs;
  let bestMove: Move = orderMoves(moves, 0)[0];
  let prevScore: number = -Infinity;
  const DELTA = 40; // initial aspiration window half-width

  for (let d = 1; d <= cfg.depth; d++) {
    if (Date.now() > stopAt) break;

    // Aspiration window — skip for shallow depths
    let lo = d >= 4 && prevScore > -INF ? prevScore - DELTA : -Infinity;
    let hi = d >= 4 && prevScore > -INF ? prevScore + DELTA : Infinity;

    let iterBest = bestMove;
    let iterScore = -Infinity;

    for (let attempt = 0; attempt < 5; attempt++) {
      iterScore = -Infinity;
      iterBest = bestMove;

      const ttEntry = tt[ttIdx(computeZobrist(board, side))];
      const rootOrdered = orderMoves(moves, 0, ttEntry?.best);
      let localAlpha = lo;

      for (const m of rootOrdered) {
        if (Date.now() > stopAt) break;
        const next = applyMove(board, m);
        const v = minimax(next, side === 'red' ? 'black' : 'red', d - 1, localAlpha, hi, side, stopAt, 1, true);
        if (v > iterScore) { iterScore = v; iterBest = m; }
        if (v > localAlpha) localAlpha = v;
      }

      if (iterScore <= lo) lo = Math.max(lo - DELTA * (attempt + 2), -Infinity);
      else if (iterScore >= hi) hi = Math.min(hi + DELTA * (attempt + 2), Infinity);
      else break;
      if (Date.now() > stopAt) break;
    }

    bestMove = iterBest;
    prevScore = iterScore;

    logger.debug(`[AI] depth=${d} score=${iterScore} move=${JSON.stringify(bestMove.to)}`);
    await new Promise((r) => setTimeout(r, 0));
  }

  return bestMove;
}

function moveToUci(m: Move): string {
  const colNames = 'abcdefghi';
  const from = `${colNames[m.from.col]}${9 - m.from.row}`;
  const to = `${colNames[m.to.col]}${9 - m.to.row}`;
  return `${from}${to}`;
}

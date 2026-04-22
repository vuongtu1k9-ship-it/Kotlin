import { Piece } from '../types';
import { createEmptyBoard } from '../state/initialBoard';

/**
 * Converts legacy position format ['rking:94', 'bchariot:00', ...]
 * to a 10x9 2D board (Piece | null)[][]
 */
export function legacyPositionToBoard(pos: string[]): (Piece | null)[][] {
  const b = createEmptyBoard();
  for (const item of pos || []) {
    const [rawKey, rawCoord] = String(item).split(':');
    if (!rawKey || rawCoord == null) continue;
    
    const side = rawKey.startsWith('r') ? 'red' : 'black';
    const typeKey = rawKey.replace(/^r|^b/, '').toLowerCase();
    
    const map: Record<string, any> = {
      king: 'general',
      general: 'general',
      advisor: 'advisor',
      elephant: 'elephant',
      horse: 'horse',
      chariot: 'chariot',
      cannon: 'cannon',
      pawn: 'soldier',
      soldier: 'soldier',
    };
    
    const type = map[typeKey];
    if (!type) continue;
    
    const s = String(rawCoord).padStart(2, '0');
    const row = Number(s[0]);
    const col = Number(s[1]);
    
    if (!Number.isFinite(row) || !Number.isFinite(col)) continue;
    if (row < 0 || row > 9 || col < 0 || col > 8) continue;
    
    const id = `${side}-${type}-${row}${col}`;
    b[row][col] = { 
        id, 
        side, 
        type, 
        position: { row, col }, 
        hasMoved: true 
    } as Piece;
  }
  return b;
}

export const PIECE_VALUES: Record<string, number> = {
  general: 0,
  chariot: 9,
  cannon: 4.5,
  horse: 4,
  elephant: 2,
  advisor: 2,
  soldier: 1,
};

/**
 * Calculates the material balance from the current board.
 * Returns positive if red is leading, negative if black is leading.
 */
export function getMaterialBalance(board: (Piece | null)[][]): number {
  let balance = 0;
  if (!board) return 0;
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const val = PIECE_VALUES[p.type] || 0;
      balance += p.side === 'red' ? val : -val;
    }
  }
  return balance;
}

/**
 * Calculates the half-move clock (moves since last capture).
 */
export function getHalfMoveClock(history: any[]): number {
  if (!history) return 0;
  let clock = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const move = history[i];
    // Move structure can vary between Move, ReplayMove and GameMoveBroadcast
    const captured = move.capturedPiece || move.move?.capturedPiece;
    if (captured) break;
    clock++;
  }
  return clock;
}

/**
 * Parses a UCI string (e.g., 'a9b9') into from/to coordinates.
 */
export function parseUCI(uci: string) {
  const match = uci.match(/^([a-i])(\d+)([a-i])(\d+)$/);
  if (!match) return null;
  const [, f1, r1, f2, r2] = match;
  return {
    from: { row: 9 - parseInt(r1, 10), col: f1.charCodeAt(0) - 'a'.charCodeAt(0) },
    to: { row: 9 - parseInt(r2, 10), col: f2.charCodeAt(0) - 'a'.charCodeAt(0) }
  };
}

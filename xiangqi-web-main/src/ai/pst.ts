import type { PieceType, PieceSide } from '../types';

/**
 * Basic Piece Square Tables (PST) for Xiangqi
 * These arrays provide a positional bonus based on the [row][col].
 * The tables are defined from Red's perspective.
 * Red starts at row 6-9 (bottom) and moves towards row 0-4 (top).
 * For Black, we mirror the row index: 9 - row.
 */

const PST_SOLDIER = [
  // 0: Enemy back rank (promotion line, sometimes dead if stuck on edge)
  [ 0,  0,  0, 20, 20, 20,  0,  0,  0],
  // 1: Deep in enemy territory 
  [10, 20, 30, 40, 40, 40, 30, 20, 10],
  // 2: Very close to palace
  [10, 20, 30, 50, 60, 50, 30, 20, 10],
  // 3: Passed the river
  [10, 15, 20, 35, 40, 35, 20, 15, 10],
  // 4: On enemy river bank
  [ 5, 10, 15, 25, 30, 25, 15, 10,  5],
  // 5: Friendly river bank (home side, can only move forward)
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  // 6: Initial position
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  // 7,8,9: Behind initial position (normally impossible for a pawn to go backwards, but keeping for safety)
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_HORSE = [
  [ 0, -5, -5, -5, -5, -5, -5, -5,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  5, 15, 15, 15, 15, 15,  5,  0],
  [ 5, 10, 20, 20, 20, 20, 20, 10,  5],
  [ 5, 10, 25, 25, 30, 25, 25, 10,  5],
  // Friendly side
  [ 5, 10, 20, 25, 25, 25, 20, 10,  5],
  [ 5, 10, 15, 20, 20, 20, 15, 10,  5],
  [ 0,  5, 10, 15, 15, 15, 10,  5,  0],
  [ 0,  0,  5, 10, 10, 10,  5,  0,  0],
  [-5, -5, -5,  0,  0,  0, -5, -5, -5] // Bottom row/corners are bad for horses
];

const PST_CANNON = [
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  5,  5,  5,  0,  0,  0],
  [ 5,  5,  5, 15, 20, 15,  5,  5,  5], // Targeting the enemy palace
  [ 5,  5, 10, 15, 15, 15, 10,  5,  5],
  [ 0,  5, 10, 10, 15, 10, 10,  5,  0],
  [ 0,  5, 10, 10, 15, 10, 10,  5,  0], // River banks
  [ 0,  0,  5, 10, 15, 10,  5,  0,  0],
  // Home territory
  [ 5,  5,  5, 15, 20, 15,  5,  5,  5], // Initial rank (often good for defense/attacking centrally)
  [ 5,  5,  5, 10, 15, 10,  5,  5,  5],
  [ 0,  0,  0,  5, 10,  5,  0,  0,  0]
];

const PST_CHARIOT = [
  // Chariots are highly mobile, prefer open files and enemy ranks
  [10, 10, 10, 15, 15, 15, 10, 10, 10], // Enemy baseline
  [10, 15, 15, 20, 20, 20, 15, 15, 10], // Very aggressive
  [ 5, 10, 15, 20, 20, 20, 15, 10,  5], // Targeting palace
  [ 5, 10, 10, 15, 15, 15, 10, 10,  5], 
  [ 0,  5, 10, 15, 15, 15, 10,  5,  0], // River
  [ 0,  5, 10, 15, 15, 15, 10,  5,  0], 
  [ 0,  0,  5, 10, 10, 10,  5,  0,  0],
  [-5,  0,  5, 10, 10, 10,  5,  0, -5],
  [-5, -5,  0,  5, 10,  5,  0, -5, -5],
  [-5, -5, -5,  0,  0,  0, -5, -5, -5]  // Corners are bad
];

// General, Advisors, and Elephants stay in their specific zones
const PST_GENERAL = [
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0, -5, -5, -5,  0,  0,  0], // Top row of palace
  [ 0,  0,  0, -5,  0, -5,  0,  0,  0], // Middle of palace
  [ 0,  0,  0,  5, 10,  5,  0,  0,  0]  // Baseline is safest
];

const PST_ADVISOR = [
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  5,  0,  5,  0,  0,  0], // Top corners
  [ 0,  0,  0,  0, 15,  0,  0,  0,  0], // Center is best for defense
  [ 0,  0,  0,  5,  0,  5,  0,  0,  0]  // Bottom corners
];

const PST_ELEPHANT = [
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0, 10,  0,  0,  0, 10,  0,  0], // Top elephant row (river bank)
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 5,  0,  0,  0, 15,  0,  0,  0,  5], // Center elephant is excellent
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  5,  0,  0,  0,  5,  0,  0]  // Baseline elephants
];

const PST_MAP: Record<PieceType, number[][]> = {
  soldier: PST_SOLDIER,
  horse: PST_HORSE,
  cannon: PST_CANNON,
  chariot: PST_CHARIOT,
  general: PST_GENERAL,
  advisor: PST_ADVISOR,
  elephant: PST_ELEPHANT
};

export function getPiecePositionalBonus(type: PieceType, side: PieceSide, r: number, c: number): number {
  const table = PST_MAP[type];
  if (!table) return 0;
  
  // Red pieces evaluate using table directly (Red attacks UP, towards r=0)
  // Black pieces evaluate using mirrored row (Black attacks DOWN, towards r=9)
  const row = side === 'red' ? r : 9 - r;
  
  // Optional mirror columns if board is asymmetric, but Xiangqi is symmetric left/right.
  // We just return the value
  if (row < 0 || row > 9 || c < 0 || c > 8) return 0;
  return table[row][c];
}

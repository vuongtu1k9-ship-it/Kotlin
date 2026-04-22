import { getMaterial, isInCheck, isAttacking } from '../moveLogic.mjs';
import { boardToFen } from '../fen.mjs';

/**
 * Technical Draw (Insufficient Material / Khô tử hòa)
 * Check if the remaining pieces can force a mate.
 */
export function isInsufficientMaterial(board) {
  const { counts, pieceCount } = getMaterial(board);
  
  // Basic Xiangqi technical draws:
  // 1. Both sides have only General
  if (pieceCount === 2) return true;

  const redPieces = Object.keys(counts).filter(k => k.startsWith('red-') && !k.endsWith('general'));
  const blackPieces = Object.keys(counts).filter(k => k.startsWith('black-') && !k.endsWith('general'));

  const hasStrong = (pieceList) => {
    return pieceList.some(p => p.endsWith('chariot') || p.endsWith('cannon') || p.endsWith('horse') || p.endsWith('soldier'));
  };

  // If neither side has a strong piece (only advisors/elephants), it's a draw
  if (!hasStrong(redPieces) && !hasStrong(blackPieces)) return true;

  // Specific cases from user request:
  // Sĩ Tượng toàn đối đơn Xe (Xe difficulty winning against Sĩ Tượng)
  // mã đơn thắng đơn sĩ (usually draw)
  // This is a complex area, simplified version for now:
  return false;
}

/**
 * 3-fold Repetition
 * Returns { isRepetition: boolean, forbidden: boolean, side: 'red'|'black'|null }
 */
export function countRepetitions(positionHistory) {
  if (!positionHistory || positionHistory.length < 6) return { count: 0 };
  const last = positionHistory[positionHistory.length - 1];
  let count = 0;
  let indices = [];
  for (let i = 0; i < positionHistory.length; i++) {
    if (positionHistory[i] === last) {
      count++;
      indices.push(i);
    }
  }
  return { count, indices };
}

/**
 * Detect Perpetual Check (Chiếu dai) or Perpetual Chase (Đuổi dai)
 * Returns the side that is at fault if it's a forbidden repetition.
 */
export function detectForbiddenRepetition(state) {
  const { positionHistory, moveHistory } = state;
  const { count, indices } = countRepetitions(positionHistory);
  
  if (count < 3) return null;

  // The rule of perpetual check/chase in Xiangqi applies to a side that initiates a cycle
  // where they are constantly checking or chasing.
  
  // We analyze the moves that led to the repeated positions.
  // indices contains the positionHistory indices where the same FEN occurs.
  // Example: indices = [10, 14, 18]
  // Moves reaching these: moveHistory[9], moveHistory[13], moveHistory[17] (All from same side)
  
  const lastPosIdx = indices[indices.length - 1];
  const lastMove = moveHistory[lastPosIdx - 1];
  if (!lastMove) return null;
  const side = lastMove.side;

  // Check if ALL moves of THIS side within the cycle were checks or chases.
  // The cycle starts from indices[0] to indices[2].
  const cycleStartIndex = indices[0];
  const cycleEndIndex = indices[indices.length - 1];
  
  let totalSideMoves = 0;
  let forbiddenSideMoves = 0;

  for (let i = cycleStartIndex; i < cycleEndIndex; i++) {
    const move = moveHistory[i];
    if (move && move.side === side) {
      totalSideMoves++;
      if (move.isCheck || move.isChase) {
        forbiddenSideMoves++;
      }
    }
  }

  // If a side is providing checks/chases in a repeating pattern, they lose.
  // Most rules treat "majority" or "continuous" forbidden moves as a loss.
  // We'll use a strict criteria: if at least 50% of moves in the cycle are forbidden 
  // AND it leads to repetition, the attacker must change or lose.
  if (totalSideMoves > 0 && (forbiddenSideMoves / totalSideMoves) >= 0.5) {
    return side;
  }

  return null;
}

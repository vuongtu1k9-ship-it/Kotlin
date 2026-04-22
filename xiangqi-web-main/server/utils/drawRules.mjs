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

  // The move at moveHistory[idx - 1] resulted in positionHistory[idx].
  // positionHistory has an initial position (index 0), then position after move 1 (index 1), etc.
  // Actually, in gameHandlers.mjs:
  // state.positionHistory = [initialFen, fenAfterMove1, fenAfterMove2, ...]
  // moveHistory = [move1, move2, ...]
  
  // Find the side that moved to reach the repeated position.
  const lastPosIdx = indices[indices.length - 1];
  const lastMove = moveHistory[lastPosIdx - 1];
  if (!lastMove) return null;
  const side = lastMove.side;

  // Verify that subsequent occurrences of this FEN were reached by 'side' performing a check or chase.
  let everyTimeForbidden = true;
  // We check from the second occurrence onwards because the first occurrence might be the initial state.
  // If it's 3-fold repetition, indices.length is 3. We check moves that reached 2nd and 3rd.
  for (let i = 1; i < indices.length; i++) {
    const idx = indices[i];
    const move = moveHistory[idx - 1];
    if (!move || move.side !== side || (!move.isCheck && !move.isChase)) {
      everyTimeForbidden = false;
      break;
    }
  }

  return everyTimeForbidden ? side : null;
}

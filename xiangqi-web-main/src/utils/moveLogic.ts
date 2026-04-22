import { Position, PieceType, PieceSide, Piece } from '../types';

/**
 * Basic piece movement legality (geometry + blocking + capture rules).
 * NOTE: This does NOT check whether the move leaves your own general in check.
 */
export const isValidMove = (
  pieceType: PieceType,
  from: Position,
  to: Position,
  side: PieceSide,
  board: (Piece | null)[][]
): boolean => {
  // bounds
  if (to.row < 0 || to.row > 9 || to.col < 0 || to.col > 8) return false;
  if (from.row === to.row && from.col === to.col) return false;

  const target = board[to.row]?.[to.col] ?? null;
  if (target && target.side === side) return false;

  const rowDiff = from.row - to.row;
  const colDiff = from.col - to.col;
  const absRow = Math.abs(rowDiff);
  const absCol = Math.abs(colDiff);

  switch (pieceType) {
    case 'general': {
      // One step orthogonally within palace
      const oneStep = absCol + absRow === 1;
      if (!oneStep) return false;
      return isInPalace(to, side);
    }

    case 'advisor':
      return absCol === 1 && absRow === 1 && isInPalace(to, side);

    case 'elephant':
      return (
        absRow === 2 &&
        absCol === 2 &&
        !isCrossRiver(to, side) &&
        !isBlockedElephant(from, to, board)
      );

    case 'horse':
      return isHorseMove(from, to, board);

    case 'chariot':
      return (from.row === to.row || from.col === to.col) && !isPathBlocked(from, to, board);

    case 'cannon': {
      if (!(from.row === to.row || from.col === to.col)) return false;
      const between = countPiecesBetween(from, to, board);
      if (!target) {
        // non-capture: path must be clear
        return between === 0;
      }
      // capture: must have exactly one screen between
      return between === 1;
    }

    case 'soldier':
      if (side === 'red') {
        // forward is decreasing row
        const forward = to.row === from.row - 1 && to.col === from.col;
        const crossed = from.row <= 4;
        const sideways = crossed && to.row === from.row && absCol === 1;
        return forward || sideways;
      } else {
        // forward is increasing row
        const forward = to.row === from.row + 1 && to.col === from.col;
        const crossed = from.row >= 5;
        const sideways = crossed && to.row === from.row && absCol === 1;
        return forward || sideways;
      }

    default:
      return false;
  }
};

/**
 * Full move legality: piece movement + cannot leave your own general in check.
 */
export const isLegalMove = (piece: Piece, to: Position, board: (Piece | null)[][]): boolean => {
  const from = piece.position;
  if (!isValidMove(piece.type, from, to, piece.side, board)) return false;

  const next = applyMoveToBoard(board, { from, to, piece });
  // flying general is handled by isInCheck logic
  return !isInCheck(piece.side, next);
};

export const isInCheck = (side: PieceSide, board: (Piece | null)[][]): boolean => {
  const gp = findGeneral(side, board);
  if (!gp) return false;
  const attacker = side === 'red' ? 'black' : 'red';

  // Special rule: generals cannot face each other with no pieces between
  const other = findGeneral(attacker, board);
  if (other && gp.col === other.col) {
    const between = countPiecesBetween(gp, other, board);
    if (between === 0) return true;
  }

  // Any opponent piece attacks general square?
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r]?.[c] ?? null;
      if (!p || p.side !== attacker) continue;
      if (isValidMove(p.type, p.position, gp, p.side, board)) return true;
    }
  }
  return false;
};

export const hasAnyLegalMove = (sideToMove: PieceSide, board: (Piece | null)[][]): boolean => {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r]?.[c] ?? null;
      if (!p || p.side !== sideToMove) continue;
      for (let rr = 0; rr < 10; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (isLegalMove(p, { row: rr, col: cc }, board)) return true;
        }
      }
    }
  }
  return false;
};

export const isCheckmate = (sideToMove: PieceSide, board: (Piece | null)[][]): boolean => {
  // Xiangqi: checkmate is being in check with no legal move.
  return isInCheck(sideToMove, board) && !hasAnyLegalMove(sideToMove, board);
};

export const isStalemate = (sideToMove: PieceSide, board: (Piece | null)[][]): boolean => {
  // Xiangqi: stalemate (not in check + no legal move) is a LOSS for the side to move.
  return !isInCheck(sideToMove, board) && !hasAnyLegalMove(sideToMove, board);
};

const isHorseMove = (from: Position, to: Position, board: (Piece | null)[][]): boolean => {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;

  // horse “leg” block
  if (adr === 2) {
    const legRow = from.row + Math.sign(dr);
    const legCol = from.col;
    return board[legRow]?.[legCol] == null;
  }
  // adc === 2
  const legRow = from.row;
  const legCol = from.col + Math.sign(dc);
  return board[legRow]?.[legCol] == null;
};

const isInPalace = (pos: Position, side: PieceSide): boolean => {
  if (pos.col < 3 || pos.col > 5) return false;
  if (side === 'red') return pos.row >= 7;
  return pos.row <= 2;
};

const isCrossRiver = (pos: Position, side: PieceSide): boolean => {
  // Elephant cannot cross the river (must stay on its own side).
  // Board rows: 0 (black home) .. 9 (red home). River is between rows 4 and 5.
  // Red must stay on rows 5-9; Black must stay on rows 0-4.
  if (side === 'red') return pos.row < 5;
  return pos.row > 4;
};

const isBlockedElephant = (from: Position, to: Position, board: (Piece | null)[][]): boolean => {
  const midRow = (from.row + to.row) / 2;
  const midCol = (from.col + to.col) / 2;
  return board[midRow]?.[midCol] != null;
};

const isPathBlocked = (from: Position, to: Position, board: (Piece | null)[][]): boolean => {
  return countPiecesBetween(from, to, board) > 0;
};

const countPiecesBetween = (from: Position, to: Position, board: (Piece | null)[][]): number => {
  let count = 0;
  if (from.row === to.row) {
    const minCol = Math.min(from.col, to.col);
    const maxCol = Math.max(from.col, to.col);
    for (let c = minCol + 1; c < maxCol; c++) {
      if (board[from.row]?.[c] != null) count++;
    }
    return count;
  }

  if (from.col === to.col) {
    const minRow = Math.min(from.row, to.row);
    const maxRow = Math.max(from.row, to.row);
    for (let r = minRow + 1; r < maxRow; r++) {
      if (board[r]?.[from.col] != null) count++;
    }
    return count;
  }

  // not straight line; for cannon/chariot this will be treated as invalid earlier
  return 99;
};

const findGeneral = (side: PieceSide, board: (Piece | null)[][]): Position | null => {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r]?.[c] ?? null;
      if (p && p.side === side && p.type === 'general') return { row: r, col: c };
    }
  }
  return null;
};

const applyMoveToBoard = (
  board: (Piece | null)[][],
  move: { from: Position; to: Position; piece: Piece }
): (Piece | null)[][] => {
  const next = board.map((r) => r.slice());
  next[move.from.row][move.from.col] = null;
  next[move.to.row][move.to.col] = { ...move.piece, position: move.to, hasMoved: true };
  return next;
};

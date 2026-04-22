// Server-side Xiangqi move validation (ported from src/utils/moveLogic.ts)

/** @typedef {'general'|'advisor'|'elephant'|'horse'|'chariot'|'cannon'|'soldier'} PieceType */
/** @typedef {'red'|'black'} PieceSide */
/** @typedef {{row:number,col:number}} Position */
/** @typedef {{id:string,type:PieceType,side:PieceSide,position:Position,hasMoved?:boolean}} Piece */

const makePiece = (type, side, row, col, n) => ({
  id: `${side}-${type}-${n}`,
  type,
  side,
  position: { row, col },
});

export const createEmptyBoard = () =>
  Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null));

export const createInitialBoard = () => {
  const board = createEmptyBoard();
  let i = 0;

  // Black side (top)
  ;(
    [
      'chariot',
      'horse',
      'elephant',
      'advisor',
      'general',
      'advisor',
      'elephant',
      'horse',
      'chariot',
    ]
  ).forEach((type, col) => {
    board[0][col] = makePiece(type, 'black', 0, col, i++);
  });
  board[2][1] = makePiece('cannon', 'black', 2, 1, i++);
  board[2][7] = makePiece('cannon', 'black', 2, 7, i++);
  ;[0, 2, 4, 6, 8].forEach((col) => {
    board[3][col] = makePiece('soldier', 'black', 3, col, i++);
  });

  // Red side (bottom)
  ;(
    [
      'chariot',
      'horse',
      'elephant',
      'advisor',
      'general',
      'advisor',
      'elephant',
      'horse',
      'chariot',
    ]
  ).forEach((type, col) => {
    board[9][col] = makePiece(type, 'red', 9, col, i++);
  });
  board[7][1] = makePiece('cannon', 'red', 7, 1, i++);
  board[7][7] = makePiece('cannon', 'red', 7, 7, i++);
  ;[0, 2, 4, 6, 8].forEach((col) => {
    board[6][col] = makePiece('soldier', 'red', 6, col, i++);
  });

  return board;
};

/**
 * Basic piece movement legality (geometry + blocking + capture rules).
 * NOTE: This does NOT check whether the move leaves your own general in check.
 */
export const isValidMove = (pieceType, from, to, side, board) => {
  if (!to || typeof to.row !== 'number' || typeof to.col !== 'number') return false;
  if (to.row < 0 || to.row > 9 || to.col < 0 || to.col > 8) return false;
  if (from.row === to.row && from.col === to.col) return false;

  const target = board?.[to.row]?.[to.col] ?? null;
  if (target && target.side === side) return false;

  const rowDiff = from.row - to.row;
  const colDiff = from.col - to.col;
  const absRow = Math.abs(rowDiff);
  const absCol = Math.abs(colDiff);

  switch (pieceType) {
    case 'general': {
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
      if (!target) return between === 0;
      return between === 1;
    }

    case 'soldier':
      if (side === 'red') {
        const forward = to.row === from.row - 1 && to.col === from.col;
        const crossed = from.row <= 4;
        const sideways = crossed && to.row === from.row && absCol === 1;
        return forward || sideways;
      } else {
        const forward = to.row === from.row + 1 && to.col === from.col;
        const crossed = from.row >= 5;
        const sideways = crossed && to.row === from.row && absCol === 1;
        return forward || sideways;
      }

    default:
      return false;
  }
};

/** Full move legality: movement + cannot leave your own general in check. */
export const isLegalMove = (piece, to, board) => {
  const from = piece.position;
  if (!isValidMove(piece.type, from, to, piece.side, board)) return false;
  const next = applyMoveToBoard(board, { from, to, piece });
  return !isInCheck(piece.side, next);
};

export const isInCheck = (side, board) => {
  const gp = findGeneral(side, board);
  if (!gp) return false;
  const attacker = side === 'red' ? 'black' : 'red';

  // flying general
  const other = findGeneral(attacker, board);
  if (other && gp.col === other.col) {
    const between = countPiecesBetween(gp, other, board);
    if (between === 0) return true;
  }

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board?.[r]?.[c] ?? null;
      if (!p || p.side !== attacker) continue;
      if (isValidMove(p.type, p.position, gp, p.side, board)) return true;
    }
  }
  return false;
};

/**
 * Check if a side is attacking a specific piece on the board.
 * 'attackerSide' is the side that might be attacking.
 * 'targetPos' is the position of the piece being attacked.
 */
export const isAttacking = (attackerSide, targetPos, board) => {
  const targetPiece = board?.[targetPos.row]?.[targetPos.col];
  if (!targetPiece || targetPiece.side === attackerSide) return false;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board?.[r]?.[c] ?? null;
      if (!p || p.side !== attackerSide) continue;
      if (isValidMove(p.type, p.position, targetPos, p.side, board)) return true;
    }
  }
  return false;
};

/** Apply a move to a cloned board and return {nextBoard, movedPiece, capturedPiece}. */
export const applyMoveToBoardInPlace = (board, from, to) => {
  const piece = board?.[from.row]?.[from.col] ?? null;
  if (!piece) return { ok: false, error: 'NO_PIECE' };
  const captured = board?.[to.row]?.[to.col] ?? null;

  const next = board.map((r) => r.slice());
  next[from.row][from.col] = null;
  next[to.row][to.col] = { ...piece, position: { ...to }, hasMoved: true };

  return { ok: true, nextBoard: next, movedPiece: next[to.row][to.col], capturedPiece: captured };
};

const isHorseMove = (from, to, board) => {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;

  if (adr === 2) {
    const legRow = from.row + Math.sign(dr);
    const legCol = from.col;
    return board?.[legRow]?.[legCol] == null;
  }
  const legRow = from.row;
  const legCol = from.col + Math.sign(dc);
  return board?.[legRow]?.[legCol] == null;
};

const isInPalace = (pos, side) => {
  if (pos.col < 3 || pos.col > 5) return false;
  if (side === 'red') return pos.row >= 7;
  return pos.row <= 2;
};

const isCrossRiver = (pos, side) => {
  if (side === 'red') return pos.row < 5;
  return pos.row > 4;
};

const isBlockedElephant = (from, to, board) => {
  const midRow = (from.row + to.row) / 2;
  const midCol = (from.col + to.col) / 2;
  return board?.[midRow]?.[midCol] != null;
};

const isPathBlocked = (from, to, board) => countPiecesBetween(from, to, board) > 0;

const countPiecesBetween = (from, to, board) => {
  let count = 0;
  if (from.row === to.row) {
    const minCol = Math.min(from.col, to.col);
    const maxCol = Math.max(from.col, to.col);
    for (let c = minCol + 1; c < maxCol; c++) {
      if (board?.[from.row]?.[c] != null) count++;
    }
    return count;
  }

  if (from.col === to.col) {
    const minRow = Math.min(from.row, to.row);
    const maxRow = Math.max(from.row, to.row);
    for (let r = minRow + 1; r < maxRow; r++) {
      if (board?.[r]?.[from.col] != null) count++;
    }
    return count;
  }

  return 99;
};

const findGeneral = (side, board) => {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board?.[r]?.[c] ?? null;
      if (p && p.side === side && p.type === 'general') return { row: r, col: c };
    }
  }
  return null;
};

const applyMoveToBoard = (board, move) => {
  const next = board.map((r) => r.slice());
  next[move.from.row][move.from.col] = null;
  next[move.to.row][move.to.col] = { ...move.piece, position: { ...move.to }, hasMoved: true };
  return next;
};

/**
 * Summarize material on board.
 * Returns { counts: { 'red-chariot': 1, ... }, pieceCount: 16, pieces: ['red-chariot', ...] }
 */
export const getMaterial = (board) => {
  const counts = {};
  const pieces = new Set();
  let pieceCount = 0;
  if (!Array.isArray(board)) return { counts, pieces: [], pieceCount };

  // Determine if it's a 2D array or 1D array of strings
  const is2D = Array.isArray(board[0]);

  if (is2D) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board[r]?.[c];
        if (p && p.side && p.type) {
          const key = `${p.side}-${p.type}`;
          counts[key] = (counts[key] || 0) + 1;
          pieces.add(key);
          pieceCount++;
        }
      }
    }
  } else {
    // Legacy format: ["rchariot:01", "bgeneral:04", ...]
    for (const s of board) {
      if (typeof s !== 'string') continue;
      const [typeSide] = s.split(':');
      if (!typeSide) continue;
      const sideChar = typeSide.charAt(0);
      const type = typeSide.slice(1);
      const side = sideChar === 'r' ? 'red' : 'black';
      if (type && side) {
        const key = `${side}-${type}`;
        counts[key] = (counts[key] || 0) + 1;
        pieces.add(key);
        pieceCount++;
      }
    }
  }

  return { counts, pieces: Array.from(pieces).sort(), pieceCount };
};



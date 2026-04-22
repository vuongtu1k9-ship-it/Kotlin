import { Piece, PieceSide, PieceType } from '../types';

const makePiece = (
  type: PieceType,
  side: PieceSide,
  row: number,
  col: number,
  n: number
): Piece => ({
  id: `${side}-${type}-${n}`,
  type,
  side,
  position: { row, col },
});

export const createEmptyBoard = (): (Piece | null)[][] =>
  Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null));

export const createInitialBoard = (): (Piece | null)[][] => {
  const board = createEmptyBoard();
  let i = 0;

  // Black side (top)
  (
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
    ] as PieceType[]
  ).forEach((type, col) => {
    board[0][col] = makePiece(type, 'black', 0, col, i++);
  });
  board[2][1] = makePiece('cannon', 'black', 2, 1, i++);
  board[2][7] = makePiece('cannon', 'black', 2, 7, i++);
  [0, 2, 4, 6, 8].forEach((col) => {
    board[3][col] = makePiece('soldier', 'black', 3, col, i++);
  });

  // Red side (bottom)
  (
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
    ] as PieceType[]
  ).forEach((type, col) => {
    board[9][col] = makePiece(type, 'red', 9, col, i++);
  });
  board[7][1] = makePiece('cannon', 'red', 7, 1, i++);
  board[7][7] = makePiece('cannon', 'red', 7, 7, i++);
  [0, 2, 4, 6, 8].forEach((col) => {
    board[6][col] = makePiece('soldier', 'red', 6, col, i++);
  });

  return board;
};

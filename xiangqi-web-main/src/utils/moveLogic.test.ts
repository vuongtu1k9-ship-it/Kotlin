import { describe, it, expect } from 'vitest';
import { isValidMove, isLegalMove, isInCheck, isCheckmate, isStalemate } from './moveLogic';
import type { Piece, PieceSide, PieceType, Position } from '../types';

const emptyBoard = (): (Piece | null)[][] =>
  Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null));

const makePiece = (type: PieceType, side: PieceSide, position: Position, id = `${side}-${type}`): Piece => ({
  id,
  type,
  side,
  position,
});

const place = (board: (Piece | null)[][], piece: Piece): (Piece | null)[][] => {
  board[piece.position.row][piece.position.col] = piece;
  return board;
};

describe('moveLogic.ts core rules', () => {
  it('elephant cannot cross the river (red)', () => {
    const board = emptyBoard();
    const from = { row: 6, col: 2 };
    const toAcrossRiver = { row: 4, col: 4 }; // red elephants must stay on rows 5..9

    expect(isValidMove('elephant', from, toAcrossRiver, 'red', board)).toBe(false);

    const toOwnSide = { row: 8, col: 4 };
    expect(isValidMove('elephant', from, toOwnSide, 'red', board)).toBe(true);
  });

  it('horse-leg blocking is enforced', () => {
    const board = emptyBoard();
    const from = { row: 9, col: 1 };
    const to = { row: 7, col: 2 }; // L move (dr=-2, dc=+1) => leg at (8,1)

    expect(isValidMove('horse', from, to, 'red', board)).toBe(true);

    // block the leg
    place(board, makePiece('soldier', 'red', { row: 8, col: 1 }, 'blocker'));
    expect(isValidMove('horse', from, to, 'red', board)).toBe(false);
  });

  it('cannon capture requires exactly one screen; non-capture requires a clear line', () => {
    // cannon at (7,1) aiming at (7,7)
    const base = emptyBoard();
    const cannonFrom = { row: 7, col: 1 };
    place(base, makePiece('cannon', 'red', cannonFrom, 'rc'));

    // capture with exactly 1 screen
    const oneScreen = base.map((r) => r.slice());
    place(oneScreen, makePiece('soldier', 'red', { row: 7, col: 4 }, 'screen'));
    place(oneScreen, makePiece('soldier', 'black', { row: 7, col: 7 }, 'target'));
    expect(isValidMove('cannon', cannonFrom, { row: 7, col: 7 }, 'red', oneScreen)).toBe(true);

    // capture with 0 screens is illegal
    const zeroScreen = base.map((r) => r.slice());
    place(zeroScreen, makePiece('soldier', 'black', { row: 7, col: 7 }, 'target'));
    expect(isValidMove('cannon', cannonFrom, { row: 7, col: 7 }, 'red', zeroScreen)).toBe(false);

    // capture with 2 screens is illegal
    const twoScreens = base.map((r) => r.slice());
    place(twoScreens, makePiece('soldier', 'red', { row: 7, col: 3 }, 'screen1'));
    place(twoScreens, makePiece('soldier', 'black', { row: 7, col: 5 }, 'screen2'));
    place(twoScreens, makePiece('soldier', 'black', { row: 7, col: 7 }, 'target'));
    expect(isValidMove('cannon', cannonFrom, { row: 7, col: 7 }, 'red', twoScreens)).toBe(false);

    // non-capture with any screen is illegal
    const nonCaptureBlocked = base.map((r) => r.slice());
    place(nonCaptureBlocked, makePiece('soldier', 'red', { row: 7, col: 4 }, 'screen'));
    expect(isValidMove('cannon', cannonFrom, { row: 7, col: 6 }, 'red', nonCaptureBlocked)).toBe(false);

    // non-capture clear line is legal
    const nonCaptureClear = base.map((r) => r.slice());
    expect(isValidMove('cannon', cannonFrom, { row: 7, col: 6 }, 'red', nonCaptureClear)).toBe(true);
  });

  it('flying general is treated as check for both sides', () => {
    const board = emptyBoard();
    place(board, makePiece('general', 'black', { row: 0, col: 4 }, 'bg'));
    place(board, makePiece('general', 'red', { row: 9, col: 4 }, 'rg'));

    expect(isInCheck('red', board)).toBe(true);
    expect(isInCheck('black', board)).toBe(true);
  });

  it('self-check is prevented (moving away an interposing piece that would cause flying general)', () => {
    const board = emptyBoard();
    const redGeneral = makePiece('general', 'red', { row: 9, col: 4 }, 'rg');
    const blackGeneral = makePiece('general', 'black', { row: 0, col: 4 }, 'bg');
    const interposer = makePiece('chariot', 'red', { row: 5, col: 4 }, 'block');
    place(board, redGeneral);
    place(board, blackGeneral);
    place(board, interposer);

    // Geometrically the chariot can slide to the right...
    expect(isValidMove('chariot', interposer.position, { row: 5, col: 5 }, 'red', board)).toBe(true);
    // ...but it is illegal because it exposes the red general to flying general check.
    expect(isLegalMove(interposer, { row: 5, col: 5 }, board)).toBe(false);
  });

  it('detects checkmate (in check and has no legal moves)', () => {
    const board = emptyBoard();
    // Black to move, black general in check by a red chariot on (1,4)
    place(board, makePiece('general', 'black', { row: 0, col: 4 }, 'bg'));
    place(board, makePiece('general', 'red', { row: 9, col: 4 }, 'rg'));

    place(board, makePiece('chariot', 'red', { row: 1, col: 4 }, 'checkRook'));

    // Protect the checking rook so capture is illegal
    place(board, makePiece('chariot', 'red', { row: 1, col: 0 }, 'protector'));

    // Cover escape squares (0,3)/(1,3) and (0,5)/(1,5)
    place(board, makePiece('chariot', 'red', { row: 2, col: 3 }, 'coverL'));
    place(board, makePiece('chariot', 'red', { row: 2, col: 5 }, 'coverR'));

    expect(isInCheck('black', board)).toBe(true);
    expect(isCheckmate('black', board)).toBe(true);
  });

  it('detects stalemate (not in check and has no legal moves)', () => {
    const board = emptyBoard();
    // Black to move, not currently in check, but all general moves are into check.
    place(board, makePiece('general', 'black', { row: 0, col: 4 }, 'bg'));
    place(board, makePiece('general', 'red', { row: 9, col: 4 }, 'rg'));

    // Block the file so flying general does NOT give check on the current square.
    place(board, makePiece('soldier', 'red', { row: 5, col: 4 }, 'fileBlock'));

    // Attack (1,4) without attacking (0,4)
    place(board, makePiece('chariot', 'red', { row: 1, col: 0 }, 'atk14'));
    // Attack (0,3)
    place(board, makePiece('chariot', 'red', { row: 2, col: 3 }, 'atk03'));
    // Attack (0,5)
    place(board, makePiece('chariot', 'red', { row: 2, col: 5 }, 'atk05'));

    expect(isInCheck('black', board)).toBe(false);
    expect(isStalemate('black', board)).toBe(true);
  });
});

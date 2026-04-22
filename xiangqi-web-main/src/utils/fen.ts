import { Piece, PieceSide, PieceType } from '../types';

const mapTypeToFen: Record<PieceType, string> = {
  general: 'k',
  advisor: 'a',
  elephant: 'b',
  horse: 'n',
  chariot: 'r',
  cannon: 'c',
  soldier: 'p',
};

const mapFenToType: Record<string, PieceType> = {
  k: 'general',
  a: 'advisor',
  b: 'elephant',
  n: 'horse',
  r: 'chariot',
  c: 'cannon',
  p: 'soldier',
};

export function boardToFen(board: (Piece | null)[][], sideToMove: PieceSide): string {
  const ranks: string[] = [];
  for (let r = 0; r < 10; r++) {
    let empty = 0;
    let s = '';
    for (let c = 0; c < 9; c++) {
      const p = board?.[r]?.[c] ?? null;
      if (!p) {
        empty++;
        continue;
      }
      if (empty) {
        s += String(empty);
        empty = 0;
      }
      const ch = mapTypeToFen[p.type];
      if (!ch) {
        console.error('Invalid piece type encountered:', p.type, p);
        continue;
      }
      s += p.side === 'red' ? ch.toUpperCase() : ch;
    }
    if (empty) s += String(empty);
    ranks.push(s || '9');
  }

  const stm = sideToMove === 'red' ? 'w' : 'b';
  return `${ranks.join('/')} ${stm} - - 0 1`;
}

export function fenToBoard(fen: string): { board: (Piece | null)[][], sideToMove: PieceSide } {
  const parts = fen.trim().split(/\s+/);
  const boardStr = parts[0];
  const stmChar = parts[1] || 'w';
  const sideToMove: PieceSide = stmChar === 'b' ? 'black' : 'red';
  
  const board: (Piece | null)[][] = Array.from({ length: 10 }, () => Array(9).fill(null));
  const ranks = boardStr.split('/');
  
  let idCounter = 0;
  for (let r = 0; r < Math.min(ranks.length, 10); r++) {
    const rankStr = ranks[r];
    let c = 0;
    for (let i = 0; i < rankStr.length && c < 9; i++) {
      const char = rankStr[i];
      if (/[1-9]/.test(char)) {
        c += parseInt(char, 10);
      } else {
        const side: PieceSide = char === char.toUpperCase() ? 'red' : 'black';
        const typeChar = char.toLowerCase();
        const type = mapFenToType[typeChar];
        if (type) {
          board[r][c] = {
            id: `${side}-${type}-${Date.now()}-${idCounter++}`,
            side,
            type,
            position: { row: r, col: c },
            hasMoved: true,
          };
        }
        c++;
      }
    }
  }
  return { board, sideToMove };
}

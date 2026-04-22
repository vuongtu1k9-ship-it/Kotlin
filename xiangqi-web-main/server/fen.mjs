// Xiangqi FEN helpers for Pikafish

const mapTypeToFen = {
  chariot: 'r',
  horse: 'n',
  elephant: 'b',
  advisor: 'a',
  general: 'k',
  cannon: 'c',
  soldier: 'p',
};

export function boardToFen(board, sideToMove /* 'red'|'black' */) {
  // Our board coords: row 0 = black home (top), row 9 = red home (bottom)
  // FEN ranks go from top (row 0) to bottom (row 9)
  const ranks = [];
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
        empty++; // Treat unknown pieces as empty for FEN consistency
        continue;
      }
      s += p.side === 'red' ? ch.toUpperCase() : ch;
    }
    if (empty) s += String(empty);
    ranks.push(s || '9');
  }

  const stm = sideToMove === 'red' ? 'w' : 'b';
  // Xiangqi FEN commonly uses: <board> <stm> - - 0 1
  return `${ranks.join('/')} ${stm} - - 0 1`;
}

export function uciToMoveCoords(uci) {
  if (!uci || typeof uci !== 'string') return null;

  // Use regex to parse UCI like 'h9h3' (Standard/Pikafish)
  const match = uci.match(/^([a-i])(\d+)([a-i])(\d+)$/);
  if (!match) return null;

  const [, f1, r1, f2, r2] = match;
  const colFrom = f1.charCodeAt(0) - 'a'.charCodeAt(0);
  const colTo = f2.charCodeAt(0) - 'a'.charCodeAt(0);
  
  let rank1 = parseInt(r1, 10);
  let rank2 = parseInt(r2, 10);

  // 0-9 system: row 0 is rank 9, row 9 is rank 0 (Standard Pikafish)
  return {
    from: { row: 9 - rank1, col: colFrom },
    to: { row: 9 - rank2, col: colTo },
  };
}

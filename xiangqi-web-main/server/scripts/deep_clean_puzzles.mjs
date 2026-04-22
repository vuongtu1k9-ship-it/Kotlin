import { getDb } from '../server/mongo.mjs';
import { logger } from '../server/logger.mjs';
import { isInCheck } from '../server/moveLogic.mjs';
import { clearPuzzleCache } from '../server/services/cache.mjs';

const PIECE_LIMITS = {
  general: 1, advisor: 2, elephant: 2, horse: 2, chariot: 2, cannon: 2, soldier: 5
};

const ALIASES = {
  king: 'general',
  pawn: 'soldier'
};

function isPalace(side, r, c) {
  if (c < 3 || c > 5) return false;
  if (side === 'red') return r >= 7 && r <= 9;
  return r >= 0 && r <= 2;
}

function isValidAdvisor(side, r, c) {
  const valid = side === 'red' 
    ? [[9,3],[9,5],[8,4],[7,3],[7,5]].some(([vr, vc]) => vr === r && vc === c)
    : [[0,3],[0,5],[1,4],[2,3],[2,5]].some(([vr, vc]) => vr === r && vc === c);
  return valid;
}

function isValidElephant(side, r, c) {
  const valid = side === 'red'
    ? r >= 5 && [[9,2],[9,6],[7,0],[7,4],[7,8],[5,2],[5,6]].some(([vr, vc]) => vr === r && vc === c)
    : r <= 4 && [[0,2],[0,6],[2,0],[2,4],[2,8],[4,2],[4,6]].some(([vr, vc]) => vr === r && vc === c);
  return valid;
}

function createBoardFromSetup(pieces) {
  const board = Array(10).fill(null).map(() => Array(9).fill(null));
  if (Array.isArray(pieces) && Array.isArray(pieces[0])) {
    // Already in matrix format, ensure positions are correct
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (pieces[r][c]) {
          board[r][c] = { ...pieces[r][c], position: { row: r, col: c } };
        }
      }
    }
    return board;
  }
  // Legacy array format
  for (const p of pieces) {
    const parts = p.split(':');
    if (parts.length < 2) continue;
    const name = parts[0];
    const pos = parts[1];
    const r = parseInt(pos[0]);
    const c = parseInt(pos[1]);
    const side = name.startsWith('r') ? 'red' : 'black';
    let type = name.substring(1);
    if (ALIASES[type]) type = ALIASES[type];
    board[r][c] = { type, side, position: { row: r, col: c } };
  }
  return board;
}

async function run() {
  const db = await getDb();
  const col = db.collection('puzzles');
  const puzzles = await col.find({}).toArray();

  logger.log(`Deep cleaning ${puzzles.length} puzzles...`);

  let deleted = 0;
  let flipped = 0;
  let kept = 0;

  for (const doc of puzzles) {
    let pieces = doc.board || [];
    if (!pieces.length || (Array.isArray(pieces) && pieces.length === 0)) {
      logger.log(`[DELETE] ${doc.uid || doc._id} - Empty board`);
      await col.deleteOne({ _id: doc._id });
      deleted++;
      continue;
    }

    let board = createBoardFromSetup(pieces);
    let counts = { red: {}, black: {} };
    let redG = null, blackG = null;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board?.[r]?.[c] ?? null;
        if (!p || !p.side || !p.type) continue;
        let type = p.type;
        if (ALIASES[type]) type = ALIASES[type];
        
        counts[p.side][type] = (counts[p.side][type] || 0) + 1;
        if (type === 'general') {
          if (p.side === 'red') redG = { r, c };
          else blackG = { r, c };
        }
      }
    }

    let reason = '';
    
    // 1. King Presence
    if (!redG || !blackG || counts.red.general !== 1 || counts.black.general !== 1) {
      reason = 'ILLEGAL_GENERAL_COUNT';
    }

    // 2. Piece Specific Rules
    if (!reason) {
      outer: for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const p = board[r][c];
          if (!p) continue;
          let type = p.type;
          if (ALIASES[type]) type = ALIASES[type];

          if (counts[p.side][type] > PIECE_LIMITS[type]) {
            reason = `LIMIT_EXCEEDED_${type.toUpperCase()}`;
            break outer;
          }

          if (type === 'general' && !isPalace(p.side, r, c)) {
            reason = `GENERAL_OUTSIDE_PALACE_${p.side}`;
            break outer;
          }
          if (type === 'advisor' && !isValidAdvisor(p.side, r, c)) {
            reason = `BAD_ADVISOR_POS_${p.side}`;
            break outer;
          }
          if (type === 'elephant' && !isValidElephant(p.side, r, c)) {
            reason = `BAD_ELEPHANT_POS_${p.side}`;
            break outer;
          }
          if (type === 'soldier') {
            if (p.side === 'red' && r > 6) { reason = 'RED_SOLDIER_BACKWARD'; break outer; }
            if (p.side === 'black' && r < 3) { reason = 'BLACK_SOLDIER_BACKWARD'; break outer; }
          }
        }
      }
    }

    // 3. Check Status (Facing Kings included)
    if (!reason) {
      if (isInCheck('red', board) || isInCheck('black', board)) {
        reason = 'GENERAL_IN_CHECK';
      }
    }

    if (reason) {
      logger.log(`[DELETE] ${doc.uid || doc._id} - ${reason}`);
      await col.deleteOne({ _id: doc._id });
      deleted++;
    } else {
      kept++;
    }
  }

  logger.log(`--- COMPLETE ---`);
  logger.log(`Kept:    ${kept}`);
  logger.log(`Deleted: ${deleted}`);

  // Clear Redis Cache via service
  logger.log('Clearing puzzle cache in Redis...');
  await clearPuzzleCache();
  logger.log('Cache cleared.');

  process.exit(0);
}

run().catch(err => {
  logger.error(err);
  process.exit(1);
});

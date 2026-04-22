import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import { logger } from './server/logger.mjs';
import { isInCheck, createEmptyBoard } from './server/moveLogic.mjs';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

async function run() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(MONGO_DB);
  const col = db.collection('puzzles');

  const docs = await col.find({}).toArray();
  logger.log(`Total puzzles: ${docs.length}`);

  let flippedCount = 0;
  let deletedCount = 0;
  
  const stats = {
    no_kings: 0,
    multi_kings: 0,
    outside_palace: 0,
    invalid_counts: 0,
    in_check: 0
  };

  const typeMap = {
    king: 'general',
    pawn: 'soldier'
  };

  const pieceLimits = {
    general: 1,
    advisor: 2,
    elephant: 2,
    horse: 2,
    chariot: 2,
    cannon: 2,
    soldier: 5
  };

  function to2DBoard(pieces) {
    const b = createEmptyBoard();
    for (const p of pieces) {
      b[p.row][p.col] = p;
    }
    return b;
  }

  function getPieces(board) {
    const list = [];
    if (!Array.isArray(board)) return list;
    if (board.length === 10 && Array.isArray(board[0])) {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const p = board[r][c];
          if (p) {
            let type = p.type;
            if (typeMap[type]) type = typeMap[type];
            list.push({ ...p, type, row: r, col: c });
          }
        }
      }
    } else {
      for (const entry of board) {
        if (typeof entry !== 'string') continue;
        const [k, v] = entry.split(':');
        const side = k.startsWith('r') ? 'red' : 'black';
        let type = k.substring(1);
        if (typeMap[type]) type = typeMap[type];
        const row = parseInt(v[0], 10);
        const col = parseInt(v[1], 10);
        list.push({ side, type, row, col, position: { row, col } });
      }
    }
    return list;
  }

  function isPalace(side, r, c) {
    if (c < 3 || c > 5) return false;
    if (side === 'red') return r >= 7 && r <= 9;
    if (side === 'black') return r >= 0 && r <= 2;
    return false;
  }

  for (const doc of docs) {
    let pieces = getPieces(doc.board);
    let shouldDelete = false;
    let reason = '';

    const redKings = pieces.filter(p => p.side === 'red' && p.type === 'general');
    const blackKings = pieces.filter(p => p.side === 'black' && p.type === 'general');

    if (redKings.length !== 1 || blackKings.length !== 1) {
      shouldDelete = true;
      reason = redKings.length === 0 || blackKings.length === 0 ? 'no_kings' : 'multi_kings';
    } else {
      const rk = redKings[0];
      const bk = blackKings[0];

      // Orientation check
      if (rk.row <= 4 && bk.row >= 5) {
        // FLIP
        pieces = pieces.map(p => {
          const nr = 9 - p.row;
          const nc = 8 - p.col;
          return { ...p, row: nr, col: nc, position: { row: nr, col: nc } };
        });
        flippedCount++;
      } else if (rk.row <= 4 || bk.row >= 5) {
        // Mixed or ambiguous, but we priorite Red at bottom.
        // If Red is at top, flip.
        if (rk.row <= 4) {
          pieces = pieces.map(p => {
            const nr = 9 - p.row;
            const nc = 8 - p.col;
            return { ...p, row: nr, col: nc, position: { row: nr, col: nc } };
          });
          flippedCount++;
        }
      }

      const freshRk = pieces.find(p => p.side === 'red' && p.type === 'general');
      const freshBk = pieces.find(p => p.side === 'black' && p.type === 'general');

      if (!isPalace('red', freshRk.row, freshRk.col) || !isPalace('black', freshBk.row, freshBk.col)) {
        shouldDelete = true;
        reason = 'outside_palace';
      }

      if (!shouldDelete) {
        const counts = { red: {}, black: {} };
        for (const p of pieces) {
          counts[p.side][p.type] = (counts[p.side][p.type] || 0) + 1;
          if (counts[p.side][p.type] > pieceLimits[p.type]) {
            shouldDelete = true;
            reason = 'invalid_counts';
            break;
          }
        }
      }

      if (!shouldDelete) {
        const board2d = to2DBoard(pieces);
        if (isInCheck('red', board2d) || isInCheck('black', board2d)) {
          shouldDelete = true;
          reason = 'in_check';
        }
      }
    }

    if (shouldDelete) {
      deletedCount++;
      stats[reason]++;
      await col.deleteOne({ _id: doc._id });
    } else {
      // Update with standardized board (2D array)
      const board2d = to2DBoard(pieces);
      await col.updateOne({ _id: doc._id }, { $set: { board: board2d, updatedAt: Date.now() } });
    }
  }

  logger.log(`Standardization complete.`);
  logger.log(`Flipped: ${flippedCount}`);
  logger.log(`Deleted: ${deletedCount}`, stats);

  await client.close();
}

run().catch(logger.error);

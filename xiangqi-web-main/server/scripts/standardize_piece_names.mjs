import { getDb } from '../server/mongo.mjs';
import { logger } from '../server/logger.mjs';

const PIECE_MAP = {
  king: 'general',
  pawn: 'soldier',
// Add more if discovered
};

async function run() {
  const db = await getDb();
  const col = db.collection('puzzles');
  const puzzles = await col.find({}).toArray();

  logger.log(`Standardizing pieces for ${puzzles.length} puzzles...`);

  let updated = 0;

  for (const doc of puzzles) {
    let board = doc.board || [];
    let changed = false;

    if (Array.isArray(board) && board.length > 0 && typeof board[0] === 'string') {
      const newBoard = board.map(p => {
        const parts = p.split(':');
        if (parts.length < 2) return p;
        const side = parts[0][0];
        let type = parts[0].substring(1);
        if (PIECE_MAP[type]) {
          type = PIECE_MAP[type];
          changed = true;
          return `${side}${type}:${parts[1]}`;
        }
        return p;
      });
      if (changed) board = newBoard;
    }

    let pieces = doc.pieces || [];
    if (Array.isArray(pieces)) {
      const newPieces = pieces.map(p => PIECE_MAP[p] || p);
      if (newPieces.join(',') !== pieces.join(',')) {
        pieces = newPieces;
        changed = true;
      }
    }

    if (changed) {
      await col.updateOne({ _id: doc._id }, { $set: { board, pieces } });
      updated++;
    }
  }

  logger.log(`--- COMPLETE ---`);
  logger.log(`Updated: ${updated}`);
  process.exit(0);
}

run().catch(err => {
  logger.error(err);
  process.exit(1);
});

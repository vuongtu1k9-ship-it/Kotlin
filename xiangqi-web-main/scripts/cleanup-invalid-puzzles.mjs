
import 'dotenv/config';
import { getDb, getPuzzlesCol } from '../server/mongo.mjs';
import { validateFen } from '../server/utils/positionValidator.mjs';
import { logger } from '../server/logger.mjs';

function flipFen(fen) {
    const parts = fen.split(' ');
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    const flippedRanks = [...ranks].reverse();
    parts[0] = flippedRanks.join('/');
    return parts.join(' ');
}

function flipBoard(board) {
    if (!Array.isArray(board)) return board;
    const newBoard = [...board].reverse();
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const p = newBoard[r][c];
            if (p && p.position) {
                p.position.row = r;
            }
        }
    }
    return newBoard;
}

async function cleanupAndFix() {
  const db = await getDb();
  const puzzlesCol = await getPuzzlesCol();

  const cursor = puzzlesCol.find({});
  let total = 0;
  let invalidCount = 0;
  let fixedCount = 0;
  let deletedCount = 0;

  logger.info('Starting invalid puzzles cleanup & fix (flipping)...');

  while (await cursor.hasNext()) {
    const puzzle = await cursor.next();
    total++;

    if (!puzzle.fen) {
      logger.warn(`Puzzle ${puzzle.uid || puzzle._id} has no FEN. Deleting.`);
      await puzzlesCol.deleteOne({ _id: puzzle._id });
      deletedCount++;
      continue;
    }

    const result = validateFen(puzzle.fen);
    if (!result.valid) {
      invalidCount++;
      
      // Try to fix by flipping
      const flippedFen = flipFen(puzzle.fen);
      const fixResult = validateFen(flippedFen);
      
      if (fixResult.valid) {
          logger.info(`Fixed Puzzle [${puzzle.uid}]: ${result.reason} -> Valid after flip.`);
          const updatedBoard = flipBoard(puzzle.board);
          await puzzlesCol.updateOne(
              { _id: puzzle._id },
              { $set: { fen: flippedFen, board: updatedBoard, updatedAt: Date.now(), fixedByFlipping: true } }
          );
          fixedCount++;
      } else {
          logger.info(`Invalid Puzzle [${puzzle.uid}]: ${result.reason} | Still invalid after flip: ${fixResult.reason}. Deleting.`);
          await puzzlesCol.deleteOne({ _id: puzzle._id });
          deletedCount++;
      }
    }
  }

  logger.info(`Process finished. Total: ${total}, Invalid: ${invalidCount}, Fixed: ${fixedCount}, Deleted: ${deletedCount}`);
  process.exit(0);
}

cleanupAndFix().catch(err => {
  logger.error('Cleanup and fix failed:', err);
  process.exit(1);
});


import 'dotenv/config';
import readline from 'readline';
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

// We also need to flip the 'board' array if we want to be consistent
function flipBoard(board) {
    if (!Array.isArray(board)) return board;
    const newBoard = [...board].reverse();
    // Update the row index in each piece object if it exists
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

async function runRecovery() {
    const puzzlesCol = await getPuzzlesCol();
    const rl = readline.createInterface({
        input: process.stdin,
        terminal: false
    });

    let processed = 0;
    let fixedCount = 0;
    let alreadyExists = 0;

    logger.info('Starting recovery and fix process from stdin (JSON per line)...');

    for await (const line of rl) {
        if (!line.trim()) continue;
        const puzzle = JSON.parse(line);
        processed++;

        // Check if it already exists in the current DB
        const existing = await puzzlesCol.findOne({ uid: puzzle.uid });
        if (existing) {
            alreadyExists++;
            continue;
        }

        // It was deleted. Try to fix it.
        const originalFen = puzzle.fen;
        if (!originalFen) continue;

        const flippedFen = flipFen(originalFen);
        const result = validateFen(flippedFen);

        if (result.valid) {
            // Fix the puzzle object
            puzzle.fen = flippedFen;
            puzzle.board = flipBoard(puzzle.board);
            puzzle.updatedAt = Date.now();
            puzzle.fixedByRecovery = true;
            
            // Note: _id might conflict if we use the same one, but since we deleted it, it should be fine.
            // However, it's safer to let MongoDB generate a new _id or use the old one if we are sure it's gone.
            // Since we checked it doesn't exist, we can use the old one.
            if (puzzle._id && puzzle._id.$oid) {
                puzzle._id = puzzle._id.$oid; // Convert from BSON dump format if needed
            }

            try {
                await puzzlesCol.insertOne(puzzle);
                fixedCount++;
                if (fixedCount % 100 === 0) logger.info(`Fixed ${fixedCount} puzzles so far...`);
            } catch (err) {
                logger.error(`Failed to insert fixed puzzle ${puzzle.uid}: ${err.message}`);
            }
        }
    }

    logger.info(`Recovery finished. Processed: ${processed}, Already Exists: ${alreadyExists}, Fixed & Re-inserted: ${fixedCount}`);
    process.exit(0);
}

runRecovery().catch(err => {
    logger.error('Recovery script failed:', err);
    process.exit(1);
});

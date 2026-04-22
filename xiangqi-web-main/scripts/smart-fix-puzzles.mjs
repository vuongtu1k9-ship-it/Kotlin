
import 'dotenv/config';
import { getPuzzlesCol } from '../server/mongo.mjs';
import { validateFen } from '../server/utils/positionValidator.mjs';
import { boardToFen } from '../server/fen.mjs';
import { logger } from '../server/logger.mjs';

function flipFenRows(fen) {
    const parts = fen.split(' ');
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    const flippedRanks = [...ranks].reverse();
    parts[0] = flippedRanks.join('/');
    return parts.join(' ');
}

function flipBoardRows(board) {
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

async function smartFix() {
    const puzzlesCol = await getPuzzlesCol();
    const cursor = puzzlesCol.find({});
    
    let total = 0;
    let fixed = 0;
    let deleted = 0;
    let valid = 0;

    logger.info('Starting Smart Fix process...');

    while (await cursor.hasNext()) {
        const puzzle = await cursor.next();
        total++;

        let currentFen = puzzle.fen;
        if (!currentFen && puzzle.board) {
            currentFen = boardToFen(puzzle.board, 'red'); // Default to red to move
            logger.info(`Generated missing FEN for [${puzzle.uid}]: ${currentFen}`);
        }

        if (!currentFen) {
            logger.warn(`Puzzle [${puzzle.uid}] has no FEN and no Board. Deleting.`);
            await puzzlesCol.deleteOne({ _id: puzzle._id });
            deleted++;
            continue;
        }

        const result = validateFen(currentFen);
        if (result.valid) {
            valid++;
            // Update if FEN was missing
            if (!puzzle.fen) {
                await puzzlesCol.updateOne({ _id: puzzle._id }, { $set: { fen: currentFen } });
            }
            continue;
        }

        // Try Flip
        const flippedFen = flipFenRows(currentFen);
        const flipResult = validateFen(flippedFen);
        if (flipResult.valid) {
            logger.info(`Fixed [${puzzle.uid}] via Flip. Original Error: ${result.reason}`);
            const updatedBoard = flipBoardRows(puzzle.board);
            await puzzlesCol.updateOne(
                { _id: puzzle._id },
                { $set: { fen: flippedFen, board: updatedBoard, updatedAt: Date.now(), fixedByFlipping: true } }
            );
            fixed++;
            continue;
        }

        // If still invalid, report and delete
        logger.error(`Puzzle [${puzzle.uid}] is IRREPARABLE: ${result.reason} | Flip Error: ${flipResult.reason}`);
        logger.error(`FEN: ${currentFen}`);
        await puzzlesCol.deleteOne({ _id: puzzle._id });
        deleted++;
    }

    logger.info(`Smart Fix Complete. Total: ${total}, Valid: ${valid}, Fixed: ${fixed}, Deleted: ${deleted}`);
    process.exit(0);
}

smartFix().catch(err => {
    logger.error('Smart Fix failed:', err);
    process.exit(1);
});

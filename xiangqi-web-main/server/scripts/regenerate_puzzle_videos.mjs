import { getPuzzlesCol, getPuzzleSolutionsCol } from '../mongo.mjs';
import { generateBoardVideo } from '../utils/videoGen.mjs';
import { getDataRoot } from '../utils/dataRoot.mjs';
import { logger } from '../logger.mjs';
import { boardToFen } from '../utils/fen.mjs';
import path from 'path';
import fs from 'fs';

async function run() {
    const puzzlesCol = await getPuzzlesCol();
    const solCol = await getPuzzleSolutionsCol();
    
    // 1. Get puzzles with moves field
    const puzzlesWithMoves = await puzzlesCol.find({ 
        moves: { $exists: true, $not: { $size: 0 } } 
    }).toArray();
    
    // 2. Get all solutions
    const solutions = await solCol.find({}).toArray();
    
    const tasks = [];
    
    for (const puzzle of puzzlesWithMoves) {
        tasks.push({
            id: puzzle.uid,
            initialFen: puzzle.fen || (puzzle.board ? boardToFen(puzzle.board, puzzle.sideToMove || 'red') : 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'),
            moves: puzzle.moves
        });
    }
    
    for (const sol of solutions) {
        if (!sol.moves || sol.moves.length === 0) continue;
        const puzzle = await puzzlesCol.findOne({ uid: sol.puzzleId });
        if (!puzzle) continue;
        
        tasks.push({
            id: `${puzzle.uid}-s0`, // Default to first solution for now
            initialFen: puzzle.fen || (puzzle.board ? boardToFen(puzzle.board, puzzle.sideToMove || 'red') : 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'),
            moves: sol.moves
        });
    }

    logger.info(`[REGEN] Total tasks to process: ${tasks.length}`);

    const videoDir = path.join(getDataRoot(), 'uploads', 'videos');
    if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
    }

    let count = 0;
    const concurrency = 3; // Keep it low to not kill the server
    
    for (let i = 0; i < tasks.length; i += concurrency) {
        const chunk = tasks.slice(i, i + concurrency);
        await Promise.all(chunk.map(async (task) => {
            try {
                const cacheKey = `puzzle-${task.id}-9x10-1280.mp4`;
                const videoPath = path.join(videoDir, cacheKey);

                logger.info(`[REGEN] Processing ${task.id}...`);
                await generateBoardVideo({ initialFen: task.initialFen, moves: task.moves }, videoPath, {
                    ratio: '9:10',
                    width: 1280,
                    fps: 0.5
                });
                
                count++;
                logger.info(`[REGEN] Progress: ${count}/${tasks.length}`);
            } catch (err) {
                logger.error(`[REGEN] Failed for task ${task.id}: ${err.message}`);
            }
        }));
    }

    logger.info(`[REGEN] Completed! Total regenerated: ${count}`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

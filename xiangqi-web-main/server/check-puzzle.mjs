import { getPuzzlesCol } from './mongo.mjs';
import { logger } from './logger.mjs';

async function test() {
  const col = await getPuzzlesCol();
  try {
    const puzzles = await col.find({ moves: { $exists: true, $not: { $size: 0 } } }).limit(5).toArray();
    console.log('Puzzles with moves:', puzzles.length);
    puzzles.forEach(p => console.log(` - ${p.uid}: ${p.moves.length} moves`));

    const puzzlesWithSols = await col.find({ solutions: { $exists: true, $not: { $size: 0 } } }).limit(5).toArray();
    console.log('Puzzles with solutions:', puzzlesWithSols.length);
    puzzlesWithSols.forEach(p => console.log(` - ${p.uid}: ${p.solutions.length} solutions`));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();

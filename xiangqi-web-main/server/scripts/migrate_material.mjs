import { getDb, getGamesCol, getPuzzlesCol } from '../mongo.mjs';
import { getMaterial } from '../moveLogic.mjs';
import { logger } from '../logger.mjs';

async function migrate() {
  const db = await getDb();
  
  console.log('--- Migrating Puzzles ---');
  const puzzlesCol = await getPuzzlesCol();
  // Find puzzles with missing material, empty material, 0 pieceCount but with a board, or missing counts
  const puzzles = await puzzlesCol.find({
    $or: [
      { material: { $exists: false } },
      { material: {} },
      { pieceCount: 0, board: { $exists: true, $not: { $size: 0 } } },
      { likeCount: { $exists: false } },
      { solveCount: { $exists: false } }
    ]
  }).toArray();
  console.log(`Found ${puzzles.length} puzzles to update.`);
  
  let pIdx = 0;
  for (const p of puzzles) {
    if (p.board) {
      const { counts, pieces, pieceCount } = getMaterial(p.board);
      const update = {
        $set: { material: counts, pieces, pieceCount }
      };
      if (p.likeCount === undefined) update.$set.likeCount = 0;
      if (p.solveCount === undefined) update.$set.solveCount = 0;
      
      await puzzlesCol.updateOne({ _id: p._id }, update);
    }
    pIdx++;
    if (pIdx % 1000 === 0) console.log(`Processed ${pIdx}/${puzzles.length} puzzles`);
  }

  console.log('--- Migrating Matches (Games) ---');
  const gamesCol = await getGamesCol();
  // Same for games
  const games = await gamesCol.find({
    $or: [
      { material: { $exists: false } },
      { material: {} },
      { pieceCount: 0, $or: [{ "state.board": { $exists: true } }, { thumbBoard: { $exists: true } }] }
    ]
  }).toArray();
  console.log(`Found ${games.length} games to update.`);

  let gIdx = 0;
  for (const g of games) {
    const board = g.state?.board || g.thumbBoard;
    if (board) {
      const { counts, pieces, pieceCount } = getMaterial(board);
      await gamesCol.updateOne(
        { _id: g._id },
        { $set: { material: counts, pieces, pieceCount } }
      );
    }
    gIdx++;
    if (gIdx % 1000 === 0) console.log(`Processed ${gIdx}/${games.length} games`);
  }

  console.log('Migration Complete.');
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});

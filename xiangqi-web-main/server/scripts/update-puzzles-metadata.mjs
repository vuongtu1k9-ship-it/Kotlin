import { getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function run() {
  const db = await getDb();
  const col = db.collection('puzzles');
  const puzzles = await col.find({}).toArray();
  let updated = 0;
  
  for (const p of puzzles) {
    if (!Array.isArray(p.board)) continue;
    let pieceCount = 0;
    const piecesSet = new Set();
    
    for (const entry of p.board) {
      if (typeof entry !== 'string' || entry.length === 0) continue;
      // Format: '{r|b}{type}:{rowcol}', e.g. 'rpawn:01', 'bking:04'
      const colonIdx = entry.indexOf(':');
      const withSide = colonIdx >= 0 ? entry.substring(0, colonIdx) : entry;
      if (withSide.length < 2) continue;
      const type = withSide.substring(1); // strip 'r' or 'b' prefix
      pieceCount++;
      piecesSet.add(type);
    }
    
    await col.updateOne({ _id: p._id }, {
      $set: {
        pieceCount,
        pieces: Array.from(piecesSet)
      }
    });
    updated++;
  }
  logger.log(`Updated metadata for ${updated} puzzles.`);
  process.exit(0);
}
run();

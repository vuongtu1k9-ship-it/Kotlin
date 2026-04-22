import { getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function run() {
  try {
    const db = await getDb();
    
    const gamesCol = db.collection('matches');
    const movesCol = db.collection('moves');
    const messagesCol = db.collection('messages');
    
    const cursor = gamesCol.find({});
    let migratedCount = 0;
    
    for await (const doc of cursor) {
      const oldId = doc._id;
      if (typeof oldId !== 'string') continue;
      
      const newId = oldId.toLowerCase();
      
      if (oldId !== newId) {
        // 1. Insert new game document with lowercase ID
        const newDoc = { ...doc, _id: newId };
        
        try {
          await gamesCol.insertOne(newDoc);
        } catch (e) {
          if (e.code === 11000) {
            // Already exists, maybe from a previous partial migration. We can safely overwrite or ignore.
            await gamesCol.replaceOne({ _id: newId }, newDoc);
          } else {
            throw e;
          }
        }
        
        // 2. Update moves pointing to this game
        await movesCol.updateMany(
          { gameId: oldId },
          { $set: { gameId: newId } }
        );
        
        // 3. Update messages (challenges) pointing to this game
        await messagesCol.updateMany(
          { "challengeConfig.roomId": oldId },
          { $set: { "challengeConfig.roomId": newId } }
        );
        
        // 4. Delete the old uppercase game document
        await gamesCol.deleteOne({ _id: oldId });
        
        migratedCount++;
      }
    }
    
    logger.log(`Successfully migrated ${migratedCount} games and their related records to lowercase IDs.`);
    
  } catch(e) {
    logger.error('Migration failed:', e);
  } finally {
    process.exit(0);
  }
}

run();

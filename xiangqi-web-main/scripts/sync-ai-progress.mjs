
import 'dotenv/config';
import { getDb, getPuzzlesCol } from '../server/mongo.mjs';
import { logger } from '../server/logger.mjs';

async function sync() {
    const db = await getDb();
    const col = await getPuzzlesCol();
    
    // The query the worker uses
    const query = { 
        'importedFrom.legacy13CharId': { $exists: true },
        name: { $not: /AI Master/ } 
    };
    
    // Wait, the worker query is:
    // name: { $not: /AI Master/ } 
    // And it sets name to result.title + ' [AI Master]'
    
    const total = await col.countDocuments({ 'importedFrom.legacy13CharId': { $exists: true } });
    const processed = await col.countDocuments({ 
        'importedFrom.legacy13CharId': { $exists: true },
        name: /\[AI Master\]/ 
    });

    console.log(`Actual Total for SEO task: ${total}`);
    console.log(`Actual Processed: ${processed}`);

    await db.collection('ai_tasks').updateOne(
        { id: 'puzzles_seo_v3' }, 
        { $set: { total, processed, lastUpdated: Date.now() } }
    );

    console.log("AI Worker Progress SYNCED to database state.");
    process.exit(0);
}

sync().catch(err => {
    console.error(err);
    process.exit(1);
});

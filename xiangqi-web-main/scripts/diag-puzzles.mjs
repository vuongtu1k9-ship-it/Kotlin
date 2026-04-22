
import 'dotenv/config';
import { getPuzzlesCol } from '../server/mongo.mjs';

async function test() {
    const col = await getPuzzlesCol();
    const count = await col.countDocuments({});
    console.log(`Total count: ${count}`);
    
    // Test the specific empty filter
    const docs = await col.find({}).limit(10).toArray();
    console.log(`Limit 10 count: ${docs.length}`);
    
    // Test with source filters
    const importCount = await col.countDocuments({ createdByUid: 'import' });
    console.log(`Import count: ${importCount}`);
    
    const userCount = await col.countDocuments({ createdByUid: { $ne: 'import' } });
    console.log(`User count: ${userCount}`);
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

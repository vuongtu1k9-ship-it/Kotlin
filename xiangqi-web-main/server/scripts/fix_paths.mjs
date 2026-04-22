import { getDb } from './server/mongo.mjs';
import { logger } from './server/logger.mjs';

async function run() {
  const db = await getDb();
  const col = db.collection('tournaments');
  const items = await col.find({ description: /src="uploads\// }).toArray();
  logger.log(`Found ${items.length} items to fix`);
  
  for (const t of items) {
    const fixed = t.description.replace(/src="uploads\//g, 'src="/uploads/');
    await col.updateOne({ _id: t._id }, { $set: { description: fixed } });
    logger.log(`Fixed tournament: ${t._id}`);
  }
  process.exit(0);
}

run().catch(err => {
  logger.error(err);
  process.exit(1);
});

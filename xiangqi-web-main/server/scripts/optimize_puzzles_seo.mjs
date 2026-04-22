import { getDb } from '../mongo.mjs';

async function run() {
  const db = await getDb();
  const col = db.collection('puzzles');

  console.log('Starting puzzle SEO optimization...');

  const query = {
    'importedFrom.legacy13CharId': { $exists: true },
    $or: [
      { description: null },
      { description: '' },
      { name: { $regex: '^[0-9]+$' } }
    ]
  };

  const cursor = col.find(query);
  let count = 0;
  const batchSize = 1000;
  let bulkOps = [];

  while (await cursor.hasNext()) {
    const puzzle = await cursor.next();
    const oldName = puzzle.name || 'hay';
    let newName = oldName;
    if (/^[0-9]+$/.test(oldName)) {
      newName = `Thế cờ ${oldName}`;
    }

    const newDescription = `Giải thế cờ tướng hay mã số ${oldName}. Tập luyện sát pháp, tàn cuộc và học cách phá cờ thế giang hồ miễn phí, không quảng cáo tại cotuong.xyz. Có AI Pikafish hỗ trợ giải mã.`;

    bulkOps.push({
      updateOne: {
        filter: { _id: puzzle._id },
        update: {
          $set: {
            name: newName,
            description: newDescription,
            tags: ['cờ thế', 'giải cờ thế', 'cờ tướng online', 'không quảng cáo']
          }
        }
      }
    });

    if (bulkOps.length >= batchSize) {
      await col.bulkWrite(bulkOps);
      count += bulkOps.length;
      console.log(`Updated ${count} puzzles...`);
      bulkOps = [];
    }
  }

  if (bulkOps.length > 0) {
    await col.bulkWrite(bulkOps);
    count += bulkOps.length;
  }

  console.log(`Finished! Total optimized: ${count}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

import { getDb } from '../server/mongo.mjs';

async function findVideoIds() {
  const db = await getDb();
  const collections = await db.listCollections().toArray();
  const ids = [];

  for (const colInfo of collections) {
    const col = db.collection(colInfo.name);
    const docs = await col.find({
      $or: [
        { 'social_posted.youtube': { $exists: true } },
        { 'results.youtube': { $exists: true } },
        { 'social_posted.postedAt': { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 } } // Last 7 days
      ]
    }).toArray();

    for (const doc of docs) {
      if (doc.results?.youtube) ids.push(doc.results.youtube);
      if (doc.social_posted?.youtube) ids.push(doc.social_posted.youtube);
      // Log for debugging
      console.log(`Found in ${colInfo.name}:`, doc.uid || doc._id, doc.results?.youtube || doc.social_posted?.youtube);
    }
  }

  console.log('Unique IDs:', [...new Set(ids)]);
}

findVideoIds();

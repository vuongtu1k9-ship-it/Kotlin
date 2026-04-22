import { MongoClient, ObjectId } from 'mongodb';
import { logger } from '../logger.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiangqi';
const DB_NAME = MONGODB_URI.split('/').pop().split('?')[0] || 'xiangqi';

function generateShortId(length = 5) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    logger.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const col = db.collection('puzzles');

    const total = await col.countDocuments({ uid: { $exists: false } });
    logger.log(`Found ${total} puzzles without UID`);

    if (total === 0) {
      logger.log('Nothing to do.');
      return;
    }

    // Get all existing uids to prevent collisions in this run
    const existingUids = new Set(
      (await col.find({ uid: { $exists: true } }).project({ uid: 1 }).toArray()).map(d => d.uid)
    );

    const cursor = col.find({ uid: { $exists: false } }).project({ _id: 1 });
    let batch = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      
      let uid = generateShortId(5);
      while (existingUids.has(uid)) {
        uid = generateShortId(5);
      }
      existingUids.add(uid);

      batch.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { uid } }
        }
      });

      if (batch.length >= 1000) {
        await col.bulkWrite(batch);
        count += batch.length;
        logger.log(`Updated ${count}/${total}...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await col.bulkWrite(batch);
      count += batch.length;
      logger.log(`Updated ${count}/${total}. Done.`);
    }

    // Ensure index on uid
    logger.log('Creating unique index on uid...');
    await col.createIndex({ uid: 1 }, { unique: true, sparse: true });
    logger.log('Index created.');

  } catch (e) {
    logger.error('Migration failed', e);
  } finally {
    await client.close();
  }
}

run();

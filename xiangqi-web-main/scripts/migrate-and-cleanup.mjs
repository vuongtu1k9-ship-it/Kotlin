import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';
const DATA_PATH = '/data/xiangqi/config.json';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(MONGO_DB);
    const col = db.collection('site_config');
    
    const configs = await col.find({}).toArray();
    console.log(`[Migration] Found ${configs.length} items in MongoDB.`);

    let currentConfig = {};
    try {
      const existing = await fs.readFile(DATA_PATH, 'utf8');
      currentConfig = JSON.parse(existing);
    } catch (e) {
      console.log('[Migration] Creating new config.json');
    }

    // Merge logic
    for (const doc of configs) {
      const { _id, value } = doc;
      if (_id && value !== undefined) {
        currentConfig[_id] = value;
        console.log(`   -> Migrated key: ${_id}`);
      }
    }

    // Ensure directory and write file
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(currentConfig, null, 2), 'utf8');
    console.log(`[Migration] Successfully saved to ${DATA_PATH}`);

    // Cleanup
    console.log('[Cleanup] Dropping site_config collection...');
    await col.drop();
    console.log('[Cleanup] Done.');

  } catch (err) {
    console.error('[Critical] Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();

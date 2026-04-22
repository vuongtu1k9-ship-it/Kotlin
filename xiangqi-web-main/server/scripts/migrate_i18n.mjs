import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

const client = new MongoClient(MONGO_URL);

// Common translations for migration
const TRANSLATIONS = {
  // Categories
  'Cơ bản': 'Basics',
  'Khai cuộc': 'Opening',
  'Trung cuộc': 'Midgame',
  'Tàn cuộc': 'Endgame',
  'Cờ Thế': 'Puzzles',
  'Trận đấu': 'Matches',
  // Difficulty
  'Dễ': 'Easy',
  'Trung bình': 'Medium',
  'Khó': 'Hard',
  'Rất Khó': 'Expert',
};

function translate(text) {
  if (!text) return text;
  if (TRANSLATIONS[text]) return TRANSLATIONS[text];
  
  // Basic heuristic for unknown strings: 
  // In a real scenario, we might use an API. 
  // For this migration script, if it's not in TRANSLATIONS, 
  // we can use the original text or a placeholder.
  return text; 
}

async function migrateCollection(db, collectionName, fields) {
  console.log(`\n📦 Migrating collection: ${collectionName}...`);
  const col = db.collection(collectionName);
  const cursor = col.find({});
  
  let count = 0;
  for await (const doc of cursor) {
    const update = {};
    let needsUpdate = false;

    for (const field of fields) {
      const val = doc[field];
      if (val && typeof val === 'string') {
        update[field] = {
          en: translate(val),
          vi: val
        };
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      count++;
    }
  }
  console.log(`  ✓ Updated ${count} documents in ${collectionName}`);
}

async function run() {
  try {
    await client.connect();
    const db = client.db(MONGO_DB);

    console.log('🚀 Starting i18n Migration...');

    // 1. Practice Categories
    await migrateCollection(db, 'practice_categories', ['name']);

    // 2. Gifts
    await migrateCollection(db, 'gifts', ['name', 'desc']);

    // 3. Puzzles
    // Note: puzzles might have many documents, so this might take a moment
    await migrateCollection(db, 'puzzles', ['name', 'hint']);

    // 4. Practice Lessons
    // Lessons have content which is HTML. Translation here is trickier.
    // For now, we'll shift the structure.
    await migrateCollection(db, 'practice_lessons', ['title', 'description', 'content', 'difficulty']);

    console.log('\n✨ Migration Complete!');
  } catch (err) {
    console.error('💥 Migration Failed:', err);
  } finally {
    await client.close();
  }
}

run();

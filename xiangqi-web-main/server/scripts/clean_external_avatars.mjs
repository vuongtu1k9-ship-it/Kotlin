
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/xiangqi';
const DB_NAME =  'xiangqi';

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(DB_NAME);

    const externalPatterns = [
      /dicebear\.com/,
      /ui-avatars\.com/,
      /pravatar\.cc/
    ];

    const filter = {
      $or: [
        { avatar: { $in: externalPatterns } },
        { picture: { $in: externalPatterns } }
      ]
    };

    // 1. Clean Bots
    console.log('🧹 Cleaning Bots collection...');
    const botsCol = db.collection('bots');
    const botResult = await botsCol.updateMany(
      { avatar: { $in: externalPatterns } },
      { $set: { avatar: null, updatedAt: new Date() } }
    );
    console.log(`✨ Modified ${botResult.modifiedCount} bots.`);

    // 2. Clean Users (including bots mirrored in users)
    console.log('🧹 Cleaning Users collection...');
    const usersCol = db.collection('users');
    const userResult = await usersCol.updateMany(
      { picture: { $in: externalPatterns } },
      { $set: { picture: null, updatedAt: Date.now() } }
    );
    console.log(`✨ Modified ${userResult.modifiedCount} users.`);

    console.log('🚀 Database sanitization complete. Standardizing on internal avatars.');

  } catch (e) {
    console.error('❌ Sanitization failed:', e);
  } finally {
    await client.close();
  }
}

run();

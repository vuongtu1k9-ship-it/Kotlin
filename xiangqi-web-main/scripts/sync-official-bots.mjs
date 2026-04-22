import fs from 'fs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'xiangqi';

const BOTS_PATH = path.join(__dirname, '..', 'bots.json');
const BOTS = JSON.parse(fs.readFileSync(BOTS_PATH, 'utf8'));

async function sync() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCol = db.collection('users');
    const botsCol = db.collection('bots');

    console.log('--- 🤖 SYNCING OFFICIAL BOTS ---');
    
    // 1. Clear bots collection to remove stale entries
    await botsCol.deleteMany({});
    
    for (const bData of BOTS) {
      const { name, uid, level, personality, engineOptions } = bData;
      const email = bData.email || `bot-${uid}@cotuong.xyz`;

      // A. Ensure User record exists
      const existingUser = await usersCol.findOne({ uid });
      if (!existingUser) {
        await usersCol.insertOne({
          uid, name, email,
          provider: 'system',
          elo: 1200,
          isBot: true,
          role: 'bot',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created User Record: ${name} (${uid})`);
      }

      // B. Insert Bot record
      await botsCol.insertOne({
        uid, name, email, level, personality, engineOptions,
        status: 'stopped',
        isBot: true,
        role: 'bot',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Synced Bot Record: ${name} (${uid})`);
    }

    console.log('\n--- 🏁 Sync Complete ---');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

sync();

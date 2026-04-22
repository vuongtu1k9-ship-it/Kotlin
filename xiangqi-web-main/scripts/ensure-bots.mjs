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

async function ensureBots() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCol = db.collection('users');

    console.log('--- 🤖 ENSURING BOT USERS EXIST ---');
    
    for (const bot of BOTS) {
      const existing = await usersCol.findOne({ uid: bot.uid });
      if (!existing) {
        await usersCol.insertOne({
          uid: bot.uid,
          name: bot.name,
          email: `bot-${bot.uid}@cotuong.xyz`,
          provider: 'google',
          elo: 1000 + (bot.level * 200),
          isBot: true,
          sysRole: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created bot: ${bot.name} (${bot.uid})`);
      } else {
        console.log(`ℹ️ Bot exists: ${bot.name} (${bot.uid})`);
      }
    }

    console.log('🏁 Done.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

ensureBots();

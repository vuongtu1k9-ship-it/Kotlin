import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'xiangqi';

async function checkBots() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const botsCol = db.collection('bots');

    const bots = await botsCol.find({ personality: { $in: ['steady', 'aggressive', 'defensive'] } }).toArray();
    for (const bot of bots) {
        console.log(`Bot: ${bot.name} | Personality: ${bot.personality} | engineOptions: ${JSON.stringify(bot.engineOptions)}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

checkBots();

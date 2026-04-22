import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'xiangqi';

async function stopAllBots() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const botsCol = db.collection('bots');

    console.log('--- 🤖 XIANGQI BOT KILLER ---');
    
    // Update all bots to 'stopped' status
    const result = await botsCol.updateMany(
      { status: { $ne: 'stopped' } },
      { $set: { status: 'stopped', updatedAt: new Date(), lastStatusChange: new Date() } }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} bots to "stopped" status.`);
    console.log('🚀 Next: Restarting backend to kill active child processes...');

  } catch (err) {
    console.error('❌ Error stopping bots:', err.message);
  } finally {
    await client.close();
  }
}

stopAllBots();

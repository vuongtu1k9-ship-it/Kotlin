import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'xiangqi';

async function reinitializeBotOptions() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const botsCol = db.collection('bots');

    const bots = await botsCol.find({}).toArray();
    console.log(`🤖 Processing ${bots.length} bots for engineOptions update...`);

    const personalityMap = { 
      aggressive: { contempt: 55, slowMover: 65, multiPV: 1 }, 
      defensive: { contempt: -60, slowMover: 160, multiPV: 1 }, 
      chaotic: { contempt: 25, slowMover: 90, multiPV: 3 }, // Highly unpredictable
      steady: { contempt: 15, slowMover: 130, multiPV: 1 }, 
      balanced: { contempt: 0, slowMover: 100, multiPV: 1 },
      calculating: { contempt: 5, slowMover: 200, multiPV: 2 } // New personality type for some
    };

    for (const bot of bots) {
      const p = personalityMap[bot.personality] || personalityMap.balanced;
      
      // Map Level to Skill Level (0-20)
      const skillMap = [0, 0, 4, 8, 12, 16, 20];
      const skillLevel = (bot.level >= 0 && bot.level < skillMap.length) ? skillMap[bot.level] : 10;

      const engineOptions = {
        skillLevel,
        contempt: p.contempt,
        slowMover: p.slowMover,
        multiPV: p.multiPV,
        extraOptions: {
          "Hash": 64,
          "Threads": 1
        }
      };

      // Add special tweaks for specific bots if desired
      if (bot.name === 'Lính Chì') {
        engineOptions.skillLevel = 20;
        engineOptions.multiPV = 1; // Pure strength
      }
      if (bot.name === 'Tiểu Ma Đầu') {
        engineOptions.contempt = 100;
        engineOptions.slowMover = 40;
      }

      await botsCol.updateOne(
        { _id: bot._id },
        { $set: { engineOptions, updatedAt: new Date() } }
      );
      console.log(`✅ Updated ${bot.name} (${bot.personality}): Skill=${engineOptions.skillLevel}, Cont=${engineOptions.contempt}`);
    }

    console.log('🏁 All bots have been updated with explicit engineOptions.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

reinitializeBotOptions();

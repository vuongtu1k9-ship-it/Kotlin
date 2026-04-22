import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'xiangqi';

async function injectEngineOptions() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const botsCol = db.collection('bots');

    // Example 1: Tiểu Ma Đầu (Aggressive) - Fine tune Contempt and Slow Mover
    await botsCol.updateOne(
      { personality: 'aggressive' },
      { 
        $set: { 
          engineOptions: { 
            contempt: 80, 
            slowMover: 60,
            multiPV: 2
          } 
        } 
      }
    );

    // Example 2: Mộc Miên (Defensive)
    await botsCol.updateOne(
      { personality: 'defensive' },
      { 
        $set: { 
          engineOptions: { 
            contempt: -80, 
            slowMover: 180 
          } 
        } 
      }
    );

    // Example 3: Lính Chì (Master/Steady)
    await botsCol.updateOne(
      { personality: 'steady' },
      { 
        $set: { 
          engineOptions: { 
            skillLevel: 20,
            contempt: 20, 
            slowMover: 130 
          } 
        } 
      }
    );

    console.log('✅ Injected engineOptions into bots collection.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

injectEngineOptions();

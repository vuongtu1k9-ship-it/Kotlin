import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { getGiftsCol, closeDb } from '../mongo.mjs';

const INITIAL_GIFTS = [
  { id: 'ring', name: 'Nhẫn Kim Cương', price: 100, icon: '💍', desc: 'Biểu tượng của sự vĩnh cửu và sang trọng.' },
  { id: 'bear', name: 'Gấu Bông', price: 50, icon: '🧸', desc: 'Món quà ấm áp cho những người bạn thân thiết.' },
  { id: 'candy', name: 'Kẹo Ngọt', price: 10, icon: '🍬', desc: 'Một chút ngọt ngào cho ngày thêm vui.' },
];

async function seed() {
  try {
    const gifts = await getGiftsCol();
    for (const item of INITIAL_GIFTS) {
      await gifts.updateOne(
        { id: item.id },
        { $set: { ...item, updatedAt: Date.now() } },
        { upsert: true }
      );
      console.log(`Seeded/Updated gift: ${item.name}`);
    }
    console.log('Seed completed successfully!');
  } catch (e) {
    console.error('Seed failed:', e);
  } finally {
    await closeDb();
  }
}

seed();

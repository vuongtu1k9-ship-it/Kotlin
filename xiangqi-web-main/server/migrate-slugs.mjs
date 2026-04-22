import 'dotenv/config';
import { getUsersCol, closeDb } from './mongo.mjs';

function toSlug(str) {
  if (!str) return 'user';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // collapse hyphens
}

async function run() {
  try {
    const users = await getUsersCol();
    const cursor = users.find({ slug: { $exists: false } });
    
    let count = 0;
    while (await cursor.hasNext()) {
      const u = await cursor.next();
      const slug = toSlug(u.name || 'User');
      await users.updateOne({ _id: u._id }, { $set: { slug } });
      console.log(`Updated user ${u.uid} (${u.name}) with slug: ${slug}`);
      count++;
    }
    
    console.log(`Migration complete. Updated ${count} users.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await closeDb();
  }
}

run();

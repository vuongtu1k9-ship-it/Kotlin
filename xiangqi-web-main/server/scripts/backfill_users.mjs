import { getUsersCol, ensureIndexes } from './server/mongo.mjs';
import { logger } from './server/logger.mjs';
import crypto from 'crypto';

function toSlug(str) {
  if (!str) return 'user';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function makeUid() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function backfill() {
  try {
    logger.log('Ensuring indexes...');
    await ensureIndexes();
    
    const users = await getUsersCol();
    const all = await users.find({ uid: { $exists: false } }).toArray();
    logger.log(`Backfilling ${all.length} users...`);

    for (const u of all) {
      const name = u.name || 'User';
      const slug = toSlug(name);
      const uid = makeUid();
      
      await users.updateOne(
        { _id: u._id },
        { $set: { uid, slug } }
      );
      logger.log(`Updated ${u.sub} -> ${slug}-${uid}`);
    }

    logger.log('Done!');
    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

backfill();

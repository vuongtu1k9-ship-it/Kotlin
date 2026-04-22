import { getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function run() {
  try {
    const db = await getDb();
    
    // Lowercase all uids in the users collection
    const users = db.collection('users');
    const result = await users.updateMany(
      { uid: { $type: "string" } },
      [{ $set: { uid: { $toLower: "$uid" } } }]
    );
    logger.log(`Updated ${result.modifiedCount} users to lowercase uid.`);
    
  } catch(e) {
    logger.error(e);
  } finally {
    process.exit(0);
  }
}

run();

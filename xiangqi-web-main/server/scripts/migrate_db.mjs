import { getDb } from './server/mongo.mjs';
import { logger } from './server/logger.mjs';

async function migrate() {
  const db = await getDb();
  
  const rename = async (oldName, newName) => {
    const cols = await db.listCollections({ name: oldName }).toArray();
    if (cols.length > 0) {
      logger.log(`Renaming ${oldName} to ${newName}...`);
      await db.collection(oldName).rename(newName);
    } else {
      logger.log(`Collection ${oldName} not found, skipping rename.`);
    }
  };

  const drop = async (name) => {
    const cols = await db.listCollections({ name }).toArray();
    if (cols.length > 0) {
      logger.log(`Dropping collection ${name}...`);
      await db.collection(name).drop();
    } else {
      logger.log(`Collection ${name} not found, skipping drop.`);
    }
  };

  try {
    // 1. Renames
    await rename('games', 'matches');
    await rename('setups', 'puzzles');
    await rename('legacy_board_cat', 'puzzle_categories');

    // 2. Drops
    await drop('rooms');
    await drop('legacy_chess_table');
    await drop('legacy_chess_user');
    await drop('legacy_chess_puzzle');

    logger.log('Migration completed successfully!');
    process.exit(0);
  } catch (e) {
    logger.error('Migration failed:', e);
    process.exit(1);
  }
}

migrate();

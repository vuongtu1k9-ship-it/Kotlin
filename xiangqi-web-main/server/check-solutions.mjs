import { getPuzzleSolutionsCol } from './mongo.mjs';
import { logger } from './logger.mjs';

async function test() {
  const col = await getPuzzleSolutionsCol();
  try {
    const sol = await col.findOne({});
    console.log('Sample solution:', JSON.stringify(sol, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();

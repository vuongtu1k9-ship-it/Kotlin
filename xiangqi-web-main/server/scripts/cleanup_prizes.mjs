import { getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function run() {
  try {
    const db = await getDb();
    const col = db.collection('tournaments');
    
    logger.info('Starting cleanup of tournament prizes (removing "value" field)...');
    
    // Using $unset to remove the 'value' field from each element in the 'prizes' array
    // This requires MongoDB 4.2+ for the aggregation pipeline in updateOne/updateMany
    const result = await col.updateMany(
      {},
      [
        {
          $set: {
            prizes: {
              $map: {
                input: '$prizes',
                as: 'prize',
                in: {
                  $arrayToObject: {
                    $filter: {
                      input: { $objectToArray: '$$prize' },
                      as: 'kv',
                      cond: { $ne: ['$$kv.k', 'value'] }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    );

    logger.info(`Cleanup finished. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    process.exit(0);
  } catch (e) {
    logger.error('Cleanup failed', e);
    process.exit(1);
  }
}

run();

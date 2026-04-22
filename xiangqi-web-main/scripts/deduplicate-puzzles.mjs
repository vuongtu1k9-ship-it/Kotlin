
import 'dotenv/config';
import { getPuzzlesCol } from '../server/mongo.mjs';
import { logger } from '../server/logger.mjs';
import { clearPuzzleCache } from '../server/services/cache.mjs';

async function deduplicate() {
    const col = await getPuzzlesCol();
    
    logger.info('Starting deduplication process...');
    
    // Aggregation to find duplicates
    // We group by the first two parts of the FEN (board and side to move)
    const pipeline = [
        {
            $project: {
                fenBase: {
                    $reduce: {
                        input: { $slice: [{ $split: ["$fen", " "] }, 0, 2] },
                        initialValue: "",
                        in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", ""] }, "", " "] }, "$$this"] }
                    }
                },
                uid: 1,
                solveCount: 1,
                likeCount: 1,
                createdAt: 1
            }
        },
        {
            $group: {
                _id: "$fenBase",
                count: { $sum: 1 },
                ids: { $push: "$_id" },
                uids: { $push: "$uid" },
                puzzles: { $push: "$$ROOT" }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ];

    const duplicateGroups = await col.aggregate(pipeline).toArray();
    logger.info(`Found ${duplicateGroups.length} FEN positions with duplicates.`);

    let totalDeleted = 0;

    for (const group of duplicateGroups) {
        // Sort puzzles by quality/seniority
        // Criteria: most solves, then most likes, then oldest (createdAt)
        const sorted = group.puzzles.sort((a, b) => {
            if ((b.solveCount || 0) !== (a.solveCount || 0)) return (b.solveCount || 0) - (a.solveCount || 0);
            if ((b.likeCount || 0) !== (a.likeCount || 0)) return (b.likeCount || 0) - (a.likeCount || 0);
            return (a.createdAt || 0) - (b.createdAt || 0);
        });

        const keep = sorted[0];
        const toDelete = sorted.slice(1);

        logger.info(`FEN [${group._id}]: Keeping ${keep.uid}, deleting ${toDelete.length} duplicates (${toDelete.map(p => p.uid).join(', ')})`);

        const deleteIds = toDelete.map(p => p._id);
        const res = await col.deleteMany({ _id: { $in: deleteIds } });
        totalDeleted += res.deletedCount;
    }

    logger.info(`Deduplication complete. Total duplicates removed: ${totalDeleted}`);
    if (totalDeleted > 0) await clearPuzzleCache();
    process.exit(0);
}

deduplicate().catch(err => {
    logger.error('Deduplication failed:', err);
    process.exit(1);
});

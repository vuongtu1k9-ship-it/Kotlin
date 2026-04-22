import express from 'express';
import { getBotsCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';

const router = express.Router();

// Public endpoint to fetch bots for Single Player modes natively
router.get('/bots/active', async (req, res) => {
  try {
    const botsCol = await getBotsCol();
    
    // Aggregate to join with users collection to get real Elo and other stats
    const bots = await botsCol.aggregate([
      // No status filter for public selection - all bots should be available as AI levels
      {
        $lookup: {
          from: 'users',
          localField: 'uid',
          foreignField: 'uid',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          uid: 1,
          name: 1,
          level: 1,
          personality: 1,
          status: 1,
          avatar: 1,
          // Use user record Elo if available, fallback to 1200 as requested
          elo: { $ifNull: ['$userDetails.elo', 1200] },
          gamesPlayed: { $ifNull: ['$userDetails.gamesPlayed', 0] },
          inventory: '$userDetails.inventory'
        }
      },
      { 
        $sort: { level: 1 } 
      }
    ]).toArray();

    return res.json({ ok: true, bots });
  } catch (err) {
    logger.error('[API] /bots/active fetch failed:', err);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_FETCH_BOTS' });
  }
});

export default router;

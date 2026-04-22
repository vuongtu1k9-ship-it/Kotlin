import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb, getPuzzlesCol, getPuzzleSolutionsCol, getUsersCol } from '../../mongo.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { clearUserCache } from '../../services/cache.mjs';
import { getRealIp } from '../../utils/ip.mjs';
import { resolvePuzzle } from '../../utils/puzzleHelpers.mjs';

const router = express.Router();

// GET MY LIKES
router.get('/setups/likes/mine', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const db = await getDb();
    const likesCol = db.collection('puzzle_likes');
    const docs = await likesCol.find({ uid: String(user.uid) }).toArray();
    
    return res.json({
      ok: true,
      likes: docs.map(d => String(d.puzzleId))
    });
  } catch (e) {
    logger.error('GET /setups/likes/mine failed', e);
    return res.status(500).json({ ok: false, error: 'GET_LIKES_FAILED' });
  }
});

// TOGGLE LIKE
router.post('/setups/like/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const id = String(req.params.id);
    const uid = String(user.uid);
    const db = await getDb();
    const likesCol = db.collection('puzzle_likes');
    const puzzlesCol = await getPuzzlesCol();

    const puzzle = await resolvePuzzle(id);
    
    if (!puzzle) {
      logger.warn(`POST /setups/like/${id} - Puzzle not found`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    const existing = await likesCol.findOne({ uid, puzzleId: id });
    let liked = false;
    let newCount = puzzle.likeCount || 0;

    if (existing) {
      await likesCol.deleteOne({ _id: existing._id });
      newCount = Math.max(0, newCount - 1);
      await puzzlesCol.updateOne({ uid: id }, { $set: { likeCount: newCount } });
    } else {
      await likesCol.insertOne({ uid, puzzleId: id, likedAt: Date.now() });
      newCount += 1;
      await puzzlesCol.updateOne({ uid: id }, { $set: { likeCount: newCount } });
      liked = true;
    }

    const { clearPuzzleCache } = await import('../../services/cache.mjs');
    await clearPuzzleCache();

    return res.json({ ok: true, liked, likeCount: newCount });
  } catch (e) {
    logger.error('POST /setups/like/:id failed', e);
    return res.status(500).json({ ok: false, error: 'TOGGLE_LIKE_FAILED' });
  }
});

// GET /setups/public/:id/comments
router.get('/public/:id/comments', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'BAD_ID' });

    const db = await getDb();
    const col = db.collection('puzzleComments');
    const comments = await col
      .find({ puzzleId: id })
      .sort({ createdAt: 1 })
      .limit(500)
      .toArray();
      
    return res.json({ ok: true, comments });
  } catch (e) {
    logger.error('GET /setups/public/:id/comments failed', e);
    return res.status(500).json({ ok: false, error: 'COMMENTS_FAILED' });
  }
});

// POST /setups/public/:id/comments
router.post('/public/:id/comments', async (req, res) => {
  try {
    const user = await requireUser(req);
    if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    
    const id = String(req.params.id || '').trim();
    const text = String(req.body?.text || '').trim().slice(0, 2000);
    if (!text) return res.status(400).json({ ok: false, error: 'TEXT_REQUIRED' });

    const puzzle = await resolvePuzzle(id);
    if (!puzzle) {
      logger.warn(`POST /setups/public/${id}/comments - Puzzle not found`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    const db = await getDb();
    const col = db.collection('puzzleComments');
    const comment = {
      puzzleId: id,
      uid: user.uid,
      name: user.name || 'Ẩn danh',
      picture: user.picture || null,
      text,
      createdAt: Date.now(),
    };
    
    const result = await col.insertOne(comment);
    const newComment = { ...comment, _id: result.insertedId };
    
    const { getIo } = await import('../../socket/presence.mjs');
    const io = getIo();
    if (io) {
      io.to(id).emit('puzzle_comment', { puzzleId: id, comment: newComment });
    }
    
    return res.json({ ok: true, comment: newComment });
  } catch (e) {
    logger.error('POST /setups/public/:id/comments failed', e);
    return res.status(500).json({ ok: false, error: 'COMMENT_FAILED' });
  }
});

router.post('/setups/:id/solutions', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const puzzleId = req.params.id;
    const { moves, side } = req.body || {};
    if (!Array.isArray(moves) || moves.length === 0) {
      return res.status(400).json({ ok: false, error: 'MOVES_REQUIRED' });
    }

    const solutionsCol = await getPuzzleSolutionsCol();
    logger.info(`[solutions] Incoming submission for puzzle: ${puzzleId} from user: ${user.uid} (side: ${side})`);
    
    const existing = await solutionsCol.findOne({ puzzleId, userId: user.uid });
    
    let rewardedCoins = 0;
    if (!existing) {
      const puzzle = await resolvePuzzle(puzzleId);
      if (puzzle) {
        rewardedCoins = (puzzle.level || 1) * 10 + 10;
        const { getUsersCol } = await import('../../mongo.mjs');
        const usersCol = await getUsersCol();
        await usersCol.updateOne(
          { uid: user.uid },
          { $inc: { 'inventory.coins': rewardedCoins } }
        );
        await clearUserCache(user.uid);
      } else {
        logger.warn(`[solutions] Puzzle not found: ${puzzleId}`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
        return res.status(404).json({ ok: false, error: 'PUZZLE_NOT_FOUND' });
      }
    }

    await solutionsCol.updateOne(
      { puzzleId, userId: user.uid },
      {
        $set: {
          puzzleId,
          userId: user.uid,
          userName: user.name || 'Người dùng',
          userPicture: user.picture || null,
          moves,
          moveCount: moves.length,
          side: side || 'red',
          updatedAt: new Date(),
          rewardedCoins: existing ? existing.rewardedCoins : rewardedCoins
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    return res.json({ ok: true, rewardedCoins });
  } catch (err) {
    logger.error(`[solutions] POST /setups/${req.params.id}/solutions failed:`, err);
    res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

router.get('/setups/:id/solutions', async (req, res) => {
  try {
    const puzzleId = req.params.id;
    const solutionsCol = await getPuzzleSolutionsCol();
    const list = await solutionsCol.find({ puzzleId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    res.json({ ok: true, solutions: list });
  } catch (err) {
    logger.error('Error fetching solutions:', err);
    res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

export default router;

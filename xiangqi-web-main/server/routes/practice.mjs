import express from 'express';
import { logger } from '../logger.mjs';
import { getUsersCol, getPracticeLessonsCol } from '../mongo.mjs';
import { requireUser } from '../utils/auth.mjs';
import { redisClient } from '../services/cache.mjs';
import { getLocalized } from '../utils/i18n.mjs';

const router = express.Router();

/**
 * Note: Initial lessons are now stored in MongoDB.
 * For new installations, use a separate seeding script or the Admin Panel.
 */

// GET /api/practice/categories
router.get('/categories', async (req, res) => {
  try {
    const { getPracticeCategoriesCol } = await import('../mongo.mjs');
    const col = await getPracticeCategoriesCol();
    const categories = await col.find({}).sort({ name: 1 }).toArray();
    
    // Localize
    const localizedCategories = categories.map(cat => ({
      ...cat,
      name: getLocalized(cat.name, req.lng)
    }));
    
    res.json({ ok: true, categories: localizedCategories });
  } catch (e) {
    logger.error('GET /practice/categories failed', e);
    res.status(500).json({ ok: false, error: 'DB_FAILED' });
  }
});

// GET /api/practice/lessons
router.get('/lessons', async (req, res) => {
  try {
    // Try cache first
    if (redisClient?.isReady) {
      const cached = await redisClient.get('practice:lessons:all');
      if (cached) {
        return res.json({ ok: true, lessons: JSON.parse(cached), fromCache: true });
      }
    }

    const practiceCol = await getPracticeLessonsCol();
    const lessons = await practiceCol.find({}).toArray();
    
    // Transform and Localize
    const lessonsMap = {};
    lessons.forEach(l => {
      lessonsMap[l.id] = {
        ...l,
        title: getLocalized(l.title, req.lng),
        description: getLocalized(l.description, req.lng),
        difficulty: getLocalized(l.difficulty, req.lng),
        content: getLocalized(l.content, req.lng)
      };
    });

    if (redisClient?.isReady) {
      // Note: Caching localized results per language would be better, 
      // but for now we skip caching to ensure correctness or use a keyed cache.
      // await redisClient.setEx(`practice:lessons:${req.lng}`, 3600, JSON.stringify(lessonsMap));
    }

    res.json({ ok: true, lessons: lessonsMap });
  } catch (e) {
    logger.error('GET /practice/lessons failed', e);
    // No fallback to hardcoded to keep routes clean as requested
    res.status(500).json({ ok: false, error: 'DB_FAILED' });
  }
});

// POST /api/practice/complete
router.post('/complete', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  const { id } = req.body;
  
  try {
    const practiceCol = await getPracticeLessonsCol();
    const lesson = await practiceCol.findOne({ id });
    if (!lesson) return res.status(400).json({ ok: false, error: 'INVALID_LESSON' });

    const users = await getUsersCol();
    const dbUser = await users.findOne({ uid: user.uid });
    if (!dbUser) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

    // Check if already completed
    if (dbUser.learningProgress?.[id] === 'completed') {
      return res.status(400).json({ ok: false, error: 'ALREADY_COMPLETED' });
    }

    // Atomic update: Set progress and Inc coins
    const progressKey = `learningProgress.${id}`;
    await users.updateOne(
      { uid: user.uid },
      {
        $set: { [progressKey]: 'completed' },
        $inc: { 'inventory.coins': (lesson.reward || 10) }
      }
    );

    return res.json({ ok: true, lessonId: id, reward: lesson.reward });
  } catch (e) {
    logger.error('POST /practice/complete failed', e);
    return res.status(500).json({ ok: false, error: 'API_ERROR' });
  }
});

export default router;

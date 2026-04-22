import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb, getGamesCol } from '../../mongo.mjs';
import { ensureUserFromJwtPayload } from '../../users.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { makeSlug } from '../../utils/slug.mjs';
import { rooms } from '../../services/roomManager.mjs';

const router = express.Router();

// Matches
router.get('/matches', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid && !user?.sub) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const search = req.query.search || '';
    const status = req.query.status || '';

    const query = {};
    if (search) query._id = { $regex: search, $options: 'i' };
    if (status) query.status = status;

    const col = await getGamesCol();
    const queryStr = JSON.stringify(query);
    console.log(`[AdminMatches] UID: ${user.uid} | Col: ${col.collectionName} | Query: ${queryStr}`);
    
    const docs = await col.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
      
    // Optional: Enrich docs with player names if not present
    // ... though usually they are in the match doc

    const total = await col.countDocuments(query);
    logger.info(`[AdminMatches] UID: ${user.uid} | Fetched: ${docs.length}, Total: ${total}`);

    res.json({ ok: true, matches: docs, total, pages: Math.ceil(total / limit), currentPage: page });

  } catch (e) {
    logger.error('GET /admin/matches failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.delete('/matches/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid && !user?.sub) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const id = req.params.id;
    const db = await getDb();
    const col = await getGamesCol();
    await col.deleteOne({ _id: id });
    await db.collection('moves').deleteMany({ gameId: id });
    rooms.delete(id);
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/matches/:id failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Comments
router.get('/comments', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const search = req.query.search || '';
    const type = req.query.type || 'all';

    const db = await getDb();
    let comments = [];
    const query = {};
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { uid: { $regex: search, $options: 'i' } }
      ];
    }

    if (type === 'entity' || type === 'all') {
      const docs = await db.collection('entityComments').find(query).toArray();
      comments = comments.concat(docs.map(c => ({ ...c, _type: 'entity' })));
    }
    if (type === 'game' || type === 'all') {
      const docs = await db.collection('gameComments').find(query).toArray();
      comments = comments.concat(docs.map(c => ({ ...c, _type: 'game' })));
    }

    comments.sort((a, b) => b.createdAt - a.createdAt);
    const total = comments.length;
    const paged = comments.slice((page - 1) * limit, page * limit);

    res.json({ ok: true, comments: paged, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (e) {
    logger.error('GET /admin/comments failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.delete('/comments/:type/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const { type, id } = req.params;
    const db = await getDb();
    const { ObjectId } = await import('mongodb');
    const colName = type === 'game' ? 'gameComments' : 'entityComments';
    await db.collection(colName).deleteOne({ _id: new ObjectId(id) });
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/comments failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Lessons
router.get('/practice/lessons', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { getPracticeLessonsCol } = await import('../../mongo.mjs');
    const col = await getPracticeLessonsCol();
    const lessons = await col.find({}).sort({ order: 1, id: 1 }).toArray();
    res.json({ ok: true, lessons });
  } catch (e) {
    logger.error('GET /admin/practice/lessons failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.post('/practice/lessons', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const lesson = req.body;
    if (!lesson.id) return res.status(400).json({ ok: false, error: 'MISSING_ID' });
    const { getPracticeLessonsCol } = await import('../../mongo.mjs');
    const col = await getPracticeLessonsCol();
    const updateData = JSON.parse(JSON.stringify(lesson));
    delete updateData._id;

    // --- Localization Support ---
    // If fields are strings (legacy frontend), wrap them in localized objects.
    // We prioritize keeping the schema consistent.
    const translatableFields = ['title', 'description', 'content', 'difficulty'];
    translatableFields.forEach(f => {
      if (typeof updateData[f] === 'string') {
        updateData[f] = {
          en: updateData[f], // During transition, we treat the input as English if it's the primary language now
          vi: updateData[f]
        };
      }
    });

    if (Array.isArray(updateData.boards)) {
      updateData.boards = updateData.boards.map(b => {
        delete b._id;
        return b;
      });
    }
    if (!lesson.slug) {
      updateData.slug = makeSlug(lesson.title, lesson.id);
    }
    if (lesson.category) {
      updateData.categorySlug = makeSlug(lesson.category, lesson.category); // Using category as ID for category slug
    }
    
    logger.info(`UPDATING LESSON id=${lesson.id} KEYS:`, Object.keys(updateData));
    await col.updateOne({ id: lesson.id }, { $set: { ...updateData, updatedAt: new Date() } }, { upsert: true });
    const { clearPracticeCache } = await import('../../services/cache.mjs');
    await clearPracticeCache();
    res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/practice/lessons failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.post('/practice/reorder', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    
    const { orders } = req.body; // Array of { id, order }
    if (!Array.isArray(orders)) return res.status(400).json({ ok: false, error: 'INVALID_DATA' });

    const { getPracticeLessonsCol } = await import('../../mongo.mjs');
    const col = await getPracticeLessonsCol();
    
    const bulkOps = orders.map(item => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: { order: item.order, updatedAt: new Date() } }
      }
    }));

    if (bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    
    const { clearPracticeCache } = await import('../../services/cache.mjs');
    await clearPracticeCache();
    res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/practice/reorder failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.delete('/practice/lessons/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { id } = req.params;
    const { getPracticeLessonsCol } = await import('../../mongo.mjs');
    const col = await getPracticeLessonsCol();
    await col.deleteOne({ id });
    const { clearPracticeCache } = await import('../../services/cache.mjs');
    await clearPracticeCache();
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/practice/lessons failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Practice Categories
router.get('/practice/categories', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { getPracticeCategoriesCol } = await import('../../mongo.mjs');
    const col = await getPracticeCategoriesCol();
    const categories = await col.find({}).sort({ name: 1 }).toArray();
    res.json({ ok: true, categories });
  } catch (e) {
    logger.error('GET /admin/practice/categories failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.post('/practice/categories', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { name } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: 'MISSING_NAME' });
    const { getPracticeCategoriesCol } = await import('../../mongo.mjs');
    const col = await getPracticeCategoriesCol();
    const slug = makeSlug(name, name);
    await col.updateOne({ name }, { $set: { name, slug, updatedAt: new Date() } }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/practice/categories failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.delete('/practice/categories/:name', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { name } = req.params;
    const { getPracticeCategoriesCol } = await import('../../mongo.mjs');
    const col = await getPracticeCategoriesCol();
    await col.deleteOne({ name });
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/practice/categories failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.get('/practice/stats', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const db = await getDb();
    const totalLessons = await db.collection('practice_lessons').countDocuments();
    const usersCol = await db.collection('users');
    const usersWithProgress = await usersCol.countDocuments({ learningProgress: { $exists: true } });
    res.json({ ok: true, stats: { totalLessons, usersWithProgress } });
  } catch (e) {
    logger.error('GET /admin/practice/stats failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Gifts
router.get('/gifts', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { getGiftsCol } = await import('../../mongo.mjs');
    const col = await getGiftsCol();
    const gifts = await col.find({}).sort({ updatedAt: -1 }).toArray();
    res.json({ ok: true, gifts });
  } catch (e) {
    logger.error('GET /admin/gifts failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.post('/gifts', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const gift = req.body;
    if (!gift.id) return res.status(400).json({ ok: false, error: 'MISSING_ID' });
    const { getGiftsCol } = await import('../../mongo.mjs');
    const col = await getGiftsCol();
    const updateData = JSON.parse(JSON.stringify(gift));
    delete updateData._id;

    // Localization Support
    ['name', 'description'].forEach(f => {
      if (typeof updateData[f] === 'string') {
        updateData[f] = { en: updateData[f], vi: updateData[f] };
      }
    });

    await col.updateOne({ id: gift.id }, { $set: { ...updateData, updatedAt: Date.now() } }, { upsert: true });
    const { clearShopCache } = await import('../../services/cache.mjs');
    await clearShopCache();
    res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/gifts failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.delete('/gifts/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || dbUser.sysRole !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { id } = req.params;
    const { getGiftsCol } = await import('../../mongo.mjs');
    const col = await getGiftsCol();
    await col.deleteOne({ id });
    const { clearShopCache } = await import('../../services/cache.mjs');
    await clearShopCache();
    res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /admin/gifts failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;

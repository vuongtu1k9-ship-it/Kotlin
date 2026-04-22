import express from 'express';
import path from 'path';
import { logger } from '../../logger.mjs';
import { getPuzzlesCol } from '../../mongo.mjs';
import { ObjectId } from 'mongodb';
import { redisClient } from '../../services/cache.mjs';
import { makeSlug } from '../../utils/slug.mjs';
import { generateBoardImage } from '../../utils/imageGen.mjs';
import { safeString, safeNumber, escapeRegex } from '../../utils/security.mjs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDataRoot } from '../../utils/dataRoot.mjs';
import { getRealIp } from '../../utils/ip.mjs';
import { resolvePuzzle, formatPuzzleSummary } from '../../utils/puzzleHelpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(getDataRoot(), 'uploads', 'puzzles');

const router = express.Router();

router.get('/setups/public', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(200, safeNumber(req.query?.limit, 50)));
    const q = safeString(req.query?.q);
    const level = req.query?.level != null && req.query.level !== '' ? safeNumber(req.query.level, null) : null;
    const page = Math.max(1, safeNumber(req.query?.page, 1));
    const skip = (page - 1) * limit;
    const pieceCountStr = safeString(req.query?.pieceCount, null);
    const piecesStr = safeString(req.query?.pieces, null);
    const sort = safeString(req.query?.sort, 'newest');
    const timeRange = safeString(req.query?.timeRange, 'all');
    const materialStr = safeString(req.query?.material);

    const source = safeString(req.query?.source, 'all');
    const ids = safeString(req.query?.ids).split(',').filter(Boolean);
    const cacheKey = `setups:public:v10:${source}:${limit}:${page}:${q}:${level ?? 'all'}:${pieceCountStr || 'all'}:${piecesStr || 'all'}:${sort}:${timeRange}:${materialStr}:${ids.join(',')}`;
    
    if (redisClient?.isReady && ids.length === 0) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`[REDIS] ${cacheKey} miss/failed`, e); }
    }

    let filter = {};
    if (ids.length > 0) {
      const objectIds = ids.filter(id => ObjectId.isValid(id) && id.length === 24).map(id => new ObjectId(id));
      filter = {
        $or: [
          { uid: { $in: ids } },
          { _id: { $in: objectIds } }
        ]
      };
    } else {
      if (source === 'import') {
        filter.$or = [
          { createdByUid: 'import' },
          { createdBySub: 'import' }
        ];
      } else if (source === 'user') {
        filter.createdByUid = { $ne: 'import' };
        filter.createdBySub = { $ne: 'import' };
      }
      
      const creatorUid = safeString(req.query?.creatorUid);
      if (creatorUid) filter.createdByUid = creatorUid;
      
      if (level != null && Number.isFinite(level)) filter.level = level;
      if (q) {
        const safeQ = escapeRegex(q);
        filter.$or = [
          { name: { $regex: safeQ, $options: 'i' } },
          { uid: q.toLowerCase() }
        ];
      }

      if (pieceCountStr) {
        const match = pieceCountStr.match(/^(\d+)-(\d+)$/);
        if (match) {
          filter.pieceCount = { $gte: Number(match[1]), $lte: Number(match[2]) };
        } else {
          const pc = Number(pieceCountStr);
          if (Number.isFinite(pc)) filter.pieceCount = pc;
        }
      }
      
      if (piecesStr) {
        const reqPieces = piecesStr.split(',').map(s => s.trim()).filter(Boolean);
        if (reqPieces.length > 0) filter.pieces = { $all: reqPieces };
      }

      if (materialStr) {
        materialStr.split(',').forEach(p => {
          const [k, v] = p.split(':');
          if (k && v != null) filter[`material.${k}`] = Number(v);
        });
      }

      if (timeRange !== 'all') {
        const now = Date.now();
        let threshold = 0;
        if (timeRange === 'day') threshold = now - 24 * 60 * 60 * 1000;
        if (timeRange === 'week') threshold = now - 7 * 24 * 60 * 60 * 1000;
        if (timeRange === 'month') threshold = now - 30 * 24 * 60 * 60 * 1000;
        if (threshold > 0) filter.createdAt = { $gte: threshold };
      }
    }

    const sortConfig = {};
    if (sort === 'popular') sortConfig.likeCount = -1;
    else if (sort === 'solved') sortConfig.solveCount = -1;
    sortConfig.createdAt = -1;

    const col = await getPuzzlesCol();
    const docs = await col
      .find(filter, { projection: { uid: 1, name: 1, description: 1, level: 1, createdAt: 1, updatedAt: 1, createdByName: 1, fen: 1, board: 1, pieceCount: 1, likeCount: 1, solveCount: 1, viewCount: 1, attemptCount: 1 } })
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .toArray();

    const response = {
      ok: true,
      setups: docs.map(d => formatPuzzleSummary(d, req.lng)),
    };

    if (redisClient?.isReady && ids.length === 0 && response.setups.length > 0) {
        try {
          await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
        } catch (e) { logger.debug(`[REDIS] ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    logger.error('[PUZZLE] GET /setups/public failed:', e);
    return res.status(500).json({ ok: false, error: 'SETUPS_PUBLIC_FAILED' });
  }
});

// GET /puzzles/:id handler follows...

// GET /puzzles/:id handler follows...

router.get('/puzzles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await resolvePuzzle(id);
    if (!doc) {
      logger.warn(`GET /puzzles/:id - Puzzle not found: ${id}`);
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    const col = await getPuzzlesCol();
    col.updateOne({ _id: doc._id }, { $inc: { viewCount: 1, attemptCount: 1 } }).catch(e => logger.debug('Inc view failed', e));

    return res.json({
      ok: true,
      setup: formatPuzzleSummary(doc, req.lng),
    });
  } catch (e) {
    logger.error('GET /puzzles/:id failed', e);
    return res.status(500).json({ ok: false, error: 'PUZZLE_FAILED' });
  }
});

router.get('/setups/public/:id', async (req, res) => {
  try {
    const rawId = safeString(req.params.id);
    const cacheKey = `setups:public:view:${rawId}`;
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`[REDIS] ${cacheKey} miss/failed`, e); }
    }

    const doc = await resolvePuzzle(rawId);

    if (!doc) {
      logger.warn(`GET /setups/public/${rawId} 404 - PUZZLE_NOT_FOUND`);
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    const response = {
      ok: true,
      setup: formatPuzzleSummary(doc, req.lng),
    };
    // Include full board for the view
    response.setup.board = doc.board;
    response.setup.createdByUid = doc.createdByUid;

    if (redisClient?.isReady) {
      try {
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(response));
      } catch (e) { logger.debug(`[REDIS] ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    logger.error('GET /setups/public/:id failed', e);
    return res.status(500).json({ ok: false, error: 'SETUP_PUBLIC_FAILED' });
  }
});

router.get('/setups/similar/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'BAD_ID' });

    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 6)));
    const cacheKey = `setups:similar:${id}:${limit}`;
    
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug(`[REDIS] ${cacheKey} miss/failed`, e); }
    }

    const source = await resolvePuzzle(id);

    if (!source || !source.pieces || !source.pieceCount) {
      return res.json({ ok: true, setups: [] });
    }

    const filter = {
      _id: { $ne: source._id },
      createdByUid: 'import',
      pieceCount: { $gte: Math.max(2, source.pieceCount - 2), $lte: source.pieceCount + 2 },
      pieces: { $in: source.pieces }
    };
    
    if (source.level != null) {
      filter.level = { $gte: Math.max(0, source.level - 1), $lte: source.level + 1 };
    }

    const col = await getPuzzlesCol();
    const docs = await col
      .find(filter, { projection: { uid: 1, name: 1, description: 1, level: 1, fen: 1, board: 1, pieceCount: 1, pieces: 1 } })
      .limit(100)
      .toArray();

    const sourceSet = new Set(source.pieces);
    docs.forEach(d => {
      if (!d.pieces) {
        d.score = 0;
        return;
      }
      const targetSet = new Set(d.pieces);
      let intersection = 0;
      for (const p of sourceSet) if (targetSet.has(p)) intersection++;
      const union = sourceSet.size + targetSet.size - intersection;
      d.score = intersection / union;
      if (d.pieceCount === source.pieceCount) d.score += 0.2;
    });


    docs.sort((a, b) => b.score - a.score);
    const top = docs.slice(0, limit);

    const response = {
      ok: true,
      setups: top.map(d => formatPuzzleSummary(d, req.lng)),
    };

    if (redisClient?.isReady) {
      try { await redisClient.setEx(cacheKey, 3600, JSON.stringify(response)); } catch (e) { logger.debug(`[REDIS] ${cacheKey} failed`, e); }
    }

    return res.json(response);
  } catch (e) {
    logger.error('GET /setups/similar/:id failed', e);
    return res.status(500).json({ ok: false, error: 'SIMILAR_FAILED' });
  }
});

export default router;

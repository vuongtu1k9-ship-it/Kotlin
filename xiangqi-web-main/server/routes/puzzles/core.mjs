import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb, getUsersCol, getPuzzlesCol } from '../../mongo.mjs';
import { redisClient, clearPuzzleCache, clearUserCache } from '../../services/cache.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { isInCheck, getMaterial } from '../../moveLogic.mjs';
import { boardToFen } from '../../fen.mjs';
import { logUserActivity, LOG_ACTIONS } from '../../services/userLogger.mjs';
import DOMPurify from 'isomorphic-dompurify';
import { resolvePuzzle, formatPuzzleSummary } from '../../utils/puzzleHelpers.mjs';

const sanitizeText = (text) => {
  if (!text) return '';
  return DOMPurify.sanitize(String(text), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
};

const router = express.Router();

function generateShortId(length = 5) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Reusable validation logic
const validateBoardState = (board) => {
  if (!Array.isArray(board) || board.length !== 10) {
    return { ok: false, error: 'BAD_BOARD' };
  }

  // Piece Limits and King Rules
  const pieceLimits = {
    general: 1,
    advisor: 2,
    elephant: 2,
    horse: 2,
    chariot: 2,
    cannon: 2,
    soldier: 5
  };

  const isPalace = (side, r, c) => {
    if (c < 3 || c > 5) return false;
    if (side === 'red') return r >= 7 && r <= 9;
    return r >= 0 && r <= 2;
  };

  const redKings = [];
  const blackKings = [];
  const counts = { red: {}, black: {} };

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;
      const side = p.side;
      const type = p.type;
      if (!side || !type) continue;

      counts[side][type] = (counts[side][type] || 0) + 1;
      if (counts[side][type] > pieceLimits[type]) {
        return { ok: false, error: `TOO_MANY_${type.toUpperCase()}S`, details: `${side} ${type}` };
      }

      if (type === 'general') {
        if (side === 'red') redKings.push({ r, c });
        else blackKings.push({ r, c });
        if (!isPalace(side, r, c)) {
          return { ok: false, error: `GENERAL_OUTSIDE_PALACE_${side.toUpperCase()}` };
        }
      } else if (type === 'advisor') {
        if (!isPalace(side, r, c)) {
          return { ok: false, error: `ADVISOR_OUTSIDE_PALACE_${side.toUpperCase()}` };
        }
        const valid = side === 'red' 
          ? [[9,3],[9,5],[8,4],[7,3],[7,5]].some(([vr, vc]) => vr === r && vc === c)
          : [[0,3],[0,5],[1,4],[2,3],[2,5]].some(([vr, vc]) => vr === r && vc === c);
        if (!valid) {
          return { ok: false, error: `BAD_ADVISOR_POS_${side.toUpperCase()}` };
        }
      } else if (type === 'elephant') {
        const valid = side === 'red'
          ? r >= 5 && [[9,2],[9,6],[7,0],[7,4],[7,8],[5,2],[5,6]].some(([vr, vc]) => vr === r && vc === c)
          : r <= 4 && [[0,2],[0,6],[2,0],[2,4],[2,8],[4,2],[4,6]].some(([vr, vc]) => vr === r && vc === c);
        if (!valid) {
          return { ok: false, error: `BAD_ELEPHANT_POS_${side.toUpperCase()}` };
        }
      } else if (type === 'soldier') {
        if (side === 'red' && r > 6) return { ok: false, error: 'RED_SOLDIER_BACKWARD' };
        if (side === 'black' && r < 3) return { ok: false, error: 'BLACK_SOLDIER_BACKWARD' };
        if (side === 'red' && r >= 5 && (c % 2 !== 0)) return { ok: false, error: 'RED_SOLDIER_INVALID_COLUMN' };
        if (side === 'black' && r <= 4 && (c % 2 !== 0)) return { ok: false, error: 'BLACK_SOLDIER_INVALID_COLUMN' };
      }
    }
  }

  if (redKings.length !== 1 || blackKings.length !== 1) {
    return { ok: false, error: 'EXACTLY_ONE_GENERAL_EACH_SIDE' };
  }

  // Flying general
  const rk = redKings[0];
  const bk = blackKings[0];
  if (rk.c === bk.c) {
    let blocked = false;
    for (let r = Math.min(rk.r, bk.r) + 1; r < Math.max(rk.r, bk.r); r++) {
      if (board[r][rk.c]) { blocked = true; break; }
    }
    if (!blocked) return { ok: false, error: 'FLYING_GENERAL_NOT_ALLOWED' };
  }

  if (isInCheck('red', board) || isInCheck('black', board)) {
    return { ok: false, error: 'GENERAL_IN_CHECK_AT_START' };
  }

  const redAttacking = (counts.red.chariot || 0) + (counts.red.horse || 0) + (counts.red.cannon || 0) + (counts.red.soldier || 0);
  const blackAttacking = (counts.black.chariot || 0) + (counts.black.horse || 0) + (counts.black.cannon || 0) + (counts.black.soldier || 0);
  if (redAttacking === 0 && blackAttacking === 0) {
    return { ok: false, error: 'ONLY_DEFENSIVE_PIECES_REMAINING' };
  }

  return { ok: true };
};

router.post('/setups', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const { name, description, level, board } = req.body || {};

    const nm = sanitizeText(name);
    if (!nm) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });
    if (nm.length > 80) return res.status(400).json({ ok: false, error: 'NAME_TOO_LONG' });

    const desc = sanitizeText(description);
    if (desc.length > 1000) return res.status(400).json({ ok: false, error: 'DESC_TOO_LONG' });

    const lvl = level == null || level === '' ? null : Number(level);
    if (lvl != null && (!Number.isFinite(lvl) || lvl < 0 || lvl > 100)) return res.status(400).json({ ok: false, error: 'BAD_LEVEL' });

    const boardResult = validateBoardState(board);
    if (!boardResult.ok) {
      logger.warn(`[/setups] POST validation failed: ${boardResult.error} (user: ${user.uid})`);
      return res.status(400).json(boardResult);
    }

    const db = await getDb();
    const col = db.collection('puzzles');
    const now = Date.now();

    // Recalculate everything on server
    const fullFen = boardToFen(board, 'red');
    const fenBase = fullFen.split(' ').slice(0, 2).join(' ');
    
    // Duplicate check
    const existing = await col.findOne({ 
      fen: { $regex: '^' + fenBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( |$)' } 
    });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'DUPLICATE_PUZZLE', uid: existing.uid, name: existing.name });
    }

    let uid = generateShortId(5);
    while (await col.findOne({ uid })) {
      uid = generateShortId(5);
    }

    const { counts: materialCounts, pieces, pieceCount } = getMaterial(board);
    const doc = {
      uid,
      name: nm,
      description: desc || null,
      level: lvl,
      board,
      fen: fullFen,
      createdAt: now,
      updatedAt: now,
      createdByUid: String(user.uid),
      createdByName: user.name || user.email || user.uid,
      material: materialCounts,
      pieces,
      pieceCount,
    };

    await col.insertOne(doc);
    await clearPuzzleCache();
    logUserActivity({ uid: String(user.uid), action: LOG_ACTIONS.PUZZLE_CREATE, details: { puzzleUid: doc.uid, name: nm, level: lvl } }).catch(err => logger.debug('Puzzle create activity logging failed', err));
    return res.json({ ok: true, setupId: doc.uid, uid: doc.uid });
  } catch (e) {
    logger.error('POST /setups failed', e);
    return res.status(500).json({ ok: false, error: 'SAVE_SETUP_FAILED' });
  }
});

router.get('/setups/mine', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 50)));
    const db = await getDb();
    const col = db.collection('puzzles');
    const docs = await col
      .find(
        { createdByUid: String(user.uid) },
        { projection: { name: 1, description: 1, level: 1, createdAt: 1, updatedAt: 1, createdByUid: 1, createdByName: 1 } }
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return res.json({
      ok: true,
      setups: docs.map(formatPuzzleSummary),
    });
  } catch (e) {
    logger.error('GET /setups/mine failed', e);
    return res.status(500).json({ ok: false, error: 'SETUPS_FAILED' });
  }
});

router.get('/setups/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const id = String(req.params.id || '');
    const doc = await resolvePuzzle(id);

    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (String(doc.createdByUid) !== String(user.uid)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const summary = formatPuzzleSummary(doc);
    summary.board = doc.board;
    summary.createdByUid = doc.createdByUid;

    return res.json({
      ok: true,
      setup: summary,
    });
  } catch (e) {
    logger.error('GET /setups/:id failed', e);
    return res.status(500).json({ ok: false, error: 'SETUP_FAILED' });
  }
});

router.put('/setups/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const id = String(req.params.id || '');
    const { name, description, level, board } = req.body || {};

    const doc = await resolvePuzzle(id);
    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (String(doc.createdByUid) !== String(user.uid)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const sName = sanitizeText(name);
    const sDesc = sanitizeText(description);
    const lvl = level == null || level === '' ? null : Number(level);

    const update = {
      name: sName || doc.name,
      description: sDesc || null,
      level: lvl,
      updatedAt: Date.now()
    };

    if (board) {
      const boardResult = validateBoardState(board);
      if (!boardResult.ok) {
        logger.warn(`[/setups] PUT validation failed for ${id}: ${boardResult.error}`);
        return res.status(400).json(boardResult);
      }
      
      const fullFen = boardToFen(board, 'red');
      const { counts: materialCounts, pieces, pieceCount } = getMaterial(board);
      
      update.board = board;
      update.fen = fullFen;
      update.material = materialCounts;
      update.pieces = pieces;
      update.pieceCount = pieceCount;
    }

    const db = await getDb();
    const col = db.collection('puzzles');
    await col.updateOne({ uid: id }, { $set: update });
    await clearPuzzleCache();

    return res.json({ ok: true });
  } catch (e) {
    logger.error('PUT /setups/:id failed', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.delete('/setups/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const id = String(req.params.id || '');
    const doc = await resolvePuzzle(id);

    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (String(doc.createdByUid) !== String(user.uid)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const db = await getDb();
    const col = db.collection('puzzles');
    await col.deleteOne({ uid: id });
    await clearPuzzleCache();

    return res.json({ ok: true });
  } catch (e) {
    logger.error('DELETE /setups/:id failed', e);
    return res.status(500).json({ ok: false, error: 'DELETE_FAILED' });
  }
});

router.post('/solve/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'BAD_ID' });

    const puzzle = await resolvePuzzle(id);
    if (!puzzle) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const db = await getDb();
    const usersCol = db.collection('users');
    const puzzlesCol = db.collection('puzzles');

    const dbUser = await usersCol.findOne({ uid: user.uid });
    if (!dbUser) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

    const puzzleUid = puzzle.uid || String(puzzle._id);
    const progressKey = `learningProgress.pz:${puzzleUid}`;
    
    if (dbUser.learningProgress?.[`pz:${puzzleUid}`] === 'completed') {
      return res.json({ ok: true, msg: 'ALREADY_SOLVED', reward: 0 });
    }

    const reward = 5;
    await usersCol.updateOne(
      { uid: user.uid },
      {
        $set: { [progressKey]: 'completed' },
        $inc: { 'inventory.coins': reward }
      }
    );

    await clearUserCache(user.uid);

    await puzzlesCol.updateOne(
      { _id: puzzle._id },
      { $inc: { solveCount: 1 } }
    );

    logUserActivity({ uid: String(user.uid), action: LOG_ACTIONS.PUZZLE_SOLVE, details: { puzzleUid, reward } }).catch(err => logger.debug('Puzzle solve activity logging failed', err));
    logUserActivity({ uid: String(user.uid), action: LOG_ACTIONS.COINS_CHANGE, details: { amount: reward, reason: 'puzzle_solve' } }).catch(err => logger.debug('Puzzle solve coin activity logging failed', err));

    return res.json({ ok: true, reward, puzzleId: puzzleUid });
  } catch (e) {
    logger.error('POST /setups/solve/:id failed', e);
    return res.status(500).json({ ok: false, error: 'SOLVE_FAILED' });
  }
});

export default router;

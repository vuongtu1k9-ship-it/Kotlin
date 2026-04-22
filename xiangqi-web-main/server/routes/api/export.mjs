import express from 'express';
import path from 'path';
import fs from 'fs';
import { generateBoardVideo } from '../../utils/videoGen.mjs';
import { generateBoardImage } from '../../utils/imageGen.mjs';
import { logger } from '../../logger.mjs';
import { getDataRoot } from '../../utils/dataRoot.mjs';
import { getGamesCol, getPuzzlesCol, getPuzzleSolutionsCol } from '../../mongo.mjs';
import { boardToFen } from '../../utils/fen.mjs';
import { getRealIp } from '../../utils/ip.mjs';

const router = express.Router();
const VIDEO_CACHE_DIR = path.join(getDataRoot(), 'uploads', 'videos');

/**
 * Parses spec like 9x16, 1200x630, 1200x, x630
 */
const parseSpecStr = (specStr) => {
  if (!specStr) return {};

  const match = specStr.match(/^(\d*)x(\d*)$/);
  if (match) {
    const w = parseInt(match[1]);
    const h = parseInt(match[2]);
    if (w > 50 && h > 50) return { width: w, height: h };
    if (w > 0 && h > 0) return { ratio: `${w}:${h}` };
    if (w > 50) return { width: w };
    if (h > 50) return { height: h };
  }
  // Fallback to ratio or empty
  if (specStr.includes(':') || (specStr.includes('x') && !specStr.startsWith('x') && !specStr.endsWith('x'))) {
    return { ratio: specStr.replace('x', ':') };
  }
  return {};
};

const imageHandler = async (req, res) => {
  const { type, id, spec: urlSpec } = req.params;
  const start = Date.now();
  logger.info(`[ImageExport] 📥 Entry | type: ${type} | id: ${id} | urlSpec: ${urlSpec}`);

  // 1. Determine base ID and initial spec from @suffix
  let cleanId = id.replace(/\.(png|webp)$/, '').replace(/^(game|puzzle)-/, '');
  let idSpec = {};
  if (cleanId.includes('@')) {
    const parts = cleanId.split('@');
    cleanId = parts[0];
    idSpec = parseSpecStr(parts[1]);
  }

  // 2. Override with path-based spec and query params
  const pathSpec = urlSpec ? parseSpecStr(urlSpec) : {};
  const querySpec = {
    ratio: req.query.ratio,
    width: parseInt(req.query.width),
    height: parseInt(req.query.height)
  };

  const finalSpec = {
    ratio: querySpec.ratio || pathSpec.ratio || idSpec.ratio,
    width: querySpec.width || pathSpec.width || idSpec.width || 1200,
    height: querySpec.height || pathSpec.height || idSpec.height
  };

  // Default ratio ONLY if no ratio and no explicit height are provided
  if (!finalSpec.ratio && !finalSpec.height) {
    finalSpec.ratio = '9:10';
  }


  logger.info(`[ImageExport] 📸 Request: ${type}/${cleanId} | Spec: ${JSON.stringify(finalSpec)}`);

  try {
    let fen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    let source = 'default';

    if (type === 'game') {
      const gamesCol = await getGamesCol();
      const game = await gamesCol.findOne({ $or: [{ _id: cleanId }, { uid: cleanId }] });
      if (!game) {
        logger.warn(`[ImageExport] Game not found: ${cleanId}`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
        return res.status(404).send('Game not found');
      }
      const state = game.state;
      if (state?.lastposition || state?.position) {
        fen = state.lastposition || state.position;
        source = state.lastposition ? 'state.lastposition' : 'state.position';
      } else if (state?.board) {
        fen = boardToFen(state.board, state.currentPlayer || 'red');
        source = 'state.board (converted)';
      } else if (state?.initialFen) {
        fen = state.initialFen;
        source = 'state.initialFen';
      }
    } else if (type === 'puzzle') {
      const puzzlesCol = await getPuzzlesCol();
      const puzzle = await puzzlesCol.findOne({ $or: [{ uid: cleanId }, { 'importedFrom.legacy13CharId': cleanId }] });
      if (!puzzle) {
        logger.warn(`[ImageExport] Puzzle not found: ${cleanId}`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
        return res.status(404).send('Puzzle not found');
      }
      
      if (puzzle.fen) {
        fen = puzzle.fen;
        source = 'puzzle.fen';
      } else if (puzzle.board) {
        // Puzzles are generally "red to move" by default unless specified
        fen = boardToFen(puzzle.board, puzzle.sideToMove || 'red');
        source = 'puzzle.board (converted)';
      } else {
        logger.warn(`[ImageExport] Puzzle ${cleanId} has no FEN or board`);
        source = 'default (fallback)';
      }
    }

    const imageBuffer = await generateBoardImage(fen || 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1', finalSpec);
    
    // Force download headers
    const filename = `xiangqi_${type}_${cleanId}_${finalSpec.ratio?.replace(':', 'x') || '1200'}.webp`;
    res.set({
      'Content-Type': 'image/webp',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(imageBuffer);
    logger.info(`[ImageExport] ✅ Success: ${type}/${cleanId} in ${Date.now() - start}ms`);
  } catch (err) {
    logger.error(`[ImageExport] 🔥 Error:`, err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
};

const videoHandler = async (req, res) => {
  const { type, id, spec: urlSpec } = req.params;
  const start = Date.now();

  let cleanId = id.replace('.mp4', '').replace(/^(game|puzzle)-/, '');
  let idSpec = {};
  if (cleanId.includes('@')) {
    const parts = cleanId.split('@');
    cleanId = parts[0];
    idSpec = parseSpecStr(parts[1]);
  }

  const pathSpec = urlSpec ? parseSpecStr(urlSpec) : {};
  const finalSpec = {
    ratio: req.query.ratio || pathSpec.ratio || idSpec.ratio || '9:10',
    width: parseInt(req.query.width) || pathSpec.width || idSpec.width || 1280,
    fps: Math.min(10, Math.max(0.1, parseFloat(req.query.fps) || 0.5))
  };


  const videoDir = path.join(getDataRoot(), 'uploads', 'videos');
  const cacheKey = `${type}-${id.replace('@','_at_')}-${finalSpec.ratio.replace(':','x')}-${finalSpec.width}.mp4`;
  const videoPath = path.join(videoDir, cacheKey);

  logger.info(`[VideoExport] 🎬 Request: ${type}/${cleanId} | Spec: ${JSON.stringify(finalSpec)}`);

  try {
    if (fs.existsSync(videoPath)) return res.sendFile(videoPath);

    let initialFen = '', moves = [];
    if (type === 'game') {
      const gamesCol = await getGamesCol();
      const game = await gamesCol.findOne({ $or: [{ _id: cleanId }, { uid: cleanId }, { id: cleanId }] });
      if (!game) {
        logger.warn(`[VideoExport] Game not found: ${cleanId}`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
        return res.status(404).send('Game not found');
      }
      initialFen = game.state?.initialFen || 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
      moves = game.state?.moveHistory || [];
    } else if (type === 'puzzle') {
      const parts = cleanId.split('-s'), puzzleId = parts[0], solIdx = parts[1] ? parseInt(parts[1]) : 0;
      const puzzlesCol = await getPuzzlesCol();
      const puzzle = await puzzlesCol.findOne({ $or: [{ uid: puzzleId }, { 'importedFrom.legacy13CharId': puzzleId }] });
      if (!puzzle) {
        logger.warn(`[VideoExport] Puzzle not found: ${puzzleId}`, { ip: getRealIp(req), ua: req.get('user-agent'), path: req.path });
        return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      }
      initialFen = puzzle.fen || (puzzle.board ? boardToFen(puzzle.board, puzzle.sideToMove || 'red') : 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1');
      if (Array.isArray(puzzle.solutions) && puzzle.solutions[solIdx]) moves = puzzle.solutions[solIdx].moves || [];
      else if (puzzle.moves) moves = puzzle.moves || [];
      else {
        const solCol = await getPuzzleSolutionsCol();
        const solutions = await solCol.find({ puzzleId: puzzle.uid }).sort({ createdAt: -1 }).toArray();
        if (solutions.length > 0) moves = (solutions[solIdx] || solutions[0]).moves || [];
      }
    }

    if (!moves || moves.length === 0) {
      logger.warn(`[VideoExport] No moves found for ${type}/${cleanId}`);
      return res.status(400).json({ ok: false, error: 'NO_MOVES_FOUND' });
    }

    const filename = `xiangqi_${type}_${cleanId}_${finalSpec.ratio?.replace(':', 'x') || '720'}.mp4`;

    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'video/mp4'
    });

    await generateBoardVideo({ initialFen, moves }, videoPath, finalSpec);
    if (fs.existsSync(videoPath)) res.sendFile(videoPath);
    else throw new Error('Generation failed');
  } catch (err) {
    logger.error(`[VideoExport] 🔥 Error:`, err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
};

// 1. Image API
router.get('/image/:spec/:type/:id', imageHandler);
router.get('/image/:type/:id', imageHandler);
router.post('/image', async (req, res) => {
  try {
    const { fen, ratio, width, height } = req.body;
    if (!fen) return res.status(400).send('FEN required');
    const buf = await generateBoardImage(fen, { ratio, width: parseInt(width), height: parseInt(height) });
    res.set('Content-Type', 'image/webp').send(buf);
  } catch (e) { res.status(500).send(e.message); }
});

// 2. Video API
router.get('/video/:spec/:type/:id', videoHandler);
router.get('/video/:type/:id', videoHandler);
router.post('/video', async (req, res) => {
  const { uid, frames, initialFen, moves, fps = 0.5, ratio = '16:9', width = 720 } = req.body;
  if (!uid) return res.status(400).json({ ok: false, error: 'Missing uid' });
  const videoPath = path.join(VIDEO_CACHE_DIR, `${uid}-${ratio.replace(':','x')}-${width}.mp4`);
  try {
    await generateBoardVideo(initialFen ? { initialFen, moves } : frames, videoPath, { fps, ratio, width });
    res.sendFile(videoPath);
  } catch (e) { res.status(500).send(e.message); }
});

export default router;

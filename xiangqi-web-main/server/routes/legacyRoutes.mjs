import express from 'express';
import path from 'path';
import fs from 'fs';
import { getPuzzlesCol } from '../mongo.mjs';
import { generateBoardImage } from '../utils/imageGen.mjs';
import { logger } from '../logger.mjs';
import { getDataRoot } from '../utils/dataRoot.mjs';

const router = express.Router();
const UPLOADS_DIR = path.join(getDataRoot(), 'uploads', 'puzzles');

/**
 * 🚀 Legacy & Dynamic Image Fallback
 * Catches /uploads/co-the/:size/:file when the physical file is missing.
 * Also handles legacy /co-the/:id redirects at the root level.
 */

// 1. Dynamic Image Generation Fallback
router.get(['/uploads/co-the/:size/:file', '/uploads/ban-co/:size/:file'], async (req, res, next) => {
  try {
    const { size, file } = req.params;
    const parts = file.split('.');
    const id = parts[0];
    const ext = parts[1] || 'webp';
    const originalUrl = req.originalUrl;

    // Check if file sits on disk first (though express.static should have caught it)
    const diskPath = path.join(getDataRoot(), 'uploads', req.path.replace('/uploads/', ''));
    if (fs.existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }

    const col = await getPuzzlesCol();

    // Handle special placeholders
    if (id === 'xep-co-the' || id === 'rand-678') {
      const fen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
      const width = size.includes('x') ? parseInt(size.split('x')[0]) : parseInt(size);
      const imageBuffer = await generateBoardImage(fen, { width: width || 340 });
      res.set('Content-Type', 'image/webp');
      return res.send(imageBuffer);
    }

    // Find puzzle (supports UID or Legacy ID)
    const initialPuzzle = await col.findOne({
      $or: [
        { uid: id },
        { 'importedFrom.legacy13CharId': id }
      ]
    });

    if (initialPuzzle) {
      // Find canonical version (shortest UID)
      const puzzles = await col.find({ fen: initialPuzzle.fen }).toArray();
      puzzles.sort((a, b) => (a.uid?.length || 99) - (b.uid?.length || 99));
      const puzzle = puzzles[0] || initialPuzzle;
      const canonicalUid = puzzle.uid || String(puzzle._id);

      // Redirect to canonical URL if mismatch
      if (id !== canonicalUid || !originalUrl.startsWith('/uploads/co-the/')) {
        const newUrl = `/uploads/co-the/${size}/${canonicalUid}.${ext}`;
        logger.debug(`[IMAGE_REFRESH] Redirecting ${id} -> ${canonicalUid}`);
        return res.redirect(301, newUrl);
      }

      // Generate on the fly
      const width = size.includes('x') ? parseInt(size.split('x')[0]) : parseInt(size);
      logger.info(`[IMAGE_GEN] Rendering ${canonicalUid} (${size}) on-demand`);
      const imageBuffer = await generateBoardImage(puzzle.fen, { width: width || 1200 });

      // Cache to disk for next time
      const targetDir = path.join(UPLOADS_DIR, size);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, `${canonicalUid}.${ext}`);
      fs.writeFile(targetPath, imageBuffer, (err) => {
        if (err) logger.error(`[IMAGE_CACHE] Failed for ${canonicalUid}`, err);
      });

      res.set('Content-Type', 'image/webp');
      return res.send(imageBuffer);
    }

    // If not found in database, redirect to the default starting board placeholder
    // This prevents 404 errors when social crawlers (like Facebook) request old, deleted IDs
    logger.warn(`[IMAGE_FALLBACK] Missing puzzle ID: ${id}. Redirecting to placeholder.`);
    return res.redirect(301, `/uploads/co-the/${size}/xep-co-the.${ext}`);
  } catch (err) {
    logger.error('[IMAGE_FALLBACK] Critical error:', err);
    next();
  }
});

// 2. Legacy SEO Redirects
router.get(['/co-the', '/co-the/'], (req, res) => res.redirect(301, '/puzzles'));
router.get(['/choi-thu', '/choi-thu/'], (req, res) => res.redirect(301, '/ai'));
router.get('/legal/privacy.html', (req, res) => res.redirect(301, '/privacy'));
router.get('/legal/tos.html', (req, res) => res.redirect(301, '/terms'));

// Catch old puzzle URL structures: /co-the/:id/:slug or /co-the/:id
router.get('/co-the/:id/:slug?', (req, res) => {
  const { id, slug } = req.params;
  const newSlug = slug ? `${id}-${slug}` : id;
  const newUrl = `/puzzles/${newSlug}`;
  logger.info(`[LEGACY_PUZZLE_REDIRECT] ${req.path} -> ${newUrl}`);
  return res.redirect(301, newUrl);
});

// Catch old AI URL structures
router.get('/choi-thu/:id?', (req, res) => {
  const newUrl = '/ai';
  logger.info(`[LEGACY_AI_REDIRECT] ${req.path} -> ${newUrl}`);
  return res.redirect(301, newUrl);
});

export default router;

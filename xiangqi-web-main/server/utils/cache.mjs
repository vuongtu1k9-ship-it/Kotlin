import fs from 'fs';
import path from 'path';
import { logger } from '../logger.mjs';
import { getDataRoot } from './dataRoot.mjs';

const UPLOADS_DIR = path.join(getDataRoot(), 'uploads', 'puzzles');

/**
 * Clears the cached board images for a specific ID (puzzle or game).
 * This ensures social previews are updated when things change.
 */
export function invalidateImageCache(id) {
  if (!id) return;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) return;
    const sizes = fs.readdirSync(UPLOADS_DIR);
    for (const size of sizes) {
      const filePath = path.join(UPLOADS_DIR, size, `${id}.webp`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug(`[CACHE] Invalidated image: ${filePath}`);
      }
    }
  } catch (err) {
    logger.error(`[CACHE] Failed to invalidate image cache for ${id}:`, err);
  }
}

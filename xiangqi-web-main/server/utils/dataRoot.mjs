import fs from 'fs';
import path from 'path';
import { logger } from '../logger.mjs';

let cachedDataRoot = null;

export function getDataRoot() {
  if (cachedDataRoot) return cachedDataRoot;

  let DATA_ROOT = process.env.DATA_ROOT;
  if (!DATA_ROOT) {
    const PREFERRED_DATA_PATH = '/data/xiangqi';
    try {
      if (fs.existsSync(PREFERRED_DATA_PATH)) {
        fs.accessSync(PREFERRED_DATA_PATH, fs.constants.W_OK);
        DATA_ROOT = PREFERRED_DATA_PATH;
        logger.info(`[dataRoot] Using preferred storage: ${DATA_ROOT}`);
      }
    } catch (e) {
      // Access denied or not exists
    }
  }

  if (!DATA_ROOT) {
    DATA_ROOT = path.join(process.cwd(), 'data');
    logger.info(`[dataRoot] Fallback to local storage: ${DATA_ROOT}`);
  }

  // Ensure internal structure exists
  const subDirs = ['avatars', 'uploads', 'uploads/puzzles', 'uploads/videos'];
  for (const dir of subDirs) {
    const fullPath = path.join(DATA_ROOT, dir);
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info(`[dataRoot] Created directory: ${fullPath}`);
      } catch (e) {
        logger.error(`[dataRoot] Failed to create directory ${fullPath}:`, e.message);
      }
    }
  }

  cachedDataRoot = DATA_ROOT;
  return DATA_ROOT;
}

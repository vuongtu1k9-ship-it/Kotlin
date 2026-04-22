import express from 'express';
import { logger } from '../logger.mjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireUser } from '../utils/auth.mjs';
import { ensureUser } from '../users.mjs';
import { getDataRoot } from '../utils/dataRoot.mjs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Robust File Filtering
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];

// Configure storage with strictly randomized names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(getDataRoot(), 'uploads');
    logger.debug(`[UPLOAD] Destination: ${dest}`);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // COMPLETED: Ignore file.originalname entirely to prevent filename injection attacks.
    // Use a clean, strictly alphanumeric name.
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    // Double check extension against whitelist again here
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    const isVideo = file.mimetype.startsWith('video/');
    cb(null, `${isVideo ? 'video' : 'img'}-${uniqueId}${safeExt}`);
  }
});

const uploadMiddleware = multer({ 
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 1, // Max 1 file per request
    fields: 0, // No extra text fields allowed here
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

    if (isMimeValid && isExtValid) {
      return cb(null, true);
    }
    
    logger.warn(`[UPLOAD] Rejected file: ${file.originalname} (${file.mimetype})`);
    cb(new Error('INVALID_FILE_TYPE: Chỉ cho phép tải lên hình ảnh hoặc video (mp4, webm)!'));
  }
}).single('file');

/**
 * Promise-based wrapper for multer to ensure predictable behavior
 */
const runUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return reject(new Error('Kích thước tệp quá lớn (tối đa 20MB)'));
        return reject(err);
      } else if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

router.post('/upload', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) {
    logger.warn(`[UPLOAD] Unauthorized access attempt. Path: ${req.path}`);
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }
  
  try {
    await runUpload(req, res);
    
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'NO_FILE' });
    }

    const url = `/uploads/${req.file.filename}`;
    const sizeKb = Math.round(req.file.size / 1024);
    logger.info(`[UPLOAD] Success: ${url} (${sizeKb} KB) (User: ${user.uid})`);
    return res.json({ location: url }); 
  } catch (e) {
    logger.error(`[UPLOAD] Failure for user ${user.uid}:`, e.message);
    return res.status(400).json({ ok: false, error: e.message || 'UPLOAD_FAILED' });
  }
});

export default router;

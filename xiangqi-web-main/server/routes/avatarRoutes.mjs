import express from 'express';
import path from 'path';
import { getUsersCol } from '../mongo.mjs';
import { getLocalAvatarPath } from '../services/avatarService.mjs';
import { logger } from '../logger.mjs';

const router = express.Router();

/**
 * GET /api/avatars/:uid
 * Phục vụ ảnh đại diện đã qua kiểm duyệt nghiêm ngặt.
 */
router.get('/avatars/:uid.:ext?', async (req, res) => {
  const { uid } = req.params;
  
  try {
    const users = await getUsersCol();
    const user = await users.findOne({ uid });
    
    let picture = user?.picture;
    if (!picture) {
      const name = user?.name || 'User';
      picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=150`;
    }

    // Đảm bảo ảnh cục bộ có tồn tại trong /tmp (nếu không sẽ tự tải lại)
    const localPath = await getLocalAvatarPath(uid, picture);
    
    if (!localPath) {
      if (!user?.picture) {
        // If we even failed to get the fallback, just redirect as a last resort
        return res.redirect(picture);
      }
      logger.warn(`[avatarRoutes] Failed to serve avatar for ${uid}`);
      return res.status(400).json({ ok: false, error: 'VALIDATION_FAILED' });
    }

    // Phục vụ tệp tin đã nén và làm sạch
    res.sendFile(localPath);
  } catch (e) {
    logger.error(`[avatarRoutes] Error serving avatar for ${uid}: ${e.message}`);
    res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

export default router;

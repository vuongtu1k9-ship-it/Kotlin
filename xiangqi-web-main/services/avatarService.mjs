import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { logger } from '../logger.mjs';

const AVATAR_CACHE_DIR = '/tmp/xiangqi-avatars';

// Khởi tạo thư mục cache nếu chưa có
if (!fs.existsSync(AVATAR_CACHE_DIR)) {
  fs.mkdirSync(AVATAR_CACHE_DIR, { recursive: true });
}

/**
 * Tải và kiểm tra nghiêm ngặt ảnh từ URL bên ngoài.
 * Sử dụng Sharp để xác minh tệp tin và loại bỏ mã độc tiềm ẩn trong metadata.
 */
export async function downloadAndValidateAvatar(uid, externalUrl, size = 150) {
  if (!externalUrl || !externalUrl.startsWith('http')) return null;

  // Use size in filename to cache different versions
  const targetPath = path.join(AVATAR_CACHE_DIR, `${uid}_s${size}.webp`);

  try {
    logger.info(`[avatarService] Downloading avatar for ${uid} (size: ${size}) from ${externalUrl}...`);
    
    const response = await axios({
      url: externalUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 5000, 
      headers: {
        'User-Agent': 'Xiangqi-Avatar-Validator/2.0'
      }
    });

    const buffer = Buffer.from(response.data);

    // Resize based on requested size
    const processedBuffer = await sharp(buffer)
      .rotate() 
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    await fs.promises.writeFile(targetPath, processedBuffer);
    logger.info(`[avatarService] Successfully validated and cached avatar for ${uid}_s${size}`);
    return targetPath;
  } catch (e) {
    logger.error(`[avatarService] Failed to validate avatar for ${uid}: ${e.message}`);
    return null;
  }
}

/**
 * Lấy đường dẫn ảnh cục bộ. Nếu chưa có trong /tmp, sẽ tự động tải lại.
 */
export async function getLocalAvatarPath(uid, externalUrl, size = 150) {
  // Normalize size to prevent cache bloat (e.g. only allow 48, 96, 150)
  let targetSize = 150;
  if (size <= 48) targetSize = 48;
  else if (size <= 96) targetSize = 96;
  
  const targetPath = path.join(AVATAR_CACHE_DIR, `${uid}_s${targetSize}.webp`);
  
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  // Fallback to check original 150px version if it exists to avoid re-downloading
  const originalPath = path.join(AVATAR_CACHE_DIR, `${uid}.webp`);
  if (fs.existsSync(originalPath)) {
    // We have the original, let's just resize it instead of downloading
    try {
        const buffer = fs.readFileSync(originalPath);
        const processedBuffer = await sharp(buffer)
          .resize(targetSize, targetSize, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer();
        await fs.promises.writeFile(targetPath, processedBuffer);
        return targetPath;
    } catch (e) { /* fallback to download */ }
  }

  if (externalUrl) {
    return await downloadAndValidateAvatar(uid, externalUrl, targetSize);
  }

  return null;
}

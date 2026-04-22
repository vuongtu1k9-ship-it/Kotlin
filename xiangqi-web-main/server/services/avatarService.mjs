import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { logger } from '../logger.mjs';
import { getDataRoot } from '../utils/dataRoot.mjs';

const AVATAR_CACHE_DIR = path.join(getDataRoot(), 'avatars');

// Khởi tạo thư mục cache nếu chưa có
if (!fs.existsSync(AVATAR_CACHE_DIR)) {
  fs.mkdirSync(AVATAR_CACHE_DIR, { recursive: true });
}

/**
 * Tải và kiểm tra nghiêm ngặt ảnh từ URL bên ngoài.
 * Sử dụng Sharp để xác minh tệp tin và loại bỏ mã độc tiềm ẩn trong metadata.
 */
export async function downloadAndValidateAvatar(uid, externalUrl) {
  if (!externalUrl || typeof externalUrl !== 'string') return null;
  
  // Prevent recursive loops if the DB accidentally contains a local proxy URL
  if (externalUrl.startsWith('/') || externalUrl.includes('/api/avatars/')) {
    logger.warn(`[AVATAR] Rejected internal/relative URL for ${uid}: ${externalUrl}`);
    return null;
  }

  if (!externalUrl.startsWith('http')) return null;

  const targetPath = path.join(AVATAR_CACHE_DIR, `${uid}.webp`);

  try {
    logger.info(`[AVATAR] Downloading avatar for ${uid} from ${externalUrl.substring(0, 50)}...`);

    
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

    // KIỂM TRA NGHIÊM NGẶT: Sharp sẽ ném lỗi nếu buffer không phải là ảnh hợp lệ
    // .rotate() tự động xoay ảnh đúng chiều dựa trên EXIF
    // .resize() đưa về kích thước chuẩn
    // .webp() chuyển đổi định dạng và .toBuffer() sẽ loại bỏ sạch metadata/mã độc
    const processedBuffer = await sharp(buffer)
      .rotate() 
      .resize(150, 150, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    await fs.promises.writeFile(targetPath, processedBuffer);
    logger.info(`[AVATAR] Successfully validated and cached avatar for ${uid}`);
    return targetPath;
  } catch (e) {
    logger.error(`[AVATAR] Failed to validate avatar for ${uid}: ${e.message}`);
    return null;
  }
}

/**
 * Lấy đường dẫn ảnh cục bộ. Nếu chưa có trong /tmp, sẽ tự động tải lại.
 */
export async function getLocalAvatarPath(uid, externalUrl) {
  const targetPath = path.join(AVATAR_CACHE_DIR, `${uid}.webp`);
  
  if (fs.existsSync(targetPath)) {
    logger.debug(`[AVATAR] Cache hit: ${uid}`);
    return targetPath;
  }

  logger.info(`[AVATAR] Cache miss: ${uid}. Attempting download...`);
  if (externalUrl) {
    return await downloadAndValidateAvatar(uid, externalUrl);
  }

  logger.warn(`[AVATAR] No avatar found for ${uid} and no external URL provided.`);
  return null;
}

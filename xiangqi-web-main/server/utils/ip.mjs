/**
 * Lấy địa chỉ IP thực của client từ các proxy headers
 * @param {import('express').Request} req 
 * @returns {string}
 */
export function getRealIp(req) {
  // Ưu tiên x-forwarded-for (có thể chứa chuỗi nhiều IP, lấy cái đầu tiên)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fallback về req.ip (đã được trust proxy xử lý) hoặc connection remoteAddress
  return req.ip || req.connection.remoteAddress || 'unknown';
}

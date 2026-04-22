import DOMPurify from 'isomorphic-dompurify';

/**
 * Escapes characters that have special meaning in regular expressions.
 * Prevents ReDoS and unexpected matching behavior.
 */
export function escapeRegex(string) {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ensures the value is a trimmed string. 
 * Prevents NoSQL Object Query Injection by casting complex types to strings.
 */
export function safeString(val, DEFAULT = '') {
  if (val == null) return DEFAULT;
  return String(val).trim();
}

/**
 * Ensures the value is a number (integer or float).
 */
export function safeNumber(val, DEFAULT = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : DEFAULT;
}

/**
 * Sanitizes HTML content using DOMPurify.
 * By default, it strips ALL tags (use for comments/chat).
 */
export function sanitizeHtml(html, options = { ALLOWED_TAGS: [] }) {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, options);
}
/**
 * Kiểm tra xem URL ảnh có an toàn và thuộc danh sách trắng không.
 */
export function isValidPictureUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Chỉ cho phép HTTPS
  if (!url.startsWith('https://')) return false;

  const trustedDomains = [
    'googleusercontent.com',     // Google
    'facebook.com',              // Facebook
    'graph.facebook.com',        // Facebook Graph
    'pravatar.cc',               // Bot avatars
    'gravatar.com',              // Gravatar
    'ui-avatars.com',            // UI Avatars
    'githubusercontent.com',     // GitHub
  ];

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    return trustedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch (e) {
    return false;
  }
}
/**
 * Trình chặn spam email dựa trên danh sách miền và mẫu độc hại.
 */
const BANNED_EMAIL_DOMAINS = new Set([
  '2200freefonts.com',
  'freefonts.com',
  'mailinator.com',
  'guerrillamail.com',
  'temp-mail.org',
  '10minutemail.com',
  'spam4.me',
  'dispostable.com',
  'sharklasers.com',
  'getnada.com',
  'pokemail.net',
  'disposable.com',
]);

export function isSpamEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  if (!lower.includes('@')) return true;
  
  const [username, domain] = lower.split('@');
  if (!domain || !username) return true;

  // 1. Chặn theo danh sách miền đen
  if (BANNED_EMAIL_DOMAINS.has(domain)) return true;

  // 2. Chặn các miền có mẫu số ngẫu nhiên dài ở đầu (ví dụ: 2200freefonts.com)
  if (/^\d{3,}/.test(domain)) return true; 

  // 3. Chặn các username lặp lại hoặc có quá nhiều số ngẫu nhiên ở đầu (ví dụ: 38governing)
  // Các bot thường dùng định dạng: [2 số][từ tiếng anh][@][4 số][từ tiếng anh]
  if (/^\d{2,}[a-z]{5,}/.test(username) && domain.length > 10 && /^\d{2,}/.test(domain)) return true;

  // 4. Chặn các chuỗi username quá dài và vô nghĩa (heuristic)
  if (username.length > 20 && /[^a-zA-Z0-9]/.test(username)) return true;

  return false;
}

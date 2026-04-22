import path from 'path';
import fs from 'fs';
import { getDataRoot } from '../utils/dataRoot.mjs';

/**
 * SSOT Configuration Mapping
 * Keys in ENV_MAP are EXCLUSIVELY fetched from process.env.
 * No fallbacks allowed.
 */
const ENV_MAP = {
  'push.vapidPublic': 'VAPID_PUBLIC_KEY',
  'push.vapidPrivate': 'VAPID_PRIVATE_KEY',
  'auth.jwtSecret': 'APP_JWT_SECRET',
  'facebook.appSecret': 'FB_APP_SECRET',
  'facebook.appId': 'FB_APP_ID',
  'facebook.appToken': 'FB_PAGE_TOKEN',
  'facebook.userToken': 'FB_USER_TOKEN',
  'google.serviceAccountJson': 'GOOGLE_SERVICE_ACCOUNT_JSON',
  'google.pagespeedApiKey': 'PAGESPEED_API_KEY',
  'google.clientId': 'GOOGLE_CLIENT_ID',
  'google.clientSecret': 'GOOGLE_CLIENT_SECRET',
  'google.refreshToken': 'GOOGLE_REFRESH_TOKEN',
  'tiktok.clientKey': 'TIKTOK_CLIENT_KEY',
  'tiktok.clientSecret': 'TIKTOK_CLIENT_SECRET',
  'tiktok.refreshToken': 'TIKTOK_REFRESH_TOKEN',
  'twitter.apiKey': 'TWITTER_API_KEY',
  'twitter.apiSecret': 'TWITTER_API_SECRET',
  'twitter.accessToken': 'TWITTER_ACCESS_TOKEN',
  'twitter.accessSecret': 'TWITTER_ACCESS_SECRET',
};

/**
 * Fallback mapping for keys that can be in both ENV and File.
 * Values in File > ENV > DEFAULTS.
 */
const ENV_FALLBACK = {
  'google.ga4PropertyId': 'GOOGLE_GA4_PROPERTY_ID',
  'google.searchConsoleSiteUrl': 'GOOGLE_SEARCH_CONSOLE_SITE_URL',
  'facebook.groupId': 'FB_GROUP_ID',
  'instagram.userId': 'INSTAGRAM_USER_ID',
};

/**
 * Keys not in ENV_MAP are EXCLUSIVELY fetched from config.json.
 * DEFAULTS are only used as the initial state of the store, not as a live fallback.
 */
const DEFAULTS = {
  'google.ga4PropertyId': '',
  'google.searchConsoleSiteUrl': '',
  'site.registrationOpen': true,
  'site.guestAllowed': true,
  'site.maintenanceMode': false,
  'site.maintenanceMessage': 'Đang bảo trì, vui lòng quay lại sau.',
  'site.announcementText': '',
  'site.keywords': 'cờ tướng sát thủ, thế cờ hay, xe mã tranh hùng, tướng hở sườn, binh pháp cờ tướng, đòn phối hợp xe mã, thế trận kịch tính, cờ tướng thực chiến, giải mã thế cờ, cao thủ cờ tướng',
  'game.defaultTimeControl': 'standard',
  'game.maxActiveRooms': 200,
  'game.spectatorAllowed': true,
  'ai.enabled': true,
  'ai.autoSwitch': true,
  'ai.defaultLevel': 4,
  'ai.defaultModel': 'gemini-3.1-flash-lite-preview',
  'ai.pikafishCacheEnabled': true,
  'chat.enabled': true,
  'chat.globalEnabled': true,
  'chat.roomEnabled': true,
  'elo.ranks': [
    { max: 1099, title: 'Tập sự', icon: '🌱' },
    { max: 1299, title: 'Phong trào', icon: '🥉' },
    { max: 1499, title: 'Trung cấp', icon: '🥈' },
    { max: 1699, title: 'Cao thủ', icon: '🥇' },
    { max: 1899, title: 'Kiện Tướng', icon: '🏅' },
    { max: 2099, title: 'Quốc Tế Đại Sư', icon: '💎' },
    { max: 9999, title: 'Đặc Cấp Đại Sư', icon: '👑' },
  ],
  'facebook.pageId': '2336479353252465',
  'facebook.groupId': '',
  'instagram.userId': '',
  'lobby.videoHighlightId': '8EyAKlcfQr4',
  'bot.maxConcurrent': 6,
  'social.prompt': `Bạn là một chuyên gia Marketing cho kênh Cờ Tướng (Xiangqi) chuyên nghiệp. 
Hãy viết một bài đăng mạng xã hội (Facebook/TikTok/YouTube) cực kỳ hấp dẫn, gây tò mò và dễ lan tỏa (viral) cho {{type_vn}} này.

THÔNG TIN:
- Tên: {{name}}
- Mô tả: {{description}}
{{extra_info}}
- Đường dẫn: {{url}}

YÊU CẦU ĐẦU RA (ĐỊNH DẠNG JSON):
{
  "title": "Tiêu đề ngắn gọn, cực hay, có emoji (tối đa 100 ký tự)",
  "content": "Nội dung bài đăng chi tiết, hấp dẫn, có hashtags"
}

LƯU Ý:
1. Tiêu đề: Phải khác biệt, gây sốc hoặc tò mò.
2. Nội dung: Súc tích, ngôn ngữ chuyên gia nhưng gần gũi. Khơi gợi người xem click vào link để xem lời giải hoặc bình luận.
3. Hashtags: #cotuong #xiangqi #cotuongxyz và các hashtag liên quan.
4. Quan trọng: KHÔNG dùng từ ngữ Cờ Vua. Dùng đúng Xe, Pháo, Mã, Tướng, Sĩ, Tượng, Chốt.`,
};

const CONFIG_PATH = path.join(getDataRoot(), 'config.json');

const CACHE_TTL = 60000; // 1 minute
let cachedConfig = null;
let lastFetch = 0;

export async function getConfig(key) {
  // 1. Check ENV Source
  if (key in ENV_MAP) {
    return process.env[ENV_MAP[key]] || null;
  }

  // 2. Check File Source (No fallback to ENV, No fallback to DEFAULTS)
  const all = await getAllConfig();
  return all[key] ?? null;
}

export async function getAllConfig(options = {}) {
  const { publicOnly = false } = options;
  const now = Date.now();
  
  // Only use cache if NOT requesting publicOnly (since internal logic needs full config)
  if (!publicOnly && cachedConfig && (now - lastFetch < CACHE_TTL)) {
    return cachedConfig;
  }

  const result = {};
  
  // A. Add ENV values (Omit if publicOnly is true)
  if (!publicOnly) {
    for (const [key, envVar] of Object.entries(ENV_MAP)) {
      result[key] = process.env[envVar] || null;
    }
  }

  // B. Add File values (Overwrite defaults, but only for keys NOT in ENV)
  let fileData = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = await fs.promises.readFile(CONFIG_PATH, 'utf8');
      fileData = JSON.parse(data);
    }
  } catch (err) {
    // If file is corrupt or unreadable, fileData remains empty
  }

  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in ENV_MAP)) {
      // Logic: Value in File > ENV > DEFAULTS.
      const envVar = ENV_FALLBACK[key];
      const envValue = envVar ? process.env[envVar] : null;
      result[key] = fileData[key] ?? envValue ?? DEFAULTS[key];
    }
  }

  if (!publicOnly) {
    cachedConfig = result;
    lastFetch = now;
  }
  
  return result;
}

export async function setConfig(key, value) {
  if (key in ENV_MAP) throw new Error(`Key ${key} is read-only (Source: Environment)`);
  
  const currentStore = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = await fs.promises.readFile(CONFIG_PATH, 'utf8');
      const json = JSON.parse(data);
      Object.assign(currentStore, json);
    }
  } catch (e) {}

  currentStore[key] = value;
  await fs.promises.mkdir(getDataRoot(), { recursive: true });
  await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(currentStore, null, 2), 'utf8');
  cachedConfig = null;
}

export async function setBulkConfig(settings) {
  const currentStore = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = await fs.promises.readFile(CONFIG_PATH, 'utf8');
      const json = JSON.parse(data);
      Object.assign(currentStore, json);
    }
  } catch (e) {}

  let changed = false;
  for (const [key, value] of Object.entries(settings)) {
    if (!(key in ENV_MAP) && (key in DEFAULTS)) {
      currentStore[key] = value;
      changed = true;
    }
  }

  if (changed) {
    await fs.promises.mkdir(getDataRoot(), { recursive: true });
    await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(currentStore, null, 2), 'utf8');
    cachedConfig = null;
  }
}

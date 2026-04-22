import path from 'path';
import fs from 'fs';

const DEFAULTS = {
  // Site settings
  'site.registrationOpen': true,
  'site.guestAllowed': true,
  'site.maintenanceMode': false,
  'site.maintenanceMessage': 'Đang bảo trì, vui lòng quay lại sau.',
  'site.announcementText': '',
  'site.keywords': 'cờ tướng sát thủ, thế cờ hay, xe mã tranh hùng, tướng hở sườn, binh pháp cờ tướng, đòn phối hợp xe mã, thế trận kịch tính, cờ tướng thực chiến, giải mã thế cờ, cao thủ cờ tướng',
  
  // Game settings
  'game.defaultTimeControl': 'standard',
  'game.maxActiveRooms': 200,
  'game.spectatorAllowed': true,
  
  // AI settings
  'ai.enabled': true,
  'ai.autoSwitch': true,
  'ai.defaultLevel': 4,
  'ai.defaultModel': 'gemini-3.1-flash-lite-preview',
  'ai.pikafishCacheEnabled': true,
  
  // Chat settings
  'chat.enabled': true,
  'chat.globalEnabled': true,
  'chat.roomEnabled': true,
  
  // Elo settings
  'elo.ranks': [
    { max: 1099, title: 'Tập sự', icon: '🌱' },
    { max: 1299, title: 'Phong trào', icon: '🥉' },
    { max: 1499, title: 'Trung cấp', icon: '🥈' },
    { max: 1699, title: 'Cao thủ', icon: '🥇' },
    { max: 1899, title: 'Kiện Tướng', icon: '🏅' },
    { max: 2099, title: 'Quốc Tế Đại Sư', icon: '💎' },
    { max: 9999, title: 'Đặc Cấp Đại Sư', icon: '👑' },
  ],
  
  // Google API Settings (Public IDs - Editable via Admin)
  'google.clientId': '',
  'google.ga4PropertyId': '',
  'google.searchConsoleSiteUrl': '',
  'google.serviceAccountJson': '',
  'google.pagespeedApiKey': '',
};

const CONFIG_PATH = path.join(process.cwd(), 'config', 'config.json');

const CACHE_TTL = 60000; // 1 minute
let cachedConfig = null;
let lastFetch = 0;

export async function getConfig(key) {
  const all = await getAllConfig();
  return all[key] ?? null;
}

export async function getAllConfig() {
  const now = Date.now();
  if (cachedConfig && (now - lastFetch < CACHE_TTL)) {
    return cachedConfig;
  }

  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      cachedConfig = { ...DEFAULTS };
      lastFetch = now;
      return cachedConfig;
    }
    const data = await fs.promises.readFile(CONFIG_PATH, 'utf8');
    const docs = JSON.parse(data);
    const result = { ...DEFAULTS };
    for (const [key, val] of Object.entries(docs)) {
      if (key in DEFAULTS) {
        result[key] = val;
      }
    }
    cachedConfig = result;
    lastFetch = now;
    return result;
  } catch (err) {
    cachedConfig = { ...DEFAULTS };
    lastFetch = now;
    return cachedConfig;
  }
}

export async function setConfig(key, value) {
  if (!(key in DEFAULTS)) throw new Error('Unknown config key: ' + key);
  const currentConfig = await getAllConfig();
  currentConfig[key] = value;
  await fs.promises.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), 'utf8');
  cachedConfig = null;
}

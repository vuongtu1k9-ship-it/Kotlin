import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = '/data/xiangqi/config.json';

// Danh sách các tiền tố/khóa ĐƯỢC PHÉP nằm trong JSON (Có thể sửa qua Admin)
const ALLOWED_PREFIXES = ['site.', 'game.', 'ai.', 'chat.', 'elo.', 'google.'];
const FORBIDDEN_KEYS = [
  'auth.jwtSecret',
  'google.clientSecret',
  'push.vapidPrivate',
  'ai.geminiKey',
  'ai.groqKey',
  'ai.openrouterKey',
  'ai.cerebrasKey',
  'ai.sambanovaKey',
  'ai.mistralKey'
];

async function cleanup() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const config = JSON.parse(data);
    const cleanConfig = {};

    for (const [key, value] of Object.entries(config)) {
      const isAllowedPrefix = ALLOWED_PREFIXES.some(p => key.startsWith(p));
      const isForbidden = FORBIDDEN_KEYS.includes(key);

      if (isAllowedPrefix && !isForbidden) {
        cleanConfig[key] = value;
      } else {
        console.log(`[Security] Removed sensitive key from JSON: ${key}`);
      }
    }

    await fs.writeFile(DATA_PATH, JSON.stringify(cleanConfig, null, 2), 'utf8');
    console.log('[Security] Cleanup complete. config.json is now safe.');
  } catch (err) {
    console.error('[Error] Cleanup failed:', err.message);
  }
}

cleanup();

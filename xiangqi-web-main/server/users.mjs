import { getUsersCol } from './mongo.mjs';
import crypto from 'crypto';

export const ELO_START = 1200;

function toSlug(str) {
  if (!str) return 'user';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // collapse hyphens
}

function makeUid() {
  return crypto.randomBytes(3).toString('hex').toLowerCase(); // 6 chars
}

export async function ensureUser(payload) {
  if (!payload?.sub) return null;
  const sub = String(payload.sub);
  const users = await getUsersCol();

  // Helper to check if a URL is a local proxy
  const isLocalProxy = (url) => typeof url === 'string' && url.startsWith('/api/avatars/');

  const existing = await users.findOne({ sub });
  if (existing) {
    const changes = { updatedAt: Date.now() };
    let needUpdate = false;

    // Only update name/picture if they don't exist in the DB
    if (!existing.name) {
      changes.name = payload.name || payload.email || 'User';
      needUpdate = true;
    }
    
    const existingIsProxy = isLocalProxy(existing.picture);
    if (!existing.picture || existingIsProxy) {
      if (payload.picture && payload.picture !== existing.picture && !isLocalProxy(payload.picture)) {
        changes.picture = payload.picture;
        needUpdate = true;
      }
    }


    // Always sync email from Google/provider if missing
    if (payload.email && !existing.email) {
      changes.email = payload.email;
      changes.emailLower = payload.email.toLowerCase();
      needUpdate = true;
    }

    if (!existing.uid) {
      changes.uid = makeUid();
      needUpdate = true;
    } else if (existing.uid !== existing.uid.toLowerCase()) {
      changes.uid = existing.uid.toLowerCase();
      needUpdate = true;
    }

    if (!existing.slug) {
      changes.slug = toSlug(existing.name || payload.name || 'User');
      needUpdate = true;
    }

    if (!existing.sysRole) {
      changes.sysRole = 'user';
      needUpdate = true;
    }


    if (needUpdate) {
      await users.updateOne({ sub }, { $set: changes });
      return users.findOne({ sub });
    }
    return existing;
  }

  const now = Date.now();
  const name = payload.name || payload.email || 'User';
  const slug = toSlug(name);
  const uid = makeUid();
  const emailLower = payload.email ? payload.email.toLowerCase() : null;

  const initialPicture = isLocalProxy(payload.picture) ? null : (payload.picture || null);

  await users.insertOne({
    sub,
    uid,
    slug,
    name,
    email: payload.email || null,
    emailLower,
    picture: initialPicture,
    provider: payload.provider || 'guest',
    createdAt: now,
    updatedAt: now,
    gamesPlayed: 0,
    elo: ELO_START,
    sysRole: 'user',
    inventory: { ring: 0, bear: 0, candy: 0, coins: 0 },
    learningProgress: {},
    customStatus: 'online',
    followingUids: [],
    followerUids: [],
    lastDailyRewardAt: 0,
    loginStreak: 0,
    dailyGiftsSent: 0,
    lastGiftResetAt: 0,
    notificationSettings: {
      roomInvitations: true
    }
  });

  return users.findOne({ sub });
}

/**
 * Chuyển đổi dữ liệu người dùng sang định dạng an toàn để gửi về Client.
 * Đặc biệt là chuyển đổi URL ảnh ngoại thành URL nội bộ qua Proxy.
 */
export function transformUser(user) {
  if (!user) return null;
  const email = user.email || user.emailLower || '';
  const isBot = email.toLowerCase().endsWith('@cotuong.xyz');
  
  return {
    uid: user.uid,
    name: user.name,
    slug: user.slug,
    elo: user.elo || ELO_START,
    gamesPlayed: user.gamesPlayed || 0,
    picture: user.picture ? `/api/avatars/${user.uid}` : null,
    isBot,
    // Chỉ công khai email nếu là Bot (nhận diện ngầm)
    email: isBot ? email : undefined,
    // Các thông tin công khai khác nếu cần
    sysRole: user.sysRole,
    inventory: user.inventory,
    customStatus: user.customStatus,
  };
}

// Keep legacy export for now to avoid breaking other files temporarily
export const ensureUserFromJwtPayload = ensureUser;

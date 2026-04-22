/**
 * Script: Import users từ DB cũ sang hệ thống mới
 * DB cũ: mongodb://192.168.9.167:27017/cotuong  (collection: chess.user)
 * DB mới: đọc từ MONGODB_URI trong .env
 *
 * Chạy: node server/scripts/import_users.mjs [--dry-run]
 *
 * Chiến lược:
 * - Nếu user đã tồn tại (match theo emailLower hoặc username) → cập nhật thêm trường bị thiếu
 * - Nếu user chưa tồn tại → tạo mới với sysRole='user'
 * - Password cũ (MD5) được lưu vào trường passHashLegacy (không dùng để login, chỉ ghi lại)
 */

import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const OLD_DB_URI = 'mongodb://192.168.9.167:27017';
const IGNORE_EMAILS = new Set(['sample@email.tst', '']);

const SPAM_DOMAINS = new Set([
  'checkyourform.xyz','wailo.cloudns.asia','mailvn.top','automisly.org',
  'ship79.com','mailhub365.xyz','immenseignite.info','shopcobe.com',
  'warunkpedia.com','cloudns.asia','dispostable.com','trashmail.com',
  'yopmail.com','tempmail.com','guerrillamail.com','mailnesia.com',
]);

function isSpamEmail(email = '') {
  if (!email) return false;
  const domain = (email.split('@')[1] || '').toLowerCase();
  return SPAM_DOMAINS.has(domain);
}

function looksLikeBot(username = '', name = '') {
  const u = username.toLowerCase();
  const n = name.toLowerCase();
  // Username = tên + chuỗi ký tự ngẫu nhiên không có nguyên âm => bot
  if (u === n && /^[a-z0-9]{6,12}$/.test(u) && (u.match(/[aeiou]/g) || []).length < 2) return true;
  return false;
}

const OLD_DB_NAME = 'cotuong';
const OLD_COLLECTION = 'chess.user';

function makeUid() {
  return crypto.randomBytes(3).toString('hex').toLowerCase();
}

function toSlug(str = '') {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'user';
}

const ELO_START = 1200;

async function main() {
  console.log(`[import_users] DRY_RUN=${DRY_RUN}`);

  // ── Kết nối DB cũ ──────────────────────────────────────────────────
  const oldClient = new MongoClient(OLD_DB_URI, {
    serverSelectionTimeoutMS: 5000,
    raw: true,  // đọc raw BSON để tự parse, tránh crash UTF-8
  });
  await oldClient.connect();
  const oldCol = oldClient.db(OLD_DB_NAME).collection(OLD_COLLECTION, { raw: true });
  const totalOld = await oldClient.db(OLD_DB_NAME).collection(OLD_COLLECTION).estimatedDocumentCount();
  console.log(`[import_users] DB cũ: ${totalOld} users`);

  // ── Kết nối DB mới ──────────────────────────────────────────────────
  const newMongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const newMongoDb  = process.env.MONGO_DB  || 'xiangqi';
  const newClient = new MongoClient(newMongoUrl);
  await newClient.connect();
  const newDb = newClient.db(newMongoDb);
  const newUsers = newDb.collection('users');

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const cursor = oldCol.find({});
  while (await cursor.hasNext()) {
    let u;
    try {
      const rawBuf = await cursor.next();
      // Parse BSON thủ công, thay thế ký tự UTF-8 không hợp lệ
      const { BSON } = await import('bson');
      u = BSON.deserialize(rawBuf, { allowObjectSmallerThanObjectSize: true });
    } catch (parseErr) {
      errors++;
      console.error(`[SKIP] BSON parse error: ${parseErr.message}`);
      continue;
    }

    try {
      const emailLower = (u.email || '').toLowerCase().trim();
      if (IGNORE_EMAILS.has(emailLower)) { skipped++; continue; }
      if (isSpamEmail(emailLower)) { skipped++; console.log(`[SPAM] email=${emailLower}`); continue; }

      const username = (u.username || u.id || '').toLowerCase().trim();
      const name = (u.name || u.username || emailLower || 'User').trim();

      if (looksLikeBot(username, name)) { skipped++; console.log(`[BOT] username=${username}`); continue; }

      const mobile = (u.mobile || u.phone || '').trim();

      // Tính ELO tương đối từ win/lose/draw
      const wins = u.win || 0;
      const losses = u.lose || 0;
      const draws = u.draw || 0;
      const elo = Math.max(800, ELO_START + wins * 10 - losses * 8 + draws * 2);
      const gamesPlayed = wins + losses + draws;

      // Tìm user hiện tại — ưu tiên match sub legacy > email > legacyUsername
      const legacySub = `legacy:${username}`;
      let existing = null;
      if (username) existing = await newUsers.findOne({ sub: legacySub });
      if (!existing && emailLower) existing = await newUsers.findOne({ emailLower });
      if (!existing && username) {
        existing = await newUsers.findOne({ $or: [{ legacyUsername: username }, { slug: username }] });
      }

      // ── CẬP NHẬT user đã tồn tại ───────────────────────────────────
      if (existing) {
        const patch = {};
        if (emailLower && !existing.email) {
          patch.email = u.email;
          patch.emailLower = emailLower;
        }
        if (mobile && !existing.mobile) patch.mobile = mobile;
        if (u.address && !existing.address) patch.address = u.address;
        if (u.password && !existing.passHashLegacy) patch.passHashLegacy = u.password;
        if (!existing.legacyUsername && username) patch.legacyUsername = username;

        if (Object.keys(patch).length > 0) {
          if (!DRY_RUN) {
            await newUsers.updateOne({ _id: existing._id }, { $set: patch });
          }
          updated++;
          console.log(`[UPDATE] uid=${existing.uid} name="${existing.name}" +fields: ${Object.keys(patch).join(', ')}`);
        } else {
          skipped++;
        }
        continue;
      }


      // ── TẠO MỚI ────────────────────────────────────────────────────
      const now = Date.now();
      const uid = makeUid();
      const slug = toSlug(name);

      const newUser = {
        uid,
        slug,
        name,
        email: emailLower || null,
        emailLower: emailLower || null,
        mobile: mobile || null,
        address: u.address || null,
        picture: null,
        provider: 'legacy',
        sub: `legacy:${username || uid}`,
        legacyUsername: username,
        passHashLegacy: u.password || null,  // MD5, lưu để tham khảo
        createdAt: u.regtime ? new Date(u.regtime).getTime() : now,
        updatedAt: now,
        gamesPlayed,
        elo,
        sysRole: u.isadmin ? 'admin' : 'user',
        inventory: { ring: 0, bear: 0, candy: 0, coins: 0 },
        learningProgress: {},
        customStatus: 'online',
        followingUids: [],
        followerUids: [],
        lastDailyRewardAt: 0,
        loginStreak: 0,
        dailyGiftsSent: 0,
        lastGiftResetAt: 0,
      };

      if (!DRY_RUN) {
        await newUsers.updateOne(
          { sub: newUser.sub },
          { $setOnInsert: newUser },
          { upsert: true }
        );
      }
      inserted++;
      console.log(`[INSERT] uid=${uid} name="${name}" email=${emailLower || '-'} elo=${elo}`);

    } catch (err) {
      errors++;
      console.error(`[ERROR] user=${u.username || u._id}: ${err.message}`);
    }
  }

  await cursor.close();
  await oldClient.close();
  await newClient.close();

  console.log(`\n══════════════════════════════════`);
  console.log(`[import_users] KẾT QUẢ${DRY_RUN ? ' (DRY RUN - không ghi)' : ''}:`);
  console.log(`  ✅ Inserted : ${inserted}`);
  console.log(`  🔄 Updated  : ${updated}`);
  console.log(`  ⏭  Skipped  : ${skipped}`);
  console.log(`  ❌ Errors   : ${errors}`);
  console.log(`══════════════════════════════════`);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

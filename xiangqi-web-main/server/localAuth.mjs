import crypto from 'crypto';

const SALT_BYTES = 16;
const KEYLEN = 32;

export function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e.includes('@') ? e : '';
}

export function makeLocalSub(emailLower) {
  return `local:${emailLower}`;
}

export function hashPassword(password, saltHex) {
  const salt = Buffer.from(String(saltHex), 'hex');
  const key = crypto.scryptSync(String(password), salt, KEYLEN);
  return key.toString('hex');
}

export function makePasswordRecord(password) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

export function verifyPassword(password, saltHex, expectedHashHex) {
  try {
    const got = Buffer.from(hashPassword(password, saltHex), 'hex');
    const exp = Buffer.from(String(expectedHashHex), 'hex');
    if (got.length !== exp.length) return false;
    return crypto.timingSafeEqual(got, exp);
  } catch (e) {
    return false;
  }
}

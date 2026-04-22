import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';
import { ensureChatIndexes } from './chat.mjs';
import { logger } from './logger.mjs';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

let clientPromise = null;

// ID Helpers
export function makeTournamentId() {
  return Math.random().toString(36).slice(2, 8).toLowerCase();
}

export function toQueryId(id) {
  if (!id) return id;
  if (id instanceof ObjectId) return id;
  // If it's a 24-character hex string, it's likely an old MongoDB ObjectID
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    try { return new ObjectId(id); } catch(e) { return id; }
  }
  return id; // Return as-is (short string ID)
}

export async function getDb() {
  if (!clientPromise) {
    logger.info('[DB] 🔌 Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URL, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
    });
    
    // Instead of just setting clientPromise, let's also catch the error
    // to avoid the whole server context hanging on a rejected promise
    clientPromise = client.connect().then(c => {
      logger.info(`[DB] ✅ Connected successfully to database: ${MONGO_DB}`);
      return c;
    }).catch(err => {
      logger.error('[DB] ❌ Connection error:', err.message);
      clientPromise = null; // Allow retry on next call
      throw err;
    });
  }
  
  try {
    const client = await clientPromise;
    return client.db(MONGO_DB);
  } catch (err) {
    logger.error('[DB] 💥 getDb failed to resolve client:', err.message);
    throw err;
  }
}

export async function getGamesCol() {
  const db = await getDb();
  return db.collection('matches');
}

export async function getMovesCol() {
  const db = await getDb();
  return db.collection('moves');
}

export async function getUsersCol() {
  const db = await getDb();
  return db.collection('users');
}

export async function getMessagesCol() {
  const db = await getDb();
  return db.collection('messages');
}

export async function getSiteConfigCol() {
  const db = await getDb();
  return db.collection('site_config');
}

export async function getPracticeLessonsCol() {
  const db = await getDb();
  return db.collection('practice_lessons');
}

export function getPuzzlesCol() {
  return getDb().then(db => db.collection('puzzles'));
}

export function getPuzzleSolutionsCol() {
  return getDb().then(db => db.collection('puzzle_solutions'));
}

export async function getGiftsCol() {
  const db = await getDb();
  return db.collection('gifts');
}

export async function getLessonStatsCol() {
  const db = await getDb();
  return db.collection('lesson_stats');
}

export async function getPracticeCategoriesCol() {
  const db = await getDb();
  return db.collection('practice_categories');
}

export async function getBotsCol() {
  const db = await getDb();
  return db.collection('bots');
}

async function repairCorruptedAvatars() {
  try {
    const users = await getUsersCol();
    const result = await users.updateMany(
      { picture: { $regex: '^\/api\/avatars\/' } },
      { $set: { picture: null, updatedAt: Date.now() } }
    );
    if (result.modifiedCount > 0) {
      logger.info(`[DB] 🛠️ Repaired ${result.modifiedCount} corrupted avatar URLs`);
    }
  } catch (e) {
    logger.error('[DB] ❌ repairCorruptedAvatars failed:', e.message);
  }
}

export async function ensureIndexes() {
  logger.info('[DB] ⚡ Ensuring indexes...');
  
  // Data repair tasks
  await repairCorruptedAvatars();

  const games = await getGamesCol();
  await games.createIndex({ updatedAt: -1 });
  await games.createIndex({ createdAt: -1 });
  await games.createIndex({ status: 1, updatedAt: -1 });
  await games.createIndex({ setupId: 1 });

  const moves = await getMovesCol();
  await moves.createIndex({ gameId: 1, ply: 1 }, { unique: true });
  await moves.createIndex({ gameId: 1, ts: 1 });

  const users = await getUsersCol();
  await users.createIndex({ sub: 1 }, { unique: true, sparse: true });
  await users.createIndex({ uid: 1 }, { unique: true, sparse: true });
  await users.createIndex({ slug: 1 });
  // local auth
  await users.createIndex({ emailLower: 1 }, { unique: true, sparse: true });

  const puzzles = await getPuzzlesCol();
  await puzzles.createIndex({ createdAt: -1 });
  await puzzles.createIndex({ createdBySub: 1, createdAt: -1 });
  await puzzles.createIndex({ createdByUid: 1, createdAt: -1 }); // Added to match query pattern
  await puzzles.createIndex({ name: 1 });
  await puzzles.createIndex({ uid: 1 }, { unique: true, sparse: true });

  const solutions = await getPuzzleSolutionsCol();
  await solutions.createIndex({ puzzleId: 1, createdAt: -1 });
  await solutions.createIndex({ userId: 1, puzzleId: 1 });

  // messages
  const messages = await getMessagesCol();
  await messages.createIndex({ fromSub: 1, createdAt: -1 });
  await messages.createIndex({ toSub: 1, createdAt: -1 });

  // site_config: keyed by _id
  const cfg = await getSiteConfigCol();
  await cfg.createIndex({ _id: 1 });

  // practice_lessons
  const practice = await getPracticeLessonsCol();
  await practice.createIndex({ id: 1 }, { unique: true });
  await practice.createIndex({ slug: 1 });
  await practice.createIndex({ category: 1 });

  // bots
  const bots = await getBotsCol();
  await bots.createIndex({ name: 1 });
  await bots.createIndex({ status: 1 });

  // practice_categories
  const categories = await getPracticeCategoriesCol();
  await categories.createIndex({ name: 1 }, { unique: true });
  await categories.createIndex({ slug: 1 });

  await ensureChatIndexes();

  // User activity logs
  const { ensureUserLogsIndexes } = await import('./services/userLogger.mjs');
  await ensureUserLogsIndexes();
  logger.info('[DB] ✨ All indexes verified');
}

export async function closeDb() {
  if (clientPromise) {
    const client = await clientPromise;
    await client.close();
    clientPromise = null;
  }
}

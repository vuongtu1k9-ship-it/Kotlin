#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import { logger } from '../logger.mjs';

function env(name, fallback = undefined) {
  const v = process.env[name];
  return v == null || v === '' ? fallback : v;
}

function parseBool(v, fallback = false) {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(s)) return false;
  return fallback;
}

const SOURCE_URI = env('MONGO_URI_SOURCE');
const TARGET_URI = env('MONGO_URI_TARGET');
const SOURCE_DB = env('MONGO_DB_SOURCE', 'cotuong');
const TARGET_DB = env('MONGO_DB_TARGET', 'xiangqi');

const DRY_RUN = parseBool(env('DRY_RUN', 'true'), true);
const FORCE = parseBool(env('FORCE', 'false'), false);
const BATCH_SIZE = Number(env('BATCH_SIZE', '500'));
const LIMIT = env('LIMIT') ? Number(env('LIMIT')) : null;
const COLLECTIONS = String(env('COLLECTIONS', 'users,games,moves,setups'))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Optional mapping for legacy DB collection names, e.g. cotuong uses names like 'chess.user'.
// Format: "target=source,target2=source2"
const COLLECTION_MAP = String(env('COLLECTION_MAP', ''))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .reduce((acc, pair) => {
    const [target, source] = pair.split('=').map((x) => x.trim());
    if (target && source) acc[target] = source;
    return acc;
  }, {});

if (!SOURCE_URI || !TARGET_URI) {
  logger.error('Missing required env vars: MONGO_URI_SOURCE and/or MONGO_URI_TARGET');
  process.exit(2);
}

if (!Number.isFinite(BATCH_SIZE) || BATCH_SIZE < 1 || BATCH_SIZE > 10_000) {
  logger.error('BATCH_SIZE must be a number between 1 and 10000');
  process.exit(2);
}

if (LIMIT != null && (!Number.isFinite(LIMIT) || LIMIT < 1)) {
  logger.error('LIMIT must be a positive number');
  process.exit(2);
}

if (!DRY_RUN && !FORCE) {
  logger.error('Refusing to run a write import without FORCE=1. (Tip: set DRY_RUN=1 to preview.)');
  process.exit(2);
}

if (!DRY_RUN && SOURCE_URI === TARGET_URI && SOURCE_DB === TARGET_DB) {
  logger.error('Source and target appear identical. Refusing to continue.');
  process.exit(2);
}

function log(...args) {
  logger.log(new Date().toISOString(), '-', ...args);
}

function pickUpsertKey(collectionName, doc) {
  // Use the most stable unique keys for idempotency.
  if (collectionName === 'users') {
    if (doc?.emailLower) return { emailLower: String(doc.emailLower) };
    if (doc?.sub) return { sub: String(doc.sub) };
  }
  if (collectionName === 'moves') {
    if (doc?.gameId != null && doc?.ply != null) return { gameId: doc.gameId, ply: doc.ply };
  }
  // games: _id is the roomId string. setups: _id is ObjectId.
  if (doc?._id != null) return { _id: doc._id };
  return null;
}

function stripId(doc) {
  const { _id, ...rest } = doc;
  return rest;
}

async function importCollection({ sourceDb, targetDb, name }) {
  const sourceName = COLLECTION_MAP[name] || name;
  const sourceCol = sourceDb.collection(sourceName);
  const targetCol = targetDb.collection(name);

  const total = await sourceCol.estimatedDocumentCount().catch(() => null);
  log(
    `Importing collection '${name}' from source '${sourceName}'${total != null ? ` (est. ${total})` : ''}...`
  );

  let processed = 0;
  let upserts = 0;
  let skipped = 0;

  const cursor = sourceCol.find({}, { batchSize: BATCH_SIZE });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) break;

    processed += 1;
    if (LIMIT != null && processed > LIMIT) break;

    const key = pickUpsertKey(name, doc);
    if (!key) {
      skipped += 1;
      if (processed % 1000 === 0) log(`[${name}] processed=${processed} upserts=${upserts} skipped=${skipped}`);
      continue;
    }

    if (!DRY_RUN) {
      const update = {
        $set: stripId(doc),
        $setOnInsert: doc?._id != null ? { _id: doc._id } : {},
      };
      await targetCol.updateOne(key, update, { upsert: true });
    }
    upserts += 1;

    if (processed % 1000 === 0) {
      log(`[${name}] processed=${processed} upserts=${upserts} skipped=${skipped}`);
    }
  }

  log(`Done '${name}': processed=${processed} upserts=${upserts} skipped=${skipped}${DRY_RUN ? ' (dry-run)' : ''}`);
}

async function main() {
  log('Starting Mongo import', {
    source: { uri: SOURCE_URI, db: SOURCE_DB },
    target: { uri: TARGET_URI, db: TARGET_DB },
    collections: COLLECTIONS,
    dryRun: DRY_RUN,
    batchSize: BATCH_SIZE,
    limit: LIMIT,
  });

  const sourceClient = new MongoClient(SOURCE_URI, {
    // Some legacy DBs may contain invalid UTF-8 in string fields.
    // Disabling utf8 validation allows us to read and migrate such documents.
    enableUtf8Validation: false,
  });
  const targetClient = new MongoClient(TARGET_URI);

  await Promise.all([sourceClient.connect(), targetClient.connect()]);
  try {
    const sourceDb = sourceClient.db(SOURCE_DB);
    const targetDb = targetClient.db(TARGET_DB);

    for (const name of COLLECTIONS) {
      await importCollection({ sourceDb, targetDb, name });
    }

    log('Import complete.');
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
}

main().catch((e) => {
  logger.error('Import failed:', e);
  process.exit(1);
});

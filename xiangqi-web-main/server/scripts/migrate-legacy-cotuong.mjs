#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import { logger } from '../logger.mjs';

const env = (k, d = undefined) => (process.env[k] == null || process.env[k] === '' ? d : process.env[k]);
const MONGO_URI = env('MONGO_URI', 'mongodb://127.0.0.1:27017');
const DB = env('MONGO_DB', 'xiangqi');

const DRY_RUN = String(env('DRY_RUN', '0')) === '1';

const LEGACY_USERS = env('LEGACY_USERS', 'legacy_chess_user');
const LEGACY_GAMES = env('LEGACY_GAMES', 'legacy_chess_table');
const LEGACY_SETUPS = env('LEGACY_SETUPS', 'legacy_board_cat');

const TARGET_USERS = env('TARGET_USERS', 'users');
const TARGET_GAMES = env('TARGET_GAMES', 'games');
const TARGET_SETUPS = env('TARGET_SETUPS', 'setups');

const BATCH = Math.max(1, Math.min(2000, Number(env('BATCH', '500'))));

function legacyUserSub(u) {
  // Try to keep stable identities; google guid becomes google:<guid>
  if (u?.oauthservice === 'google' && u?.guid) return `google:${u.guid}`;
  if (u?.id != null) return `legacy:${u.id}`;
  if (u?._id != null) return `legacy:${String(u._id)}`;
  return `legacy:unknown:${Math.random().toString(16).slice(2)}`;
}

function nowMs() {
  return Date.now();
}

async function main() {
  const client = new MongoClient(MONGO_URI, {
    enableUtf8Validation: false,
  });
  await client.connect();
  const db = client.db(DB);

  const legacyUsers = db.collection(LEGACY_USERS);
  const legacyGames = db.collection(LEGACY_GAMES);
  const legacySetups = db.collection(LEGACY_SETUPS);

  const users = db.collection(TARGET_USERS);
  const games = db.collection(TARGET_GAMES);
  const setups = db.collection(TARGET_SETUPS);

  // Basic idempotency index for setups imports
  await setups.createIndex({ 'importedFrom.collection': 1, 'importedFrom.id': 1 }, { unique: true, sparse: true });

  let usersUpserted = 0;
  {
    const cur = legacyUsers.find({}, { batchSize: BATCH });
    while (await cur.hasNext()) {
      const ops = [];
      for (let i = 0; i < BATCH && (await cur.hasNext()); i++) {
        const u = await cur.next();
        const sub = legacyUserSub(u);
        const name = u?.name || u?.username || u?.email || sub;
        const picture = u?.image || null;
        const elo = Number(u?.score ?? 1200);
        const gamesPlayed = Number(u?.win ?? 0) + Number(u?.lose ?? 0) + Number(u?.draw ?? 0);
        ops.push({
          updateOne: {
            filter: { sub },
            update: {
              $set: { sub, name, picture, elo, gamesPlayed, updatedAt: nowMs() },
              $setOnInsert: { createdAt: nowMs() },
            },
            upsert: true,
          },
        });
      }
      if (ops.length) {
        if (!DRY_RUN) await users.bulkWrite(ops, { ordered: false });
        usersUpserted += ops.length;
      }
    }
  }

  let gamesUpserted = 0;
  {
    const cur = legacyGames.find({}, { batchSize: BATCH });
    while (await cur.hasNext()) {
      const ops = [];
      for (let i = 0; i < BATCH && (await cur.hasNext()); i++) {
        const t = await cur.next();
        const id = String(t?._id);
        const createdAt = t?.regtime ? new Date(t.regtime).getTime() : nowMs();
        const updatedAt = t?.lastupdate ? new Date(t.lastupdate).getTime() : createdAt;
        const redSub = t?.red != null ? `legacy:${t.red}` : null;
        const blackSub = t?.black != null ? `legacy:${t.black}` : null;
        const finished = Boolean(t?.status === 'finish' || t?.finish || t?.winner);
        const winner = t?.winner === 'red' || t?.winner === 'black' ? t.winner : null;

        // NOTE: legacy move formats vary; we import minimal metadata first.
        const state = {
          started: true,
          finished,
          winner,
          endedBy: t?.endedBy || null,
          timeMode: 'standard',
          timeControl: { totalMs: 30 * 60_000, perMoveMs: 3 * 60_000 },
          clock: null,
          moveHistory: [],
          board: null,
          playerSubs: { red: redSub, black: blackSub },
        };

        ops.push({
          updateOne: {
            filter: { _id: id },
            update: {
              $setOnInsert: { _id: id },
              $set: {
                status: finished ? 'finished' : 'started',
                timeMode: 'standard',
                createdAt,
                updatedAt,
                playersSub: { red: redSub, black: blackSub },
                importedFrom: { collection: LEGACY_GAMES, id },
                state,
              },
            },
            upsert: true,
          },
        });
      }
      if (ops.length) {
        if (!DRY_RUN) await games.bulkWrite(ops, { ordered: false });
        gamesUpserted += ops.length;
      }
    }
  }

  let setupsInserted = 0;
  {
    const cur = legacySetups.find({}, { batchSize: 50 });
    while (await cur.hasNext()) {
      const ops = [];
      for (let i = 0; i < 50 && (await cur.hasNext()); i++) {
        const c = await cur.next();
        const legacyId = String(c?._id);
        ops.push({
          updateOne: {
            filter: { 'importedFrom.collection': LEGACY_SETUPS, 'importedFrom.id': legacyId },
            update: {
              $setOnInsert: {
                name: c?.name || 'Thế cờ',
                description: c?.desc || c?.description || null,
                level: c?.level != null ? Number(c.level) : null,
                board: c?.board || c?.position || [],
                createdAt: nowMs(),
                updatedAt: nowMs(),
                createdBySub: 'import',
                createdByName: 'import',
                importedFrom: { collection: LEGACY_SETUPS, id: legacyId },
              },
            },
            upsert: true,
          },
        });
      }
      if (ops.length) {
        if (!DRY_RUN) await setups.bulkWrite(ops, { ordered: false });
        setupsInserted += ops.length;
      }
    }
  }

  logger.log(
    JSON.stringify({
      ok: true,
      dryRun: DRY_RUN,
      db: DB,
      imported: { usersUpserted, gamesUpserted, setupsInserted },
      legacy: { users: LEGACY_USERS, games: LEGACY_GAMES, setups: LEGACY_SETUPS },
    })
  );

  await client.close();
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});

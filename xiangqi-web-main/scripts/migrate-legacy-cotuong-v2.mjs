#!/usr/bin/env node
import { MongoClient } from "mongodb";
import { logger } from "../logger.mjs";

const env = (k, d = undefined) => (process.env[k] == null || process.env[k] === "" ? d : process.env[k]);
const MONGO_URI = env("MONGO_URI", "mongodb://127.0.0.1:27017");
const DB = env("MONGO_DB", "xiangqi");

const DRY_RUN = String(env("DRY_RUN", "0")) === "1";

const LEGACY_USERS = env("LEGACY_USERS", "legacy_chess_user");
const LEGACY_GAMES = env("LEGACY_GAMES", "legacy_chess_table");
const LEGACY_SETUPS = env("LEGACY_SETUPS", "legacy_board_cat");

const TARGET_USERS = env("TARGET_USERS", "users");
const TARGET_GAMES = env("TARGET_GAMES", "games");
const TARGET_MOVES = env("TARGET_MOVES", "moves");
const TARGET_SETUPS = env("TARGET_SETUPS", "setups");

const BATCH = Math.max(1, Math.min(2000, Number(env("BATCH", "500"))));

function legacyUserSub(u) {
  if (u?.oauthservice === "google" && u?.guid) return `google:${u.guid}`;
  if (u?.id != null) return `legacy:${u.id}`;
  if (u?._id != null) return `legacy:${String(u._id)}`;
  return `legacy:unknown:${Math.random().toString(16).slice(2)}`;
}

function nowMs() {
  return Date.now();
}

function parseLegacyMove4(m) {
  const s = String(m ?? "").padStart(4, "0");
  if (s.length < 4) return null;
  const fx = Number(s[0]);
  const fy = Number(s[1]);
  const tx = Number(s[2]);
  const ty = Number(s[3]);
  if (![fx, fy, tx, ty].every((n) => Number.isFinite(n))) return null;
  // coords in legacy are assumed (col,row)
  return { from: { row: fy, col: fx }, to: { row: ty, col: tx } };
}

async function main() {
  const client = new MongoClient(MONGO_URI, { enableUtf8Validation: false });
  await client.connect();
  const db = client.db(DB);

  const legacyUsers = db.collection(LEGACY_USERS);
  const legacyGames = db.collection(LEGACY_GAMES);
  const legacySetups = db.collection(LEGACY_SETUPS);

  const users = db.collection(TARGET_USERS);
  const games = db.collection(TARGET_GAMES);
  const moves = db.collection(TARGET_MOVES);
  const setups = db.collection(TARGET_SETUPS);

  await setups.createIndex({ "importedFrom.collection": 1, "importedFrom.id": 1 }, { unique: true, sparse: true });
  await moves.createIndex({ gameId: 1, ply: 1 }, { unique: true });

  let usersUpserted = 0;
  {
    const cur = legacyUsers.find({}, { batchSize: BATCH });
    while (await cur.hasNext()) {
      const ops = [];
      for (let i = 0; i < BATCH && (await cur.hasNext()); i++) {
        const u = await cur.next();
        const sub = legacyUserSub(u);
        const name = u?.name || u?.username || u?.email || sub;
        const picture = u?.image ? String(u.image) : null;
        const elo = Number(u?.score ?? u?.elo ?? 1200);
        const gamesPlayed = Number(u?.win ?? 0) + Number(u?.lose ?? 0) + Number(u?.draw ?? 0);
        ops.push({
          updateOne: {
            filter: { sub },
            update: {
              $set: { sub, name, picture: picture || null, elo, gamesPlayed, updatedAt: nowMs() },
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
  let movesUpserted = 0;
  {
    const cur = legacyGames.find({}, { batchSize: 100 });
    while (await cur.hasNext()) {
      const gameOps = [];
      const moveOps = [];
      for (let i = 0; i < 100 && (await cur.hasNext()); i++) {
        const t = await cur.next();
        const id = String(t?._id);
        const createdAt = t?.createtime ? new Date(t.createtime).getTime() : nowMs();
        const updatedAt = t?.lastupdate ? new Date(t.lastupdate).getTime() : createdAt;

        // legacy users are stored in view{0,1}.id maybe, or red/black numeric
        const redSub = t?.red != null ? `legacy:${t.red}` : null;
        const blackSub = t?.black != null ? `legacy:${t.black}` : null;

        const finished = String(t?.status || "").toUpperCase() === "END" || String(t?.status || "").toUpperCase() === "CLOSE";

        const state = {
          started: true,
          finished,
          winner: null,
          endedBy: null,
          timeMode: "standard",
          timeControl: { totalMs: 30 * 60_000, perMoveMs: 3 * 60_000 },
          clock: null,
          moveHistory: [],
          board: null,
          playerSubs: { red: redSub, black: blackSub },
        };

        gameOps.push({
          updateOne: {
            filter: { _id: id },
            update: {
              $setOnInsert: { _id: id },
              $set: {
                status: finished ? "finished" : "started",
                timeMode: "standard",
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

        const arr = Array.isArray(t?.move) ? t.move : [];
        for (let j = 0; j < arr.length; j++) {
          const mv = arr[j];
          const raw = typeof mv === "string" ? mv : mv?.move;
          const parsed = parseLegacyMove4(raw);
          if (!parsed) continue;
          const ply = j + 1;
          const side = ply % 2 === 1 ? "red" : "black";
          moveOps.push({
            updateOne: {
              filter: { gameId: id, ply },
              update: {
                $setOnInsert: {
                  gameId: id,
                  ply,
                  side,
                  move: parsed,
                  ts: nowMs(),
                  importedFrom: { collection: LEGACY_GAMES, id },
                },
              },
              upsert: true,
            },
          });
        }
      }

      if (gameOps.length) {
        if (!DRY_RUN) await games.bulkWrite(gameOps, { ordered: false });
        gamesUpserted += gameOps.length;
      }
      if (moveOps.length) {
        if (!DRY_RUN) await moves.bulkWrite(moveOps, { ordered: false });
        movesUpserted += moveOps.length;
      }
    }
  }

  let setupsInserted = 0;
  {
    const cur = legacySetups.find({}, { batchSize: 200 });
    while (await cur.hasNext()) {
      const ops = [];
      for (let i = 0; i < 200 && (await cur.hasNext()); i++) {
        const c = await cur.next();
        const legacyId = String(c?._id);
        ops.push({
          updateOne: {
            filter: { "importedFrom.collection": LEGACY_SETUPS, "importedFrom.id": legacyId },
            update: {
              $setOnInsert: {
                name: c?.title || c?.name || "Thế cờ",
                description: c?.description || c?.desc || null,
                level: c?.level != null ? Number(c.level) : null,
                fen: c?.fen || null,
                board: c?.position || c?.board || [],
                createdAt: nowMs(),
                updatedAt: nowMs(),
                createdBySub: "import",
                createdByName: "import",
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
      legacy: { users: LEGACY_USERS, games: LEGACY_GAMES, setups: LEGACY_SETUPS },
      imported: { usersUpserted, gamesUpserted, movesUpserted, setupsInserted },
    })
  );

  await client.close();
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});

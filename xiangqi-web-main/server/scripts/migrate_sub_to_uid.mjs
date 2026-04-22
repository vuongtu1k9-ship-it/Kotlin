import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { logger } from '../logger.mjs';
import crypto from 'crypto';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.1.23:27017';
const MONGO_DB = process.env.MONGO_DB || 'xiangqi';

function makeUid() {
  return crypto.randomBytes(3).toString('hex').toLowerCase();
}

async function migrate() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(MONGO_DB);
    logger.log(`Connected to ${MONGO_DB}`);

    const usersCol = db.collection('users');
    const matchesCol = db.collection('matches');
    const chatMsgCol = db.collection('chat_messages');
    const msgCol = db.collection('messages');
    const pushCol = db.collection('user_subscriptions');
    const puzzleCol = db.collection('puzzles');

    // 1. Ensure all users have lowercase uid
    const users = await usersCol.find({}).toArray();
    logger.log(`Checking ${users.length} users for uids...`);
    const subToUid = new Map();
    for (const u of users) {
      let uid = u.uid;
      if (!uid) {
        uid = makeUid();
        await usersCol.updateOne({ _id: u._id }, { $set: { uid, updatedAt: Date.now() } });
        logger.log(`Assigned new uid ${uid} to user ${u.name || u.sub}`);
      } else if (uid !== uid.toLowerCase()) {
        uid = uid.toLowerCase();
        await usersCol.updateOne({ _id: u._id }, { $set: { uid, updatedAt: Date.now() } });
        logger.log(`Lowercased uid for user ${u.name || u.sub}: ${u.uid} -> ${uid}`);
      }
      subToUid.set(String(u.sub), String(uid));
    }

    const mapSide = (obj) => {
      if (!obj) return obj;
      const next = { ...obj };
      if (next.red && subToUid.has(next.red)) next.red = subToUid.get(next.red);
      if (next.black && subToUid.has(next.black)) next.black = subToUid.get(next.black);
      return next;
    };

    const transformDmRoomId = (rid) => {
      if (!rid) return rid;
      const isDm = rid.startsWith('dm::') || rid.startsWith('dm_');
      if (!isDm) return rid;
      const separator = rid.startsWith('dm::') ? '::' : '_';
      const parts = rid.split(separator);
      if (parts.length === 3) {
        const p1 = subToUid.get(parts[1]) || parts[1];
        const p2 = subToUid.get(parts[2]) || parts[2];
        return `${parts[0]}${separator}${p1}${separator}${p2}`;
      }
      return rid;
    };

    // 2. Matches
    logger.log('Migrating matches...');
    const matches = await matchesCol.find({}).toArray();
    for (const m of matches) {
      const updates = {};
      const unset = {};

      if (m.playersSub) {
        updates.playerUids = mapSide(m.playersSub);
        unset.playersSub = "";
      }
      if (m.playerSubs) {
        updates.playerUids = mapSide(m.playerSubs);
        unset.playerSubs = "";
      }
      if (m.state?.playerSubs) {
        updates['state.playerUids'] = mapSide(m.state.playerSubs);
        unset['state.playerSubs'] = "";
      }
      // Also check if they already have playerUids but with subs or uppercase uids
      if (m.playerUids) {
         updates.playerUids = mapSide(m.playerUids);
      }
      if (m.state?.playerUids) {
         updates['state.playerUids'] = mapSide(m.state.playerUids);
      }

      const updateOp = {};
      if (Object.keys(updates).length > 0) updateOp.$set = updates;
      if (Object.keys(unset).length > 0) updateOp.$unset = unset;

      if (Object.keys(updateOp).length > 0) {
        await matchesCol.updateOne({ _id: m._id }, updateOp);
      }
    }

    // 3. chat_messages
    logger.log('Migrating chat_messages...');
    const chatMsgs = await chatMsgCol.find({}).toArray();
    for (const c of chatMsgs) {
      const updates = {};
      const unset = {};
      if (c.senderSub) {
        updates.senderUid = subToUid.get(String(c.senderSub)) || String(c.senderSub).toLowerCase();
        unset.senderSub = "";
      }
      const nextRoomId = transformDmRoomId(c.roomId);
      if (nextRoomId !== c.roomId) updates.roomId = nextRoomId;

      const updateOp = {};
      if (Object.keys(updates).length > 0) updateOp.$set = updates;
      if (Object.keys(unset).length > 0) updateOp.$unset = unset;
      if (Object.keys(updateOp).length > 0) await chatMsgCol.updateOne({ _id: c._id }, updateOp);
    }

    // 4. messages (DMs/Inboxes)
    logger.log('Migrating messages...');
    const msgs = await msgCol.find({}).toArray();
    for (const m of msgs) {
      const updates = {};
      const unset = {};
      if (m.fromSub) {
        updates.fromUid = subToUid.get(String(m.fromSub)) || String(m.fromSub).toLowerCase();
        unset.fromSub = "";
      }
      if (m.toSub) {
        updates.toUid = subToUid.get(String(m.toSub)) || String(m.toSub).toLowerCase();
        unset.toSub = "";
      }
      if (m.senderSub) {
        updates.senderUid = subToUid.get(String(m.senderSub)) || String(m.senderSub).toLowerCase();
        unset.senderSub = "";
      }
      const nextRoomId = transformDmRoomId(m.roomId);
      if (nextRoomId !== m.roomId) updates.roomId = nextRoomId;

      const updateOp = {};
      if (Object.keys(updates).length > 0) updateOp.$set = updates;
      if (Object.keys(unset).length > 0) updateOp.$unset = unset;
      if (Object.keys(updateOp).length > 0) await msgCol.updateOne({ _id: m._id }, updateOp);
    }

    // 5. user_subscriptions
    logger.log('Migrating user_subscriptions...');
    const subs = await pushCol.find({}).toArray();
    for (const s of subs) {
      const updates = {};
      const unset = {};
      if (s.userSub) {
        updates.userUid = subToUid.get(String(s.userSub)) || String(s.userSub).toLowerCase();
        unset.userSub = "";
      }
      const updateOp = {};
      if (Object.keys(updates).length > 0) updateOp.$set = updates;
      if (Object.keys(unset).length > 0) updateOp.$unset = unset;
      if (Object.keys(updateOp).length > 0) await pushCol.updateOne({ _id: s._id }, updateOp);
    }

    // 6. puzzles
    logger.log('Migrating puzzles...');
    const puzzles = await puzzleCol.find({}).toArray();
    for (const p of puzzles) {
      const updates = {};
      const unset = {};
      if (p.createdBySub) {
        updates.createdByUid = subToUid.get(String(p.createdBySub)) || String(p.createdBySub).toLowerCase();
        unset.createdBySub = "";
      }
      const updateOp = {};
      if (Object.keys(updates).length > 0) updateOp.$set = updates;
      if (Object.keys(unset).length > 0) updateOp.$unset = unset;
      if (Object.keys(updateOp).length > 0) await puzzleCol.updateOne({ _id: p._id }, updateOp);
    }

    logger.log('Migration completed successfully.');
  } catch (err) {
    logger.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrate();

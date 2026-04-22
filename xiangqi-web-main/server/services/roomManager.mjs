import { getGamesCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { redisClient } from './cache.mjs';
import { getCurrentClock } from './gameState.mjs';
import { getMaterial } from '../moveLogic.mjs';


/**
 * Room state.
 * In-memory cache + MongoDB persistence for lobby/history across restarts.
 */
export const rooms = new Map();

export function hydrateFromDb(doc) {
  if (!doc) return null;
  const st = doc.state;
  if (!st) return null;
  return {
    ...st,
    // Legacy schema mapping
    currentPlayer: st.currentPlayer || st.turn || 'red',
    moveHistory: st.moveHistory || st.moves || [],

    // ensure serverMoveIndex is present and consistent
    serverMoveIndex: (typeof st.serverMoveIndex === 'number' && !Number.isNaN(st.serverMoveIndex)) ? st.serverMoveIndex : (st.moveHistory?.length ?? st.moves?.length ?? 0),
    // restore playerUids from top-level field (preferred) or from state
    playerUids: doc.playerUids || st.playerUids || { red: null, black: null },
    isFixed: doc.isFixed || st.isFixed || false,
    // keep time control & clocks if present
    timeMode: doc.timeMode || st.timeMode || 'standard',
    timeControl: doc.timeControl || st.timeControl || null,
    clock: doc.clock || st.clock || null,
    positionHistory: st.positionHistory || doc.positionHistory || [],
    halfMoveClock: st.halfMoveClock || doc.halfMoveClock || 0,

    // never persist ephemeral socket ids
    players: { red: null, black: null },
    playerNames: doc.playerNames || st.playerNames || { red: null, black: null },
    spectators: new Map(),
    createdBy: doc.createdBy || st.createdBy || null,
  };
};

export function serializeForDb(state) {
  return {
    ...state,
    isFixed: state.isFixed || undefined,
    createdBy: state.createdBy || undefined,
    players: { red: null, black: null },
    spectators: undefined,
  };
}

export async function loadRoom(roomId) {
  roomId = String(roomId || '').toLowerCase();
  const existing = rooms.get(roomId);
  if (existing) return existing;
  const col = await getGamesCol();
  const doc = await col.findOne({ _id: roomId });
  const st = hydrateFromDb(doc);
  if (!st) return null;
  rooms.set(roomId, st);
  return st;
}

export async function saveRoom(roomId, state, extra = {}) {
  const finalId = roomId ? String(roomId).toLowerCase() : makeRoomId();
  const col = await getGamesCol();

  const { counts, pieces, pieceCount } = getMaterial(state.board);

  await col.updateOne(
    { _id: finalId },
    {
      $set: {
        ...extra,
        updatedAt: state.updatedAt ?? Date.now(),
        createdAt: state.createdAt ?? Date.now(),
        state: serializeForDb(state),
        material: counts,
        pieces,
        pieceCount,
      },
    },
    { upsert: true }
  );
  // Invalidate game list caches so lobby refreshes promptly
  if (redisClient?.isReady) {
    try {
      const keys = await redisClient.keys('games:*');
      if (keys.length) await redisClient.del(keys);
    } catch (e) { logger.debug('[ROOM_MGR] Cache invalidation failed', e); }
  }
  return finalId;
}

export async function deleteRoom(roomId) {
  roomId = String(roomId || '').toLowerCase();
  rooms.delete(roomId);
  try {
    const col = await getGamesCol();
    await col.deleteOne({ _id: roomId });
    
    // Notify lobby
    try {
      const { getIo } = await import('../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('lobby:remove', { roomId });
    } catch (err) {
      logger.debug('[ROOM_MGR] Socket notification failed', err);
    }
  } catch (e) {
    logger.debug('[cleanup] deleteRoom failed', roomId, e);
  }
}

/** Returns true if this room is an "orphan" that should be discarded.
 *  Criteria: game not started (or ≤1 moves played), no second player present,
 *  and the room has been inactive for at least ORPHAN_TTL_MS. */
const ORPHAN_TTL_MS = 15 * 60_000; // 15 minutes
export function isOrphanRoom(state) {
  // Never sweep reserved or tournament rooms
  if (state.isFixed || state.tournamentId) return false;                  
  
  const moves = state.moveHistory?.length ?? 0;
  if (moves > 1) return false;                     // real game – keep it
  if (state.finished) return false;                // already finished
  
  const hasBothPlayers = state.playerUids?.red && state.playerUids?.black;
  if (hasBothPlayers) return false;                // two players sat down
  
  const idleMs = Date.now() - (state.updatedAt ?? 0);
  return idleMs >= ORPHAN_TTL_MS;
}

export function makeRoomId() {
  return Math.random().toString(36).slice(2, 8).toLowerCase();
}

export async function findActiveRoomForUid(uid) {
  if (!uid) return null;
  const u = String(uid);
  // Check in-memory rooms first
  for (const [roomId, state] of rooms.entries()) {
    if (!state.finished) {
      if (state.playerUids?.red === u || state.playerUids?.black === u) {
        return roomId;
      }
    }
  }
  // Check DB
  try {
    const col = await getGamesCol();
    const doc = await col.findOne({
      status: { $in: ['started', 'open'] },
      $or: [
        { 'state.playerUids.red': u },
        { 'state.playerUids.black': u }
      ]
    });
    return doc ? String(doc._id) : null;
  } catch (e) {
    logger.error('findActiveRoomForUid DB check failed', e);
    return null;
  }

}

export const getRoomStatus = (state) => {
  if (!state) return 'unknown';
  if (state.finished) return 'finished';
  if (state.started) return 'started';
  return 'open';
};

export const getRoomSummary = (roomId, state) => ({
  roomId,
  status: getRoomStatus(state),
  started: !!state.started,
  finished: !!state.finished,
  winner: state.winner,
  endedBy: state.endedBy,
  timeMode: state.timeMode || 'standard',
  timeControl: state.timeControl || null,
  clock: getCurrentClock(state),
  serverTime: Date.now(),
  setupId: state.setupId || null,
  players: {
    red: Boolean(state.playerUids?.red),
    black: Boolean(state.playerUids?.black),
    redName: state.playerNames?.red || null,
    blackName: state.playerNames?.black || null,
    redUid: state.playerUids?.red || null,
    blackUid: state.playerUids?.black || null,
    isBotRed: state.playerIsBot?.red || false,
    isBotBlack: state.playerIsBot?.black || false,
  },
  spectators: state.spectators ? Array.from(state.spectators.values()) : [],
  moveCount: state.moveHistory?.length ?? 0,
  updatedAt: state.updatedAt,
  createdAt: state.createdAt,
  thumbBoard: state.board || null,
  puzzleName: state.puzzleName || null,
  boardType: state.boardType || (state.setupId ? 'puzzle' : 'standard'),
});

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ensureIndexes } from '../mongo.mjs';
import { registerRoomHandlers } from './roomHandlers.mjs';
import { registerGameHandlers } from './gameHandlers.mjs';
import { registerChatHandlers } from './chatHandlers.mjs';
import { registerInviteHandlers } from './inviteHandlers.mjs';
import { registerChallengeHandlers } from './challengeHandlers.mjs';
import { registerEngineHandlers } from './engineHandlers.mjs';
import { registerAuthHandlers } from './authHandlers.mjs';
import { logger } from '../logger.mjs';
import { onlineUids, socketsByUid, playingRoomByUid, activityByUid, getPresenceForUid, setIo } from './presence.mjs';
import { parseCookies } from '../utils/auth.mjs';
import { rooms, saveRoom, deleteRoom, isOrphanRoom } from '../services/roomManager.mjs';
import { broadcastRoomUpdate, notifyActiveGameUpdate } from './utils.mjs';
import { checkTimeout } from '../services/gameState.mjs';
import { scoreGameIfNeeded } from '../scoring.mjs';

const APP_JWT_SECRET = process.env.APP_JWT_SECRET || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const ORPHAN_TTL_MS = 5 * 60_000;

function emitPresenceUpdate(io, uid) {
  if (!uid) return;
  io.emit('presence:update', getPresenceForUid(uid));
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });
  setIo(io);

  // Mongo indexes (best-effort)
  ensureIndexes().catch((e) => logger.error('mongo.ensureIndexes failed', e));

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake?.headers?.cookie || '');
      const token = socket.handshake?.auth?.token || cookies.xq_token;

      if (token && APP_JWT_SECRET) {
        try {
          const payload = jwt.verify(token, APP_JWT_SECRET);
          socket.data.user = payload;
          
          if (!socket.data.user.uid && socket.data.user.sub) {
            const { ensureUserFromJwtPayload } = await import('../users.mjs');
            const dbUser = await ensureUserFromJwtPayload(payload);
            if (dbUser?.uid) {
              socket.data.user.uid = dbUser.uid;
            }
          }
          
          logger.info(`[Socket] Authenticated user: ${socket.data.user.name} (uid:${socket.data.user.uid})`);
        } catch (jwtErr) {
          logger.warn('[Socket] Invalid token provided:', jwtErr.message);
          // BUG-02: Reject connection if a token was provided but is invalid
          return next(new Error('Authentication error: Invalid token'));
        }
      } else {
        logger.debug('[Socket] Unauthenticated connection (no token/cookie)');
      }
      return next();
    } catch (e) {
      logger.error('[Socket] Middleware error:', e);
      return next(new Error('Internal server error'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.user?.uid;
    if (uid) {
      const u = String(uid).toLowerCase();
      onlineUids.add(u);
      
      // Emit immediate update so others see them as online right away
      emitPresenceUpdate(io, u);

      // notify active game immediately
      notifyActiveGameUpdate(io, u);

      // Restore activity if they are already in a room (e.g. from DB)
      import('../services/roomManager.mjs').then(({ findActiveRoomForUid, rooms }) => {
        findActiveRoomForUid(u).then(roomId => {
          if (roomId) {
            playingRoomByUid.set(u, roomId);
            const state = rooms.get(roomId);
            if (state) {
               activityByUid.set(u, state.started ? 'playing' : 'waiting');
               // Join the room automatically so socket is in sync
               // Wait! The client will usually emit room:join or room:watch on its own
            }
            emitPresenceUpdate(io, u);
          }
        });
      });
      
      // Fetch full profile to share Elo/rank in presence
      import('../users.mjs').then(({ ensureUser, transformUser }) => {
        ensureUser(socket.data.user).then((dbu) => {
          if (dbu) {
            import('./presence.mjs').then(({ setPlayerInfoForUid }) => {
              const transformed = transformUser(dbu);
              setPlayerInfoForUid(u, { 
                name: transformed.name, 
                picture: transformed.picture, 
                elo: transformed.elo,
                uid: transformed.uid,
              });
              emitPresenceUpdate(io, u);
            });
          }
        });
      });

      const set = socketsByUid.get(u) || new Set();
      set.add(socket.id);
      socketsByUid.set(u, set);
      socket.join('user:' + u);
      logger.info(`[Socket] User ${u} joined room user:${u}`);
    }

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerInviteHandlers(io, socket);
    registerChallengeHandlers(io, socket);
    registerEngineHandlers(io, socket);
    registerAuthHandlers(io, socket);

    socket.on('presence:custom_status', (data) => {
      const u = socket.data.user?.uid;
      if (!u) return;
      import('./presence.mjs').then(({ setCustomStatus }) => {
        setCustomStatus(u, data.status);
      });
    });

    socket.on('presence:list', () => {
      const me = socket.data.user?.uid;
      import('./presence.mjs').then(({ getPresenceForUid, onlineUids }) => {
        const list = Array.from(onlineUids).map(u => getPresenceForUid(u, me));
        socket.emit('presence:list', { ok: true, presence: list });
      });
    });

    socket.on('room:active_check', () => {
      const u = socket.data.user?.uid;
      if (u) notifyActiveGameUpdate(io, String(u));
    });

    socket.on('messages:inbox', async () => {
      const myUid = socket.data.user?.uid;
      if (!myUid) return socket.emit('messages:inbox', { ok: false, error: 'UNAUTHORIZED' });
      try {
        const { getMessagesCol } = await import('../mongo.mjs');
        const col = await getMessagesCol();
        const docs = await col
          .find({ $or: [{ fromUid: myUid }, { toUid: myUid }] })
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        // Mark as read immediately on initial fetch if wanted
        const unreadIds = docs.filter(d => d.toUid === myUid && d.status === 'unread').map(d => d._id);
        if (unreadIds.length > 0) {
          await col.updateMany({ _id: { $in: unreadIds } }, { $set: { status: 'read' } });
          docs.forEach(d => { if (unreadIds.includes(d._id)) d.status = 'read'; });
        }
        socket.emit('messages:inbox', { ok: true, messages: docs });
      } catch (e) {
        logger.error('[Socket] messages:inbox failed', e);
        socket.emit('messages:inbox', { ok: false, error: 'INBOX_FAILED' });
      }
    });

    socket.on('disconnect', async () => {
      try {
        const uid = socket.data.user?.uid;
        if (uid) {
          const u = String(uid).toLowerCase();
          
          // Persistent presence: ONLY clear playing status if NOT in an active match.
          // This allows users to remain "Playing" in the lobby even if they disconnect temporarily.
          const activeRoomId = playingRoomByUid.get(u);
          const state = activeRoomId ? rooms.get(activeRoomId) : null;
          const isMatchActive = state && !state.finished && (state.playerUids?.red === u || state.playerUids?.black === u);

          if (!isMatchActive) {
            playingRoomByUid.delete(u);
            activityByUid.delete(u);
          }
          
          const set = socketsByUid.get(u);
          if (set) {
            set.delete(socket.id);
            if (set.size === 0) {
              logger.info(`[Socket] User ${u} went offline (all sockets disconnected)`);
              socketsByUid.delete(u);
              onlineUids.delete(u);
            } else {
              socketsByUid.set(u, set);
            }
          } else {
            onlineUids.delete(u);
          }
          emitPresenceUpdate(io, u);
        }
      } catch (e) {
        logger.debug('[Socket] User disconnect cleanup failed', e);
      }

      const { roomId, side, role } = socket.data || {};
      if (!roomId) return;
      const state = rooms.get(roomId);
      if (!state) return;

      // spectators
      if (role === 'spectator' || !side) {
        state.spectators.delete(socket.id);
        state.updatedAt = Date.now();
        saveRoom(roomId, state).catch(err => logger.debug('Spectator disconnect save failed', err));
        broadcastRoomUpdate(io, roomId);
        return;
      }

      // players
      if (state.players[side] === socket.id) state.players[side] = null;
      
      const moves = state.moveHistory?.length ?? 0;
      // 1. Game NOT started and NO moves: Clean up seat
      if (!state.started && !state.finished && !state.isFixed && moves === 0) {
        state.playerUids[side] = null;
      }
      // 2. Game started but NO moves: Un-start and clean up seat
      else if (state.started && !state.finished && moves === 0) {
        state.started = false;
        if (!state.isFixed) {
          state.playerUids[side] = null;
          if (state.playerNames) state.playerNames[side] = null;
        }
        
        // Notify remaining players that the game has been un-started
        const { createInitialState } = await import('../services/gameState.mjs');
        const st = createInitialState({ timeMode: state.timeMode, timeControl: state.timeControl, setupId: state.setupId });
        state.board = st.board;
        state.clock = st.clock;
        state.currentPlayer = st.currentPlayer;
        
        io.to(roomId).emit('game:state', {
          ok: true,
          roomId,
          started: false,
          moveHistory: [],
          clock: state.clock,
          currentPlayer: state.currentPlayer,
        });
      }
      state.updatedAt = Date.now();

      const noPlayersLeft = !state.players.red && !state.players.black;
      const tinyGameDc = moves === 0;
      if (noPlayersLeft && tinyGameDc && !state.finished && !state.isFixed) {
        logger.info(`[cleanup] room ${roomId} has no players and 0 moves on disconnect – will be swept`);
      } else {
        saveRoom(roomId, state).catch(err => logger.debug('Player disconnect save failed', err));
      }

      io.to(roomId).emit('room:players', {
        roomId,
        players: {
          red: Boolean(state.players.red),
          black: Boolean(state.players.black),
        },
        playerUids: state.playerUids,
        playerNames: state.playerNames,
        spectators: Array.from(state.spectators.values()),
        started: state.started,
        finished: state.finished,
        winner: state.winner,
        endedBy: state.endedBy,
      });

      broadcastRoomUpdate(io, roomId);
    });
  });

  // Background timeout checker (server-authoritative) + orphan sweeper
  async function runSweeperLoop() {
    const now = Date.now();
    for (const [roomId, state] of rooms.entries()) {
      try {
        if (isOrphanRoom(state)) {
          logger.info(`[cleanup] sweeping orphan room ${roomId} (moves=${state.moveHistory?.length ?? 0}, idle=${Math.round((now - (state.updatedAt ?? 0)) / 1000)}s)`);
          deleteRoom(roomId).catch(err => logger.debug('Orphan room sweep failed', err));
          continue;
        }

        // 15-minute offline creator sweep (requested)
        if (!state.started && !state.finished && state.createdBy) {
          const creatorUid = String(state.createdBy);
          const isCreatorOnline = onlineUids.has(creatorUid);
          const idleMs = now - (state.updatedAt ?? 0);
          const FIFTEEN_MINS_MS = 15 * 60_000;

          if (!isCreatorOnline && idleMs >= FIFTEEN_MINS_MS) {
            logger.info(`[cleanup] sweeping room ${roomId} - creator ${creatorUid} offline for 15m+`);
            deleteRoom(roomId).catch(err => logger.debug('Offline creator room sweep failed', err));
            broadcastRoomUpdate(io, roomId);
            continue;
          }
        }

        const t = checkTimeout(state, now);
        if (!t) continue;

        state.finished = true;
        state.started = false;
        state.endedBy = 'timeout';
        state.winner = t.loser === 'red' ? 'black' : 'red';
        state.updatedAt = now;

        const moves = state.moveHistory?.length ?? 0;
        if (moves <= 1 && !state.playerUids?.red && !state.playerUids?.black) {
          deleteRoom(roomId).catch(err => logger.debug('Short game timeout room sweep failed', err));
        } else {
          void saveRoom(roomId, state, { status: 'finished', clock: state.clock, playerUids: state.playerUids });
          io.to(roomId).emit('game:over', { roomId, finished: true, winner: state.winner, endedBy: state.endedBy });
          broadcastRoomUpdate(io, roomId);
          void scoreGameIfNeeded(roomId);
        }
      } catch (e) {
        logger.error('[Socket] timeout tick failed', e);
      }
    }
    setTimeout(runSweeperLoop, 1000);
  }

  // Start the background sweeper
  runSweeperLoop();

  return io;
}

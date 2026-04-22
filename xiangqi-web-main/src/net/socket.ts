import { io, type Socket } from 'socket.io-client';
import { logger } from '../utils/logger';
import { SOCKET_URL } from '../auth/auth';
import type { Move, PieceSide } from '../types';

export type RoomId = string;

export type JoinRoomAck =
  | {
      ok: true;
      roomId: RoomId;
      side: PieceSide;
      started: boolean;
      finished?: boolean;
      winner?: PieceSide | null;
      endedBy?: 'checkmate' | 'stalemate' | null;
      serverMoveIndex: number;
      currentPlayer: PieceSide;
      moveHistory: any[];
    }
  | { ok: false; error: string; serverMoveIndex?: number };

export type WatchRoomAck =
  | {
      ok: true;
      roomId: RoomId;
      role: 'spectator';
      started: boolean;
      finished: boolean;
      winner: PieceSide | null;
      endedBy: 'checkmate' | 'stalemate' | null;
      serverMoveIndex: number;
      currentPlayer: PieceSide;
      moveHistory: any[];
    }
  | { ok: false; error: string };

export type LobbyRoomSummary = {
  roomId: RoomId;
  status: 'open' | 'started' | 'finished' | string;
  started: boolean;
  finished: boolean;
  winner: PieceSide | null;
  endedBy: 'checkmate' | 'stalemate' | 'timeout' | null;
  timeMode?: 'blitz' | 'rapid' | 'standard' | 'slow' | string;
  timeControl?: { totalMs: number; perMoveMs: number } | null;
  clock?: any;
  setupId?: string | null;
  players: { 
    red: boolean; 
    black: boolean; 
    redName?: string | null; 
    blackName?: string | null;
    redUid?: string | null;
    blackUid?: string | null;
  };
  spectators: number | { uid: string; name: string; picture: string | null }[] | any;
  moveCount: number;
  updatedAt?: number;
  createdAt?: number;
  thumbBoard?: any | null;
  thumbPosition?: string[] | null;
};

export type LobbyListAck = { ok: true; rooms: LobbyRoomSummary[] } | { ok: false; error: string };

export type CreateRoomAck = { ok: true; roomId: RoomId } | { ok: false; error: string };

export type MoveAck =
  | { ok: true; serverMoveIndex: number; currentPlayer: PieceSide }
  | { ok: false; error: string; serverMoveIndex?: number };

export type GameMoveBroadcast = {
  roomId: RoomId;
  move: Move;
  side: PieceSide;
  serverMoveIndex: number;
  currentPlayer: PieceSide;
  started?: boolean;
};

export type RoomPlayersBroadcast = {
  roomId: RoomId;
  players: { red: boolean; black: boolean };
  playerUids?: { red: string | null; black: string | null };
  spectators: { uid: string, name: string, picture: string | null }[];
  started: boolean;
  finished?: boolean;
  winner?: PieceSide | null;
  endedBy?: 'checkmate' | 'stalemate' | 'timeout' | null;
};

export type ChatMessage = {
  roomId: RoomId;
  senderUid: string;
  senderName: string;
  senderPicture?: string | null;
  text: string;
  createdAt: number;
  type?: 'text' | 'challenge' | 'puzzle_challenge' | 'new_follower';
  status?: 'unread' | 'read' | 'accepted' | 'declined';
  messageId?: string;
  challengeConfig?: { mode?: string; puzzleId?: string; roomId?: string };
};

export type GameOverBroadcast = {
  roomId: RoomId;
  finished: true;
  winner: PieceSide;
  endedBy: 'checkmate' | 'stalemate';
};

// let socket: Socket | null = null;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'], // Try websocket first
    // Use a function so the LATEST token is always read on every (re)connect attempt
    auth: (cb) => {
      let token: string | null = null;
      try { token = localStorage.getItem('xq:token'); } catch (e) { logger.debug('localStorage.getItem(xq:token) failed', e); token = null; }
      cb(token ? { token } : {});
    },
  });

  socket.on('connect', () => {
    logger.info(`[Socket] Connected to ${SOCKET_URL} (id: ${socket?.id})`);
  });
  socket.on('disconnect', (reason) => {
    logger.warn(`[Socket] Disconnected from ${SOCKET_URL}. Reason: ${reason}`);
  });
  socket.on('connect_error', (err) => {
    logger.error(`[Socket] Connection error for ${SOCKET_URL}:`, err.message);
  });

  return socket;
}

export function reconnectSocket(newToken: string | null) {
  if (socket) {
    socket.auth = newToken ? { token: newToken } : {};
    socket.disconnect().connect();
  }
}

export function createRoom(
  timeMode?: 'blitz' | 'rapid' | 'standard' | 'slow',
  setupId?: string | null
): Promise<CreateRoomAck> {
  const s = getSocket();
  return new Promise((resolve) =>
    s.emit('room:create', { timeMode, setupId: setupId || null }, (ack: CreateRoomAck) => resolve(ack))
  );
}

export function joinRoom(roomId: string, side?: PieceSide): Promise<JoinRoomAck> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('room:join', { roomId, side }, (ack: JoinRoomAck) => resolve(ack)));
}

export function leaveRoom(roomId: string, explicit = false): Promise<void> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('room:leave', { roomId, explicit }, () => resolve()));
}

export function requestSwap(roomId: string): Promise<any> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('room:swap', { roomId }, resolve));
}

export function respondSwap(roomId: string, accept: boolean): Promise<any> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('room:swap', { roomId, accept }, resolve));
}

export function requestSync(roomId: string): Promise<any> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('game:sync', { roomId }, (ack: any) => resolve(ack)));
}

export function sendMove(params: {
  roomId: string;
  move: Move;
  clientMoveIndex: number;
  lastServerMoveIndex: number;
}): Promise<MoveAck> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('game:move', params, (ack: MoveAck) => resolve(ack)));
}

export function resignGame(roomId: string): Promise<any> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('game:resign', { roomId }, (ack: any) => resolve(ack)));
}

export function lobbyList(): Promise<LobbyListAck> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('lobby:list', (ack: LobbyListAck) => resolve(ack)));
}

export function watchRoom(roomId: string): Promise<WatchRoomAck> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('room:watch', { roomId }, (ack: WatchRoomAck) => resolve(ack)));
}

export function findMyRoom(): Promise<{ ok: boolean; roomId?: string }> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('room:mine', (ack: { ok: boolean; roomId?: string }) => resolve(ack)));
}

export function fetchInboxSocket(): Promise<any> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('messages:inbox', (ack: any) => resolve(ack)));
}

export function requestEngineBestMove(params: {
  board: (any | null)[][];
  side: PieceSide;
  movetimeMs: number;
  botId?: string;
  history?: string[];
  initialFen?: string;
}): Promise<any> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('engine:bestmove', params, (ack: any) => resolve(ack)));
}

export function fetchMeSocket(): Promise<any> {
  const s = getSocket();
  const TIMEOUT_MS = 5000;

  const emitAuthMe = (socket: Socket, resolve: (val: any) => void) => {
    const timeout = setTimeout(() => {
      logger.warn('[Socket] fetchMeSocket timeout');
      resolve({ ok: false, error: 'TIMEOUT' });
    }, TIMEOUT_MS);

    socket.emit('auth:me', (ack: any) => {
      clearTimeout(timeout);
      resolve(ack);
    });
  };

  if (s.connected) {
    return new Promise((resolve) => emitAuthMe(s, resolve));
  }
  
  return new Promise((resolve) => {
    const onConnect = () => {
      emitAuthMe(s, resolve);
    };
    s.once('connect', onConnect);
    
    // Safety fallback if never connects
    setTimeout(() => {
      if (!s.connected) {
        s.off('connect', onConnect);
        resolve({ ok: false, error: 'CONNECT_TIMEOUT' });
      }
    }, TIMEOUT_MS);
  });
}

export type BotTauntEvent = {
  botId: string;
  name: string;
  personality: string;
  taunt: string;
};

/**
 * Subscribe to bot:taunt events emitted after each bot move.
 * Returns an unsubscribe function to call on cleanup.
 */
export function subscribeToBotTaunt(handler: (event: BotTauntEvent) => void): () => void {
  const s = getSocket();
  s.on('bot:taunt', handler);
  return () => s.off('bot:taunt', handler);
}


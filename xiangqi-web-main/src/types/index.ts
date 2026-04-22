export type PieceType = 'general' | 'advisor' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'soldier';
export type PieceSide = 'red' | 'black';

export interface Piece {
  id: string;
  type: PieceType;
  side: PieceSide;
  position: { row: number; col: number };
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isCheck?: boolean;
  fen?: string;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: PieceSide;
  moveHistory: Move[];
  capturedPieces: { red: Piece[]; black: Piece[] };
  isCheck: boolean;
  winner: PieceSide | null;
}

export type AiLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AiConfig {
  enabled: boolean;
  side: PieceSide;
  level: AiLevel;
  engine?: 'web' | 'pikafish';
}

export type ReplayMove = {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isCheck?: boolean;
  fen?: string;
  lastMove?: { from: Position; to: Position };
};

export type RoomId = string;

export type BetType = 'none' | 'gifts';

export interface ChallengeConfig {
  timeMode: 'blitz' | 'rapid' | 'standard' | 'slow';
  boardType: 'standard' | 'puzzle';
  betType: BetType;
  betGiftType?: 'ring' | 'bear' | 'candy';
  betGiftAmount?: number;
  puzzleId?: string;
  message?: string;
  /** Private room: spectators not allowed, ELO not affected */
  isPrivate?: boolean;
}

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
  players: { red: boolean; black: boolean; redName?: string | null; blackName?: string | null; redUid?: string | null; blackUid?: string | null };
  spectators: { uid: string, name: string, picture: string | null }[];
  moveCount: number;
  updatedAt?: number;
  createdAt?: number;
};

export type GameMoveBroadcast = {
  roomId: string;
  move: Move;
  side: PieceSide;
  serverMoveIndex: number;
  currentPlayer: PieceSide;
  started?: boolean;
  clock?: any;
  serverTime?: number;
};

export type RoomPlayersBroadcast = {
  roomId: RoomId;
  players: { red: boolean; black: boolean };
  playerUids?: { red: string | null; black: string | null };
  playerNames?: { red: string | null; black: string | null };
  spectators: { uid: string, name: string, picture: string | null }[];
  started: boolean;
  finished?: boolean;
  winner?: PieceSide | null;
  endedBy?: 'checkmate' | 'stalemate' | 'timeout' | null;
};

export type GameOverBroadcast = {
  roomId: RoomId;
  finished: true;
  winner: PieceSide;
  endedBy: 'checkmate' | 'stalemate';
};

export const PIECE_CHARS: Record<PieceType, { red: string; black: string }> = {
  general: { red: '帥', black: '將' },
  advisor: { red: '仕', black: '士' },
  elephant: { red: '相', black: '象' },
  horse: { red: '馬', black: '馬' },
  chariot: { red: '車', black: '車' },
  cannon: { red: '炮', black: '砲' },
  soldier: { red: '兵', black: '卒' },
};

import type { Move, Piece, PieceSide, Position } from '../types';
import { requestEngineBestMove } from '../net/socket';

export async function requestPikafishBestMove(params: {
  board: (Piece | null)[][];
  side: PieceSide;
  movetimeMs: number;
  engine?: 'pikafish' | 'web';
  botId?: string;
  history?: string[];
  initialFen?: string;
}): Promise<{ ok: true; from: Position; to: Position } | { ok: false; error: string }> {
  try {
    const data = await requestEngineBestMove(params);
    if (!data?.ok) return { ok: false, error: data?.error || 'ENGINE_ERROR' };
    return { ok: true, from: data.from, to: data.to };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export function findPieceAt(board: (Piece | null)[][], pos: Position): Piece | null {
  return board[pos.row]?.[pos.col] ?? null;
}

export function makeMoveFromCoords(board: (Piece | null)[][], from: Position, to: Position): Move | null {
  const piece = findPieceAt(board, from);
  if (!piece) return null;
  const captured = board[to.row]?.[to.col] ?? undefined;
  return { from, to, piece, capturedPiece: captured ?? undefined };
}

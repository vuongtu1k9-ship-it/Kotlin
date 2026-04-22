import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createInitialBoard } from '../state/initialBoard';
import { isInCheck, isCheckmate, isStalemate } from '../utils/moveLogic';
import { chooseAiMove } from '../ai/ai';
import { boardToFen } from '../utils/fen';
import { logger } from '../utils/logger';
import { playGameSound } from '../utils/audio';
import type { Piece, Move, PieceSide, AiConfig, Position, ReplayMove } from '../types';

interface UseBoardStateProps {
  initialBoard?: (Piece | null)[][];
  initialPlayer?: PieceSide;
  initialHistory?: { from: Position; to: Position }[];
  side?: PieceSide;
  ai?: AiConfig;
  roomId?: string;
  historyViewIndex?: number | null;
  initialStarted?: boolean;
}

export const useBoardState = ({
  initialBoard,
  initialPlayer,
  initialHistory,
  side,
  ai,
  roomId,
  historyViewIndex: externalHistoryViewIndex,
  initialStarted,
}: UseBoardStateProps) => {

  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PieceSide>(initialPlayer || 'red');
  const [board, setBoard] = useState<(Piece | null)[][]>(() => (initialBoard ? initialBoard : createInitialBoard()));
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [initialFen, setInitialFen] = useState<string>(() => {
    try {
      return boardToFen(initialBoard || createInitialBoard(), initialPlayer || 'red');
    } catch (err) {
      console.error('[useBoardState] Failed to calculate initial Fen, falling back to initial board:', err);
      return boardToFen(createInitialBoard(), 'red');
    }
  });
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position; capturedPiece?: Piece } | null>(null);
  
  const [mySide, setMySide] = useState<PieceSide | null>(side || null);
  const [started, setStarted] = useState<boolean>(!!initialStarted);
  const [onlineHistory, setOnlineHistory] = useState<Move[]>([]);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [internalHistoryViewIndex, setInternalHistoryViewIndex] = useState<number | null>(null);
  const historyViewIndex = externalHistoryViewIndex !== undefined ? externalHistoryViewIndex : internalHistoryViewIndex;

  const [serverFinished, setServerFinished] = useState<boolean>(false);
  const [serverWinner, setServerWinner] = useState<PieceSide | null>(null);
  const [serverEndedBy, setServerEndedBy] = useState<'checkmate' | 'stalemate' | 'timeout' | 'resign' | 'draw' | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStarted) setStarted(true);
  }, [initialStarted]);

  const onlineHistoryRef = useRef<Move[]>([]);
  useEffect(() => { onlineHistoryRef.current = onlineHistory; }, [onlineHistory]);

  // Re-sync board/player from props if they change (metadata hydration)
  useEffect(() => {
    // CRITICAL: If we have a roomId, the socket/sync handles the board state.
    // metadata hydration (initialBoard/initialPlayer) should only trigger for offline/initial mount.
    if (roomId) return; 

    if (initialBoard && moveHistory.length === 0) {
      setBoard(initialBoard.map(r => r.slice()));
      const startPlayer = initialPlayer || 'red';
      setCurrentPlayer(startPlayer);
      setInitialFen(boardToFen(initialBoard, startPlayer));
    } else if (initialPlayer && moveHistory.length === 0) {
      setCurrentPlayer(initialPlayer);
      setInitialFen(boardToFen(board, initialPlayer));
    }
  }, [initialBoard, initialPlayer, moveHistory.length, roomId]);

  const inCheck = useMemo(() => isInCheck(currentPlayer, board), [currentPlayer, board]);
  const inCheckmate = useMemo(() => isCheckmate(currentPlayer, board), [currentPlayer, board]);
  const inStalemate = useMemo(() => isStalemate(currentPlayer, board), [currentPlayer, board]);
  
  const hasKings = useMemo(() => {
    let red = false, black = false;
    for (const row of board) {
      for (const p of row) {
        if (p?.type === 'general') {
          if (p.side === 'red') red = true;
          else black = true;
        }
      }
    }
    return red && black;
  }, [board]);

  const localGameOver = hasKings && (inCheckmate || inStalemate);
  const localWinner: PieceSide | null = localGameOver ? (currentPlayer === 'red' ? 'black' : 'red') : null;
  const onlineGameOver = !!roomId && serverFinished;
  const gameOver = roomId ? onlineGameOver : localGameOver;
  const winner: PieceSide | null = roomId ? serverWinner : localWinner;
  const endedBy = roomId ? serverEndedBy : inCheckmate ? 'checkmate' : inStalemate ? 'stalemate' : null;

  // Capture the VERY FIRST initialBoard we get and stick with it for history replays.
  // This prevents the "current board" from being used as the "base board" after a refresh.
  const trueInitialBoardRef = useRef<(Piece | null)[][] | null>(null);
  if (!trueInitialBoardRef.current && initialBoard) {
    trueInitialBoardRef.current = initialBoard;
  }

  const replayFromHistory = useCallback((history: any[], current: PieceSide, boardOverride?: (Piece | null)[][], persistHistory = true) => {
    // If a direct board state is provided (e.g. from Sync), use it as authoritative
    if (boardOverride) {
      setBoard(boardOverride);
      if (persistHistory) setMoveHistory(history as any);
      setCurrentPlayer(current);
      setSelectedCell(null);
      setValidMoves([]);
      if (history.length > 0) {
        const last = history[history.length - 1];
        setLastMove({ from: last.from, to: last.to });
      }
      return;
    }

    // Normal history replay (e.g. Navigation): Start from move-0 board
    const baseBoard = trueInitialBoardRef.current;
    const b = baseBoard ? baseBoard.map((r) => r.slice()) : createInitialBoard();
    
    history.forEach((m) => {
      const moving = b[m.from.row][m.from.col] ?? m.piece;
      if (!moving) return;
      b[m.from.row][m.from.col] = null;
      b[m.to.row][m.to.col] = { ...moving, position: { ...m.to }, hasMoved: true };
    });
    setBoard(b);
    if (persistHistory) setMoveHistory(history as any);
    setCurrentPlayer(current);
    setSelectedCell(null);
    setValidMoves([]);
    if (history.length > 0) {
      const last = history[history.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  }, []); // Truly stable ref — using trueInitialBoardRef and createInitialBoard internally

  // Sync board when historyViewIndex changes (for pre/next nav)
  const lastViewedIndex = useRef<number | null>(null);
  useEffect(() => {
    if (historyViewIndex === null) {
      if (lastViewedIndex.current !== null) {
        // Just returned to live edge: Replay full history from AUTHORITATIVE source
        const historyToUse = roomId ? onlineHistory : moveHistory;
        const nextPlayer = (initialPlayer || 'red') === 'red' 
          ? (historyToUse.length % 2 === 0 ? 'red' : 'black')
          : (historyToUse.length % 2 === 0 ? 'black' : 'red');
        
        console.log(`[Board DEBUG] Returning to Live: HistoryLength=${historyToUse.length}, NextPlayer=${nextPlayer}`);
        replayFromHistory(historyToUse, nextPlayer, undefined, false);
        
        // Also sync moveHistory so the visual MoveList is up to date
        if (roomId && moveHistory.length !== onlineHistory.length) {
          setMoveHistory(onlineHistory);
        }
        
        lastViewedIndex.current = null;
      }
      return;
    }
    
    // Viewing history: Re-calculate board at that index
    const historyToSlice = (roomId ? onlineHistory : moveHistory);
    const sliced = historyToSlice.slice(0, historyViewIndex);
    const nextPlayer = (initialPlayer || 'red') === 'red' 
      ? (sliced.length % 2 === 0 ? 'red' : 'black')
      : (sliced.length % 2 === 0 ? 'black' : 'red');
    
    console.log(`[Board DEBUG] Navigating History: Index=${historyViewIndex}, TotalAvailable=${historyToSlice.length}, Sliced=${sliced.length}, NextPlayer=${nextPlayer}`);
    replayFromHistory(sliced, nextPlayer, undefined, false);
    lastViewedIndex.current = historyViewIndex;
  }, [historyViewIndex, moveHistory, onlineHistory, roomId, initialPlayer, replayFromHistory]);

  // Initial history application (for practice illustrations)
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0 && moveHistory.length === 0) {
      const nextPlayer = (initialPlayer || 'red') === 'red' 
        ? (initialHistory.length % 2 === 0 ? 'red' : 'black')
        : (initialHistory.length % 2 === 0 ? 'black' : 'red');
      
      replayFromHistory(initialHistory, nextPlayer);
    }
  }, [initialHistory, initialPlayer, moveHistory.length, replayFromHistory]);

  const applyMove = useCallback((move: ReplayMove | Move, nextPlayerOverride?: PieceSide) => {
    console.log('[applyMove] called with:', JSON.stringify(move));
    setBoard((prev) => {
      const next = prev.map((r) => r.slice());
      const moving = next[move.from.row][move.from.col] ?? (move as any).piece;
      if (!moving) {
        console.error('[applyMove] FAILED: Piece not found at', move.from, 'and move.piece is missing');
        return prev;
      }
      console.log('[applyMove] Found piece:', moving.type, moving.side, 'at', move.from);
      
      // Capture the piece that is about to be overwritten
      const captured = (move as any).capturedPiece || next[move.to.row][move.to.col];
      setLastMove({ from: move.from, to: move.to, capturedPiece: captured || undefined });

      if (captured) {
        playGameSound('capture');
      } else {
        playGameSound('move');
      }

      next[move.from.row][move.from.col] = null;
      next[move.to.row][move.to.col] = { ...moving, position: { ...move.to }, hasMoved: true };
      return next;
    });
    
    setMoveHistory((prev) => prev.concat(move as any));
    setSelectedCell(null);
    setValidMoves([]);
    // Use functional update so applyMove doesn't depend on currentPlayer
    setCurrentPlayer((prev) => nextPlayerOverride ?? (prev === 'red' ? 'black' : 'red'));
  }, []); // stable ref — no currentPlayer dependency

  const lastAiRequestedPlyRef = useRef<number>(-1);

  useEffect(() => {
    if (roomId) return;
    
    const currentPly = moveHistory.length;
    
    if (!ai?.enabled || gameOver || currentPlayer !== ai.side || historyViewIndex !== null) {
      // Reset ref if it's no longer AI's turn or game ended
      if (currentPlayer !== ai?.side) lastAiRequestedPlyRef.current = -1;
      return;
    }

    // Guard: Don't request again if we've already requested for this ply
    if (lastAiRequestedPlyRef.current === currentPly) return;

    let cancelled = false;
    const timeout = setTimeout(() => {
      logger.info(`[AI] Requesting move: side=${ai.side}, level=${ai.level}, engine=${ai.engine}, history=${currentPly}`);
      setIsAiThinking(true);
      lastAiRequestedPlyRef.current = currentPly; // Mark as requested

      chooseAiMove({ 
        board, 
        side: ai.side, 
        level: ai.level, 
        engine: ai.engine, 
        history: moveHistory,
        initialFen
      })
        .then((m) => {
          if (!cancelled && m) {
            console.log('[AI] Applying move:', JSON.stringify(m));
            applyMove(m);
            setError(null);
          } else if (!m) {
            console.warn('[AI] No move returned by chooseAiMove');
          }
        })
        .catch((err) => {
          if (!cancelled) {
            logger.error('[AI] Move error received in hook:', err);
            setError(err.message || String(err));
          }
        })
        .finally(() => {
          setIsAiThinking(false);
        });
    }, 1000);
    return () => { cancelled = true; clearTimeout(timeout); };
  // applyMove is now stable (no currentPlayer dep) so safe to include
  }, [ai, board, currentPlayer, gameOver, roomId, applyMove, historyViewIndex]);

  return {
    board, setBoard,
    currentPlayer, setCurrentPlayer,
    selectedCell, setSelectedCell,
    validMoves, setValidMoves,
    moveHistory, setMoveHistory,
    onlineHistory, setOnlineHistory,
    onlineHistoryRef,
    lastMove, setLastMove,
    mySide, setMySide,
    started, setStarted,
    isAiThinking,
    replayIndex, setReplayIndex,
    historyViewIndex, setHistoryViewIndex: setInternalHistoryViewIndex,
    serverFinished, setServerFinished,
    serverWinner, setServerWinner,
    serverEndedBy, setServerEndedBy,
    inCheck, gameOver, winner, endedBy,
    replayFromHistory,
    applyMove,
    error, setError,
    undo: useCallback(() => {
      if (roomId) return; // Online undo not supported yet
      setInternalHistoryViewIndex(null); // Exit history view on real undo
      setMoveHistory((prev) => {
        const steps = ai?.enabled ? 2 : 1;
        if (prev.length < steps) return prev;
        const newHistory = prev.slice(0, -steps);
        
        // Update player immediately to prevent AI from triggering
        const nextPlayer = (initialPlayer || 'red') === 'red' 
          ? (newHistory.length % 2 === 0 ? 'red' : 'black')
          : (newHistory.length % 2 === 0 ? 'black' : 'red');
        setCurrentPlayer(nextPlayer);
        
        // Use a small delay for board sync to ensure setMoveHistory has settled
        setTimeout(() => {
          replayFromHistory(newHistory, nextPlayer, undefined, false);
        }, 0);
        return newHistory;
      });
    }, [ai?.enabled, roomId, replayFromHistory, initialPlayer]),
  };
};

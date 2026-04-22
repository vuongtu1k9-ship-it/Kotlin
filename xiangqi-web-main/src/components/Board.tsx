import React, { useEffect, useMemo, useState, useRef, useCallback, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BoardSVG } from './BoardSVG';
import { BoardHeader } from './BoardHeader';
import { BoardInfo } from './BoardInfo';
import { BoardControls } from './BoardControls';
import { MatchDetails } from './MatchDetails';
import { ExportButtons } from './ExportButtons';
import { MoveList } from './MoveList';
import { useToast } from './ui/Toast';

const AiThinkingOverlay = lazy(() => import('./board/AiThinkingOverlay').then(m => ({ default: m.AiThinkingOverlay })));
const GameOverOverlay = lazy(() => import('./board/GameOverOverlay').then(m => ({ default: m.GameOverOverlay })));
const BoardBanner = lazy(() => import('./board/BoardBanner').then(m => ({ default: m.BoardBanner })));
const CheckNotify = lazy(() => import('./board/CheckNotify').then(m => ({ default: m.CheckNotify })));
import { BoardGrid } from './board/BoardGrid';

import { useBoardState } from '../hooks/useBoardState';
import { useBoardSocket } from '../hooks/useBoardSocket';
import { useBoardTimer } from '../hooks/useBoardTimer';
import { getSocket, leaveRoom, lobbyList, joinRoom, requestSwap, resignGame } from '../net/socket';
import { isLegalMove } from '../utils/moveLogic';
import { createInitialBoard } from '../state/initialBoard';
import { useAuth } from '../auth/AuthContext';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';
import { logger } from '../utils/logger';
import { playGameSound } from '../utils/audio';

import type { Piece, PieceSide, AiConfig, ReplayMove, LobbyRoomSummary } from '../types';
import './Board.css';

interface BoardProps {
  hideLobby?: boolean;
  autoJoin?: { roomId: string };
  ai?: AiConfig;
  replay?: { history: ReplayMove[]; index: number };
  onReplayIndexChange?: (index: number | null) => void;
  initialBoard?: (Piece | null)[][];
  initialPlayer?: PieceSide;
  side?: PieceSide;
  initialPlayerUids?: { red: string | null; black: string | null };
  initialPlayerNames?: { red: string | null; black: string | null };
  children?: React.ReactNode;
  hideSidebar?: boolean;
  moveListBelow?: boolean;
  highlightZones?: ('palace' | 'river')[];
  onCellHover?: (row: number, col: number, e: React.MouseEvent) => void;
  onCellLeave?: () => void;
  initialHistory?: { from: { row: number; col: number }; to: { row: number; col: number } }[];
  historyViewIndex?: number | null;
  onHistoryViewIndexChange?: (index: number | null) => void;
  roomId?: string;
  onGameOver?: (result: { winner: PieceSide | null; endedBy: string | null }) => void;
  onScored?: (s: any) => void;
  onStateChange?: (state: any) => void;
  initialStarted?: boolean;
  h2h?: { u1Wins: number; u2Wins: number; draws: number; total: number } | null;
}

export interface BoardRef {
  undo: () => void;
  newGame: () => void;
  resign: () => void;
  draw: () => void;
  swap: () => void;
  leave: () => void;
}

export const Board = React.forwardRef<BoardRef, BoardProps>(({
  hideLobby, autoJoin, ai, replay, onReplayIndexChange, initialBoard, initialPlayer, side,
  initialPlayerUids, initialPlayerNames, children, hideSidebar, moveListBelow, highlightZones,
  onCellHover, onCellLeave, initialHistory, roomId: roomIdProp, onGameOver: onGameOverProp,
  onScored: onScoredProp,
  onStateChange, historyViewIndex: historyViewIndexProp, onHistoryViewIndexChange, initialStarted,
  h2h
}, ref) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const myUid = authState.user?.uid ?? null;
  const { presenceMap } = useOnlinePlayers();
  const [lobbyRooms, setLobbyRooms] = useState<LobbyRoomSummary[]>([]);
  const [socketConnected, setSocketConnected] = useState<{ red: boolean; black: boolean }>({ red: false, black: false });
  const [playerProfiles, setPlayerProfiles] = useState<{ red: any; black: any }>(() => {
    if (replay && initialPlayerNames) {
      return {
        red: initialPlayerNames.red ? { name: initialPlayerNames.red, picture: null, elo: 1200, rank: null } : null,
        black: initialPlayerNames.black ? { name: initialPlayerNames.black, picture: null, elo: 1200, rank: null } : null,
      };
    }
    return { red: null, black: null };
  });
  const [playerUids, setPlayerUids] = useState<{ red: string | null; black: string | null }>(
    initialPlayerUids || { red: null, black: null }
  );
  const [spectators, setSpectators] = useState<any[]>([]);
  const [serverMoveIndex, setServerMoveIndex] = useState<number>(0);
  const [serverClockOffset, setServerClockOffset] = useState<number>(0);
  const [roomSummary, setRoomSummary] = useState<any>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [roomId] = useState<string>(roomIdProp || autoJoin?.roomId || '');
  const [dismissedGameOver, setDismissedGameOver] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showCheckNotify, setShowCheckNotify] = useState<boolean>(false);
  const [checkNotifyKey, setCheckNotifyKey] = useState<number>(0);
  const pieceStyle = localStorage.getItem('xq:piece_style') || 'traditional';

  const {
    board, setBoard, currentPlayer, setCurrentPlayer, selectedCell, setSelectedCell,
    validMoves, setValidMoves, moveHistory, setMoveHistory, onlineHistory, setOnlineHistory,
    onlineHistoryRef, lastMove, setLastMove, mySide, setMySide, started, setStarted,
    replayIndex, setReplayIndex, historyViewIndex,
    serverFinished, setServerFinished, setServerWinner, setServerEndedBy,
    inCheck, gameOver, winner, endedBy, replayFromHistory, applyMove: applyBoardMove, undo, error, setError, isAiThinking
  } = useBoardState({ initialBoard, initialPlayer, side, ai, roomId, initialHistory, historyViewIndex: historyViewIndexProp, initialStarted });

  const setHistoryViewIndex = useCallback((updater: any) => {
    if (onHistoryViewIndexChange) {
      const next = typeof updater === 'function' ? updater(historyViewIndex) : updater;
      onHistoryViewIndexChange(next);
    }
  }, [onHistoryViewIndexChange, historyViewIndex]);

  const lastEmittedState = useRef<string>('');
  useEffect(() => {
    if (onStateChange) {
      const state = { moveHistory: (roomId ? onlineHistory : moveHistory), historyViewIndex, currentPlayer, winner, board, isAiThinking, roomSummary, spectators, started, playerProfiles, playerUids };
      const stateStr = JSON.stringify({ hLen: state.moveHistory?.length, viewIdx: state.historyViewIndex, cp: state.currentPlayer, w: state.winner, ai: state.isAiThinking, sum: state.roomSummary?.roomId, specLen: state.spectators?.length, started: state.started, profileUids: Object.keys(playerProfiles).map(s => (playerProfiles as any)[s]?.uid) });
      if (stateStr !== lastEmittedState.current) {
        onStateChange(state);
        lastEmittedState.current = stateStr;
      }
    }
  }, [moveHistory, onlineHistory, historyViewIndex, currentPlayer, winner, board, isAiThinking, onStateChange, roomId, roomSummary, spectators, started, playerProfiles]);

  const { error: errorNotify, success } = useToast();
  const lastCheckSide = useRef<PieceSide | null>(null);

  useEffect(() => {
    if (error) { errorNotify(t('match.engineError', { error })); setError(null); }
  }, [error, errorNotify, setError, t]);

  useEffect(() => {
    if (inCheck && !gameOver && lastCheckSide.current !== currentPlayer) {
      setShowCheckNotify(true); setCheckNotifyKey(prev => prev + 1); lastCheckSide.current = currentPlayer;
      playGameSound('check');
      const timer = setTimeout(() => setShowCheckNotify(false), 2000);
      return () => clearTimeout(timer);
    } else if (!inCheck) { lastCheckSide.current = null; setShowCheckNotify(false); }
  }, [inCheck, gameOver, currentPlayer]);

  const hasNotifiedStart = useRef(false);
  useEffect(() => {
    if (roomId && onlineHistory.length === 1 && !gameOver && !hasNotifiedStart.current) {
      success(t('match.started')); 
      playGameSound('start');
      hasNotifiedStart.current = true;
    } else if (onlineHistory.length === 0) { hasNotifiedStart.current = false; }
  }, [roomId, onlineHistory.length, gameOver, success, t]);

  useEffect(() => {
    if (!roomId) return;
    if (myUid) {
      if (playerUids.red === myUid && mySide !== 'red') setMySide('red');
      else if (playerUids.black === myUid && mySide !== 'black') setMySide('black');
    }
    if (started) return;
    if (authState.status === 'auth' && !mySide && myUid && playerUids.red !== myUid && playerUids.black !== myUid) {
      const sideToJoin = !playerUids.black ? 'black' : 'red';
      joinRoom(roomId, sideToJoin).then(ack => { if (ack.ok) setMySide(ack.side); });
    }
  }, [roomId, started, mySide, myUid, playerUids, authState.status]);

  const replayIndexRef = useRef(0);
  useEffect(() => { replayIndexRef.current = replayIndex; }, [replayIndex]);
  const historyViewIndexRef = useRef<number | null>(null);
  useEffect(() => { historyViewIndexRef.current = historyViewIndex; }, [historyViewIndex]);

  const handleLiveGameOverResult = useCallback((g: any) => {
    setTimeout(() => {
      const isPlayer = !!mySide; const isMe = mySide && g.winner === mySide; const isDraw = !g.winner;
      if (isDraw) { success(t('match.resultDraw')); playGameSound('draw'); }
      else if (isPlayer) { 
        if (isMe) { success(t('match.resultWin')); playGameSound('win'); }
        else { errorNotify(t('match.resultLoss')); playGameSound('loss'); }
      }
      else { 
        success(t('match.resultOtherWin', { side: g.winner === 'red' ? t('common.sides.red') : t('common.sides.black') })); 
        playGameSound(g.winner === mySide ? 'win' : 'loss');
      }
      if (mySide) {
        setShowResultModal(true);
      }
      setDismissedGameOver(false);
      onGameOverProp?.(g);
    }, 1200);
  }, [onGameOverProp, mySide, success, errorNotify]);

  const boardSocket = useBoardSocket({
    roomId, mySide, myUid, serverMoveIndex, onlineHistoryRef, replayIndexRef, historyViewIndexRef,
    setPlayerUids, setSocketConnected, setSpectators, setStarted, setServerFinished,
    setServerWinner, setServerEndedBy, setOnlineHistory, setReplayIndex,
    setServerMoveIndex, setServerClockOffset, setRoomSummary,
    setDrawRequest: () => {}, setSwapRequest: () => {}, setMySide, applyMove: applyBoardMove, replayFromHistory,
    onGameOver: handleLiveGameOverResult, onScored: onScoredProp,
  });

  const { handleMove } = boardSocket;
  useEffect(() => { if (!roomIdProp && !autoJoin?.roomId && !started) setStarted(true); }, [roomIdProp, autoJoin?.roomId, started, setStarted]);

  useEffect(() => {
    if (gameOver && !showResultModal && !dismissedGameOver) {
      const timer = setTimeout(() => {
        if (mySide) setShowResultModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameOver]);

  const isFlipped = useMemo(() => {
    if (roomId) return mySide === 'black';
    if (!side || !board) return false;
    let kingRow = -1;
    for (let r = 0; r < 10; r++) { for (let c = 0; c < 9; c++) { if (board[r][c]?.side === side && board[r][c]?.type === 'general') { kingRow = r; break; } } if (kingRow !== -1) break; }
    return kingRow !== -1 && kingRow < 5;
  }, [board, mySide, roomId, side]);

  const canInteract = useMemo(() => {
    if (replay || gameOver || historyViewIndex !== null) return false;
    if (!roomId) return !(ai?.enabled && currentPlayer === ai.side);
    return (started || serverMoveIndex === 0) && (mySide || side) === currentPlayer;
  }, [ai, currentPlayer, gameOver, mySide, side, replay, roomId, started, historyViewIndex, serverMoveIndex]);

  const mapDisplayToBoard = (pos: { row: number; col: number }) => { if (!isFlipped) return pos; return { row: 10 - 1 - pos.row, col: 9 - 1 - pos.col }; };

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!canInteract) {
      if (historyViewIndex !== null) { 
        errorNotify(t('match.errorViewingReplay'), { 
          actions: [{ label: t('match.backToLive'), variant: 'primary', onClick: () => setHistoryViewIndex(null) }] 
        }); return; 
      }
      if (roomId) {
        if (!started && serverMoveIndex > 0) return;
        if (authState.status !== 'auth') { 
          errorNotify(t('match.errorLoginToPlay'), { 
            actions: [{ label: t('common.login'), onClick: () => navigate('/login'), variant: 'primary' }] 
          }); return; 
        }
        if (mySide && mySide !== currentPlayer) { errorNotify(t('match.errorNotYourTurn')); return; }
        if (!mySide) errorNotify(t('match.errorSpectator'));
      }
      return;
    }
    const boardPos = mapDisplayToBoard({ row, col });
    const clickedPiece = board[boardPos.row][boardPos.col];
    if (selectedCell && board[selectedCell.row][selectedCell.col]) {
      if (validMoves.some(m => m.row === boardPos.row && m.col === boardPos.col)) {
        const move = { from: selectedCell, to: boardPos, piece: board[selectedCell.row][selectedCell.col]!, capturedPiece: clickedPiece || undefined };
        if (roomId) { handleMove(move, onlineHistory.length + 1); setLastMove({ from: move.from, to: move.to }); setSelectedCell(null); setValidMoves([]); }
        else applyBoardMove(move);
        return;
      }
    }
    if (clickedPiece && clickedPiece.side === currentPlayer && (!roomId || !mySide || clickedPiece.side === mySide)) {
      setSelectedCell(boardPos); const moves = [];
      for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) if (isLegalMove(clickedPiece, { row: r, col: c }, board)) moves.push({ row: r, col: c });
      setValidMoves(moves); return;
    }
    setSelectedCell(null); setValidMoves([]);
  }, [canInteract, historyViewIndex, roomId, started, serverMoveIndex, authState.status, mySide, currentPlayer, board, selectedCell, validMoves, handleMove, onlineHistory.length, applyBoardMove, t, navigate, setHistoryViewIndex, setLastMove, setSelectedCell, setValidMoves, isFlipped]);

  const handleLeaveRoom = async () => {
    if (!roomId) { navigate('/'); return; }
    if (started && !serverFinished && mySide && onlineHistory.length > 0) { try { await resignGame(roomId); } catch (e) { logger.warn('[Board] Auto-resign on leave failed:', e); } }
    localStorage.removeItem('xq:active_match'); await leaveRoom(roomId, true);
    setTimeout(() => navigate('/'), 100);
  };

  useEffect(() => {
    if (hideLobby) return;
    const s = getSocket();
    const refresh = () => { lobbyList().then(ack => ack.ok && setLobbyRooms(ack.rooms)); };
    refresh();
    const onLobbyUpdate = (u: any) => setLobbyRooms(prev => {
      const i = prev.findIndex(r => r.roomId === u.roomId);
      const next = i >= 0 ? prev.map((r, idx) => idx === i ? u : r) : [u, ...prev];
      return next.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    });
    s.on('lobby:update', onLobbyUpdate);
    return () => { s.off('lobby:update', onLobbyUpdate); };
  }, [hideLobby]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { fetchUserSummary } = await import('../auth/auth'); const sides: ('red' | 'black')[] = ['red', 'black']; const nextProfiles = { red: null, black: null } as any; let changed = false;
      for (const s of sides) {
        const uid = (playerUids as any)[s];
        if (uid && uid.length > 5) {
          if ((playerProfiles as any)[s]?.uid === uid) { nextProfiles[s] = (playerProfiles as any)[s]; continue; }
          const res = await fetchUserSummary(uid); if (res.ok) { nextProfiles[s] = { ...res.user, elo: res.elo, rank: res.rank }; changed = true; }
        } else { if (playerProfiles[s] !== null) changed = true; nextProfiles[s] = null; }
      }
      if (changed) setPlayerProfiles(nextProfiles);
    };
    fetchProfiles();
  }, [playerUids]);

  useEffect(() => { if (replay) { const nextPlayer = replay.index % 2 === 0 ? 'red' : 'black'; replayFromHistory(replay.history.slice(0, replay.index), nextPlayer, undefined, false); } }, [replay, replayFromHistory]);

  React.useImperativeHandle(ref, () => ({
    undo, newGame: () => { setBoard(initialBoard || createInitialBoard()); setMoveHistory([]); setHistoryViewIndex(null); setCurrentPlayer(initialPlayer || 'red'); setLastMove(null); setStarted(false); setServerFinished(false); },
    resign: () => { if (roomId) resignGame(roomId); }, draw: () => { if (roomId) getSocket().emit('game:draw:request', { roomId }); },
    swap: () => { if (roomId) requestSwap(roomId); }, leave: handleLeaveRoom,
  }));

  return (
    <div className={`flex w-full flex-col ${!hideSidebar ? 'lg:flex-row lg:w-auto' : ''} lg:items-start gap-6 xl:gap-8 justify-center mx-auto`}>
      {!hideSidebar && (
        <div className="w-full lg:max-w-none overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/60 text-slate-900 dark:text-white lg:backdrop-blur-xl shadow-2xl lg:order-2 lg:w-[300px] xl:w-[360px] lg:shrink-0 lg:sticky lg:top-4">
          <BoardHeader playerProfiles={playerProfiles} currentPlayer={currentPlayer} serverFinished={serverFinished} ai={ai} roomSummary={roomSummary} serverClockOffset={serverClockOffset} socketConnected={socketConnected} presenceMap={presenceMap} h2h={h2h} />
          {!replay ? (
            <>
              <BoardInfo roomId={roomId} mySide={mySide} roomSummary={roomSummary} serverClockOffset={serverClockOffset} spectators={spectators} isAiGame={!!ai?.enabled} />
              <MatchDetails roomSummary={roomSummary} board={board} moveHistory={roomId ? onlineHistory : moveHistory} />
              <BoardControls gameOver={gameOver} winner={winner} endedBy={endedBy} started={started} serverFinished={serverFinished} socketConnected={socketConnected} mySide={mySide} roomId={roomId} onlineHistoryLength={onlineHistory.length} moveHistoryLength={moveHistory.length} lobbyRooms={lobbyRooms} hideLobby={hideLobby} onRefreshLobby={() => lobbyList().then(ack => ack.ok && setLobbyRooms(ack.rooms))} handleRequestDraw={() => getSocket().emit('game:draw:request', { roomId })} handleResign={() => resignGame(roomId)} handleLeaveRoom={handleLeaveRoom} handleNewGame={() => { setBoard(initialBoard || createInitialBoard()); setMoveHistory([]); setHistoryViewIndex(null); setCurrentPlayer(initialPlayer || 'red'); setLastMove(null); setStarted(false); setServerFinished(false); }} handleUndo={undo} handleSwap={() => requestSwap(roomId)} isAiGame={!!ai?.enabled} board={board} currentPlayer={currentPlayer} boardRef={boardContainerRef} />
              <div className="hidden lg:block">
                <MoveList history={roomId ? onlineHistory : moveHistory} historyViewIndex={historyViewIndex} setHistoryViewIndex={setHistoryViewIndex} exitHistoryView={() => setHistoryViewIndex(null)} />
                {children && <div className="hidden lg:block mt-4 border-t border-black/5 dark:border-white/5 pt-4">{children}</div>}
              </div>
            </>
          ) : (
            <>
              <BoardInfo roomId={roomId} mySide={mySide} roomSummary={roomSummary} serverClockOffset={serverClockOffset} spectators={spectators} isAiGame={!!ai?.enabled} />
              <MatchDetails roomSummary={roomSummary} board={board} moveHistory={replay.history as any} />
              <div className="hidden lg:block">
                <MoveList history={replay.history} historyViewIndex={replay.index < replay.history.length ? replay.index : undefined} setHistoryViewIndex={(fn) => { const val = fn(replay.index < replay.history.length ? replay.index : null); onReplayIndexChange?.(val); }} exitHistoryView={() => onReplayIndexChange?.(null)} replayTotal={replay.history.length} onSeek={(v) => onReplayIndexChange?.(v)} />
              </div>
              <div className="px-4 pb-4 flex justify-center border-t border-black/5 dark:border-white/5 pt-4">
                <ExportButtons board={board} currentPlayer={currentPlayer} boardRef={boardContainerRef} />
              </div>
              {children && <div className="hidden lg:block mt-4 border-t border-black/5 dark:border-white/5 pt-4">{children}</div>}
            </>
          )}
        </div>
      )}

      <div className="flex flex-col items-center lg:order-1 lg:min-w-0 w-full xq-board-container">
        <div className="flex flex-col items-center w-full">
          <div ref={boardContainerRef} className={`xq-board-wrap ${isAiThinking ? 'cursor-wait' : ''}`}>
            <BoardSVG highlightZones={highlightZones} />
            <BoardGrid board={board} isFlipped={isFlipped} selectedCell={selectedCell} validMoves={validMoves} lastMove={lastMove} canInteract={canInteract} pieceStyle={pieceStyle} onCellClick={handleCellClick} onCellHover={onCellHover} onCellLeave={onCellLeave} />
            <CheckNotify showCheckNotify={showCheckNotify} checkNotifyKey={checkNotifyKey} />
            <AiThinkingOverlay isAiThinking={isAiThinking} />
            <GameOverOverlay showResultModal={showResultModal} dismissedGameOver={dismissedGameOver} setDismissedGameOver={setDismissedGameOver} winner={winner} side={side} mySide={mySide} endedBy={endedBy} />
          </div>
          <BoardBanner serverFinished={serverFinished} started={started} serverMoveIndex={serverMoveIndex} roomId={roomId} playerUids={playerUids} mySide={mySide} />
        </div>
      </div>
      {hideSidebar && moveListBelow && !replay && (
        <div className="w-full max-w-[600px] mx-auto mt-4">
          <MoveList history={roomId ? onlineHistory : moveHistory} historyViewIndex={historyViewIndex} setHistoryViewIndex={setHistoryViewIndex} exitHistoryView={() => setHistoryViewIndex(null)} />
        </div>
      )}
    </div>
  );
});

Board.displayName = 'Board';

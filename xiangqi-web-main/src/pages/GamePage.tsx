import { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';

// Component imports
import { Board } from '../components/Board';
import { H2HCard } from '../components/H2HCard';
const GameComments = lazy(() => import('../components/GameComments').then(m => ({ default: m.GameComments })));
const BoardHeader = lazy(() => import('../components/BoardHeader').then(m => ({ default: m.BoardHeader })));
const MoveList = lazy(() => import('../components/MoveList').then(m => ({ default: m.MoveList })));
const ExportButtons = lazy(() => import('../components/ExportButtons').then(m => ({ default: m.ExportButtons })));
import { SEO } from '../components/SEO';
import { LazyMount } from '../components/ui/LazyMount';
import { Confirm } from '../components/ui/Dialog';
import { SocialShare } from '../components/SocialShare';
import { getAbsoluteUrl, getSiteOrigin } from '../utils/url';

// Local components and hooks
import { GameSeoContent } from '../components/game/GameSeoContent';
const GameInfoPanel = lazy(() => import('../components/game/GameInfoPanel').then(m => ({ default: m.GameInfoPanel })));
const SpectatorList = lazy(() => import('../components/game/SpectatorList').then(m => ({ default: m.SpectatorList })));
import { useGameData } from '../hooks/useGameData';
import { useAuth } from '../auth/AuthContext';
import { useBoardTimer } from '../hooks/useBoardTimer';
import { apiGet, apiPost } from '../api';
import { logger } from '../utils/logger';
import { extractIdFromSlug, makeSlug } from '../utils/slug';
import { createInitialBoard } from '../state/initialBoard';
import { boardToFen } from '../utils/fen';

type ApiMoveRow = {
  ply: number;
  side?: 'red' | 'black';
  move: {
    from: { row: number; col: number };
    to: { row: number; col: number };
    piece?: any;
    capturedPiece?: any;
    isCheck?: boolean;
    fen?: string;
  };
  ts?: number;
};

export function GamePage() {
  const { t } = useTranslation();
  const params = useParams();
  const roomId = extractIdFromSlug(params.roomId);
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const currentUid = authState.user?.uid ?? null;

  const {
    meta,
    setMeta,
    error,
    isLiked,
    setIsLiked,
    likeCount,
    setLikeCount,
    h2h,
    title,
    winner,
    setWinner,
    endedBy,
    setEndedBy,
    isStarted,
    playerProfiles,
    spectators,
    liveHistory,
    historyViewIndex,
    setHistoryViewIndex,
    handleStateChange,
  } = useGameData(roomId, authState, params.roomId);

  const [moves, setMoves] = useState<ApiMoveRow[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const boardRef = useRef<any>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {}
  });

  const isMultiplayer = !!roomId;
  const isFinished = meta?.status === 'finished' || meta?.state?.finished === true;
  const roomStarted = isStarted || meta?.status === 'started' || meta?.status === 'playing' || meta?.state?.started === true;
  const playerUids = meta?.playerUids || meta?.state?.playerUids || null;
  const playerNames = meta?.playerNames || meta?.state?.playerNames || null;
  const isPlayer = !!currentUid && !!(playerUids && Object.values(playerUids).includes(currentUid));
  const isPrivate = meta?.isPrivate ?? false;

  const { tick } = useBoardTimer({ roomId: roomId || '', serverClockOffset: 0 });

  // Fetch moves for replay
  useEffect(() => {
    if (!isMultiplayer || !isFinished) return;
    apiGet<{ ok: boolean; moves?: ApiMoveRow[] }>(`/games/${roomId}/moves?limit=5000`)
      .then(r => {
        if (r.ok && r.moves) {
          setMoves(r.moves);
          setHistoryViewIndex(null);
        }
      })
      .catch(err => logger.debug('Fetch finished game moves failed', err));
  }, [roomId, isMultiplayer, isFinished, setHistoryViewIndex]);

  const replayHistory = useMemo(() => {
    if (moves.length === 0) return [];
    
    try {
      let currentBoard = createInitialBoard();
      let currentPlayer: 'red' | 'black' = 'red';
      
      return (moves || []).slice().sort((a, b) => (a.ply || 0) - (b.ply || 0)).map((m, idx) => {
        const from = m.move?.from;
        const to = m.move?.to;
        
        if (!from || !to || typeof from.row !== 'number' || typeof to.row !== 'number') return null;
        if (!currentBoard[from.row] || !currentBoard[to.row]) return null;

        // Execute move on internal board to track state
        const movingPiece = currentBoard[from.row][from.col];
        currentBoard[from.row][from.col] = null;
        if (movingPiece) {
            currentBoard[to.row][to.col] = { ...movingPiece, position: { ...to }, hasMoved: true };
        }
        
        const fen = boardToFen(currentBoard, currentPlayer === 'red' ? 'black' : 'red');
        currentPlayer = currentPlayer === 'red' ? 'black' : 'red';

        return {
          from,
          to,
          lastMove: { from, to },
          piece: m.move?.piece,
          capturedPiece: m.move?.capturedPiece,
          isCheck: m.move?.isCheck || false,
          side: m.side || (idx % 2 === 0 ? 'red' : 'black'),
          fen
        };
      }).filter(Boolean);
    } catch (e) {
      console.warn('[GamePage] FEN simulation failed:', e);
      return moves.slice().sort((a, b) => (a.ply || 0) - (b.ply || 0)).map(m => ({
        from: m.move.from,
        to: m.move.to,
        lastMove: { from: m.move.from, to: m.move.to },
        piece: m.move.piece,
        capturedPiece: m.move.capturedPiece,
        isCheck: m.move.isCheck || false,
      }));
    }
  }, [moves]);

  const max = replayHistory.length;
  const boardIndex = historyViewIndex === null ? max : historyViewIndex;

  useEffect(() => {
    if (!isFinished || max === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setHistoryViewIndex(i => Math.max(0, (i === null ? max : i) - 1));
      }
      if (e.key === 'ArrowRight') {
        setHistoryViewIndex(i => {
          const cur = i === null ? max : i;
          return cur + 1 >= max ? null : cur + 1;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [max, isFinished, setHistoryViewIndex]);

  const handlePublish = async () => {

    if (!roomId) return;
    setIsPublishing(true);
    const r = await apiPost(`/games/${roomId}/publish`, {}, authState.token);
    if ((r as any).ok) {
      setMeta((m: any) => m ? { ...m, isPrivate: false } : m);
    }
    setIsPublishing(false);
  };

  const handleToggleLike = async () => {
    if (!roomId) return;
    if (authState.status !== 'auth') {
      setConfirmDialog({
        isOpen: true,
        title: t('game.confirm.loginTitle'),
        message: t('game.confirm.loginMsg'),
        variant: 'info',
        onConfirm: () => navigate('/login')
      });
      return;
    }
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikeCount(c => Math.max(0, c + (prevLiked ? -1 : 1)));
    try {
      const r = await apiPost<{ ok: boolean; liked?: boolean; likeCount?: number }>(`/games/like/${roomId}`, {}, authState.token);
      if (r.ok) {
        setIsLiked(!!r.liked);
        if (r.likeCount != null) setLikeCount(r.likeCount);
      } else throw new Error();
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(c => Math.max(0, c + (prevLiked ? 1 : -1)));
    }
  };

  const rawId = params.roomId ? (params.roomId.split('-')[0]) : roomId;
  const seoData = useMemo(() => {
    if (!meta || !roomId) return { title: undefined, desc: undefined, keywords: undefined, image: undefined, video: undefined };
    
    const sTitle = title || `${t('common.play')}: ${playerNames?.red || t('common.loading')} vs ${playerNames?.black || t('common.loading')}${isFinished ? (winner ? (winner === 'red' ? ` - ${t('game.status.redWin')}` : ` - ${t('game.status.blackWin')}`) : ` - ${t('game.status.draw')}`) : ''}`;
    const sDesc = `${t('game.status.ongoing')} ${playerNames?.red || ''} vs ${playerNames?.black || ''}. ${t('game.roomIdLabel', { id: roomId })}`;
    const sImage = rawId ? getAbsoluteUrl(`/api/export/image/16x9/game/${rawId}.webp`) : undefined;
    const sKeywords = t('game.seo.keywords', { 
      red: playerNames?.red || t('game.redPlayerDefault'), 
      black: playerNames?.black || t('game.blackPlayerDefault') 
    });
    
    // Only provide video if the metadata matches the current room in the URL
    // and the game is finished. This prevents stale video loads during navigation.
    const sVideo = (isFinished && (meta.roomId === rawId || meta._id === rawId)) 
      ? getAbsoluteUrl(`/api/export/video/16x9/game/${rawId}.mp4`) 
      : undefined;

    return { title: sTitle, desc: sDesc, keywords: sKeywords, image: sImage, video: sVideo };
  }, [meta, title, playerNames, isFinished, winner, t, roomId, rawId]);

  const gameJsonLd = useMemo(() => {
    if (!meta || !roomId || (meta.roomId !== rawId && meta._id !== rawId)) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": seoData.title,
      "description": seoData.desc,
      "image": seoData.image,
        "startDate": meta.createdAt ? new Date(meta.createdAt).toISOString() : new Date().toISOString(),
        "location": { "@type": "VirtualLocation", "url": window.location.href },
        "organizer": { "@type": "Organization", "name": t('navbar.brand'), "url": getSiteOrigin() },
        "competitor": [
          { "@type": "Person", "name": playerNames?.red || t('game.redPlayerDefault') },
          { "@type": "Person", "name": playerNames?.black || t('game.blackPlayerDefault') }
        ],
        "video": isFinished ? {
          "@type": "VideoObject",
          "name": t('game.seo.videoTitle', { title: seoData.title }),
          "description": seoData.desc,
          "thumbnailUrl": getAbsoluteUrl(`/api/export/image/9x10/game/${rawId}.webp`),
          "uploadDate": new Date(meta.updatedAt || meta.createdAt || Date.now()).toISOString(),
          "contentUrl": getAbsoluteUrl(`/api/export/video/9x10/game/${rawId}.mp4`)
        } : undefined
    };
  }, [meta, roomId, rawId, seoData, playerNames, isFinished]);

  const idealGameSlug = useMemo(() => {
    if (!meta || !roomId) return '';
    const redName = playerNames?.red || 'player';
    const blackName = playerNames?.black || 'player';
    const displayName = meta.puzzleName || meta.state?.puzzleName || `${redName}-vs-${blackName}`;
    return makeSlug(displayName, roomId);
  }, [meta, roomId, playerNames]);

  const canonicalUrl = useMemo(() => idealGameSlug ? getAbsoluteUrl(`/game/${idealGameSlug}`) : undefined, [idealGameSlug]);

  useEffect(() => {
    if (!isFinished || !params.roomId || !idealGameSlug) return;
    if (params.roomId !== idealGameSlug) {
      navigate(`/game/${idealGameSlug}`, { replace: true });
    }
  }, [isFinished, params.roomId, idealGameSlug, navigate]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl w-full px-4 py-20 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          {t('game.notFoundTitle')}
        </h2>
        <p className="text-slate-600 dark:text-white/60 mb-8 leading-relaxed">
          {t('game.notFoundDesc', { id: roomId })}
        </p>
        <Link to="/game" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black transition-all shadow-lg shadow-blue-500/25 active:scale-95">
          <span>🎮</span> {t('common.backToLobby')}
        </Link>
      </div>
    );
  }

  if (!meta && isMultiplayer) {
    return (
      <div className="mx-auto max-w-[1920px] w-full px-4 py-8 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start justify-center">
          {/* H2H Skeleton */}
          <div className="w-full lg:w-[320px] 2xl:w-[380px] min-h-[300px] rounded-[32px] bg-white/5 border border-white/10 shrink-0" />
          
          {/* Board Skeleton */}
          <div className="flex-1 w-full max-w-[800px] flex flex-col gap-6">
             <div className="w-full h-32 rounded-[32px] bg-white/5 border border-white/10" />
             <div className="w-full aspect-[9/10] rounded-[32px] bg-white/5 border border-white/10" />
          </div>

          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-[320px] 2xl:w-[380px] h-[600px] rounded-[32px] bg-white/5 border border-white/10 shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 py-8">
      <SEO 
        title={seoData.title} 
        description={seoData.desc} 
        image={rawId ? getAbsoluteUrl(`/api/export/image/16x9/game/${rawId}.webp`) : seoData.image} 
        video={seoData.video}
        canonical={canonicalUrl}
        keywords={seoData.keywords} 
        jsonLd={gameJsonLd} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr_minmax(320px,400px)] 2xl:grid-cols-[minmax(380px,480px)_1fr_minmax(380px,480px)] gap-6 xl:gap-8 items-start">
        {/* Left Sidebar - order-1 on mobile */}
        <div className="order-1 lg:order-1 lg:col-start-1 w-full flex flex-col lg:sticky lg:top-6 self-start space-y-6">
          {isMultiplayer && (
            <>
              <div className="min-h-[160px]">
                <GameInfoPanel
                  roomId={roomId || ''}
                  meta={meta}
                  isFinished={isFinished}
                  winner={winner as any}
                  endedBy={endedBy}
                  playerNames={playerNames}
                  title={title}
                  isLiked={isLiked}
                  likeCount={likeCount}
                  handleToggleLike={handleToggleLike}
                />
              </div>
              <H2HCard h2h={h2h} playerUids={playerUids} playerNames={playerNames} className="hidden lg:block shadow-2xl" />
            </>
          )}
        </div>

        {/* Center Board - order-2 on mobile */}
        <div className="order-2 lg:order-2 lg:col-start-2 w-full flex flex-col items-center gap-4 min-w-0">
          <div ref={boardContainerRef} className="w-full aspect-[9/10] bg-white/5 rounded-3xl overflow-hidden">
            <Board
              key={roomId || 'lobby'}
              ref={boardRef}
              hideLobby={isFinished || !!roomId}
              roomId={roomId}
              autoJoin={!isFinished && roomId ? { roomId } : undefined}
              replay={isFinished ? { history: replayHistory, index: boardIndex } : undefined}
              onReplayIndexChange={isFinished ? (idx: number | null) => setHistoryViewIndex(idx) : undefined}
              onStateChange={handleStateChange}
              initialStarted={meta?.status === 'playing'}
              initialBoard={meta?.setupId ? (meta?.state?.board || undefined) : undefined}
              initialPlayerUids={playerUids || undefined}
              initialPlayerNames={playerNames || undefined}
              historyViewIndex={historyViewIndex}
              onHistoryViewIndexChange={setHistoryViewIndex}
              hideSidebar={true}
              onGameOver={(g) => { setWinner(g.winner); setEndedBy(g.endedBy); }}
              h2h={h2h}
            />
          </div>
          
          {isFinished && isPrivate && isPlayer && (
            <div className="w-full max-w-[620px] xl:max-w-[720px] 2xl:max-w-[800px] rounded-3xl border border-slate-500/30 bg-slate-800/40 p-5 mt-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800 dark:text-white/80">🔒 {t('game.private')}</div>
                <div className="text-xs text-slate-600 dark:text-white/40 mt-0.5">{t('game.publishDesc')}</div>
              </div>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              >
                {isPublishing ? '...' : `🌐 ${t('game.actions.publish')}`}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - MoveList - order-3 on mobile */}
        <div className="order-3 lg:col-start-3 w-full flex flex-col lg:sticky lg:top-6 self-start space-y-6">
          <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5 min-h-[500px]">
            <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
              <Suspense fallback={<div className="h-40 w-full animate-pulse bg-white/5" />}>
                <BoardHeader
                  playerProfiles={playerProfiles}
                  currentPlayer={(meta?.state as any)?.currentPlayer || (meta as any)?.currentPlayer || 'red'}
                  serverFinished={isFinished}
                  roomSummary={meta}
                  tick={tick}
                  presenceMap={new Map()}
                />
              </Suspense>
            </div>

            <div className="flex flex-col">
              <Suspense fallback={<div className="h-64 w-full animate-pulse bg-white/5" />}>
                <MoveList
                  history={isFinished ? replayHistory : liveHistory}
                  historyViewIndex={historyViewIndex}
                  setHistoryViewIndex={setHistoryViewIndex}
                  exitHistoryView={() => setHistoryViewIndex(null)}
                  replayTotal={isFinished ? replayHistory.length : liveHistory.length}
                  onSeek={(idx) => setHistoryViewIndex(idx)}
                />
              </Suspense>
              
              <div className="p-5 pt-0 space-y-4">
                {!isFinished && isPlayer && (
                   <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setConfirmDialog({ isOpen: true, title: t('game.confirm.drawTitle'), message: t('game.confirm.drawMsg'), variant: 'info', onConfirm: () => boardRef.current?.draw() })} disabled={!roomStarted} className="h-10 rounded-xl bg-white/5 border border-white/10 text-blue-400 text-xs font-black hover:bg-blue-500/20 hover:border-blue-500/30 transition-all disabled:opacity-20 flex items-center justify-center gap-2">
                         <span>🤝</span> {t('game.actions.draw')}
                       </button>
                       <button onClick={() => setConfirmDialog({ isOpen: true, title: t('game.confirm.resignTitle'), message: t('game.confirm.resignMsg'), variant: 'danger', onConfirm: () => boardRef.current?.resign() })} disabled={!roomStarted} className="h-10 rounded-xl bg-white/5 border border-white/10 text-red-500 text-xs font-black hover:bg-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-20 flex items-center justify-center gap-2">
                         <span>🏳️</span> {t('game.actions.resign')}
                       </button>
                       {replayHistory.length === 0 && (
                          <button onClick={() => boardRef.current?.swap()} disabled={roomStarted} className="h-10 rounded-xl bg-white/5 border border-white/10 text-xq-gold text-xs font-black hover:bg-xq-gold/20 hover:border-xq-gold/30 transition-all disabled:opacity-20 flex items-center justify-center gap-2">
                            <span>🔄</span> {t('game.actions.swap')}
                          </button>
                       )}
                       <button onClick={() => setConfirmDialog({ isOpen: (roomStarted && liveHistory.length > 0), title: t('game.confirm.leaveTitle'), message: t('game.confirm.leaveMsg'), variant: 'danger', onConfirm: () => boardRef.current?.leave() })} 
                        className="h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        onClickCapture={() => { if (!(roomStarted && liveHistory.length > 0)) boardRef.current?.leave(); }}
                       >
                         <span>🚪</span> {t('game.actions.leave')}
                       </button>
                 </div>
                )}
                <SocialShare 
                     url={window.location.href} 
                     title={title || t('siteSeo.defaultTitle')} 
                     className="mt-6 pt-6 border-t border-black/5 dark:border-white/5"
                   />
                <Suspense fallback={<div className="h-20 w-full animate-pulse bg-white/5" />}>
                  <SpectatorList spectators={spectators} />
                </Suspense>
                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                  <Suspense fallback={<div className="h-10 w-full animate-pulse bg-white/5" />}>
                    <ExportButtons 
                      board={meta?.state?.board} 
                      currentPlayer={(meta?.state as any)?.currentPlayer || 'red'} 
                      boardRef={boardContainerRef} 
                      className="flex gap-2"
                      history={isFinished ? (meta?.state?.positionHistory?.map((fen: string) => ({ fen })) || replayHistory) : liveHistory}
                      onSeek={setHistoryViewIndex}
                      uid={`game-${roomId}`}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Media Section - order-4 on mobile */}
        {isFinished && rawId && (meta.roomId === rawId || meta._id === rawId) && (
          <div className="order-4 lg:col-start-2 w-full max-w-[500px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="rounded-[4px] overflow-hidden border border-black/5 dark:border-white/5 aspect-[9/10] w-full bg-transparent">
                <video 
                  controls 
                  poster={getAbsoluteUrl(`/api/export/image/9x10/game/${rawId}.webp`)}
                  className="w-full h-full object-contain"
                  preload="none"
                >
                  <source src={getAbsoluteUrl(`/api/export/video/9x10/game/${rawId}.mp4`)} type="video/mp4" />
                </video>
             </div>
             <div className="rounded-[4px] overflow-hidden border border-black/5 dark:border-white/5 aspect-[9/10] w-full bg-transparent">
                <img 
                  src={getAbsoluteUrl(`/api/export/image/9x10/game/${rawId}.webp`)} 
                  alt="Board Image"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
             </div>
          </div>
        )}

        {/* Comments Section - order-5 on mobile */}
        {isMultiplayer && (
          <div className="order-5 lg:col-start-2 w-full space-y-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
            <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">💬</div>
                 <h2 className="text-sm font-black text-slate-800 dark:text-white/90 leading-none">
                   {t('game.comments')}
                 </h2>
              </div>
              <LazyMount fallback={<div className="h-40 w-full animate-pulse bg-white/5 rounded-2xl" />}>
                <Suspense fallback={<div className="h-40 w-full animate-pulse bg-white/5" />}>
                  <GameComments gameId={roomId || ''} playerUids={playerUids} />
                </Suspense>
              </LazyMount>
            </div>
            {/* MOBILE ONLY: H2H - order-6 */}
            <div className="block lg:hidden order-6 min-h-[400px]">
              {h2h ? (
                 <H2HCard h2h={h2h} playerUids={playerUids} playerNames={playerNames} className="shadow-xl" />
              ) : (
                 <div className="w-full h-[400px] rounded-[32px] bg-white/5 border border-white/10 animate-pulse" />
              )}
            </div>
          </div>
        )}
      </div>
      
      <GameSeoContent playerNames={playerNames} />

      <Confirm
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
}

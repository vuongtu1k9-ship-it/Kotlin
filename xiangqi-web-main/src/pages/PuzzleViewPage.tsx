import { useEffect, useMemo, useState, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../auth/AuthContext';
import { type BoardRef } from '../components/Board';
import type { Piece, PieceSide, AiLevel } from '../types';
import { useActiveBots } from '../hooks/useActiveBots';
import { createEmptyBoard, createInitialBoard } from '../state/initialBoard';
import { boardToFen } from '../utils/fen';
import { makeSlug, extractIdFromSlug } from '../utils/slug';
import { useToast } from '../components/ui/Toast';
import { SEO } from '../components/SEO';
import { getAbsoluteUrl } from '../utils/url';
import { LazyMount } from '../components/ui/LazyMount';
import { InfoCard } from '../components/ui/InfoCard';
import { Alert } from '../components/ui/Dialog';

// Local components
import { PuzzleControlPanel } from '../components/puzzle/PuzzleControlPanel';
import { PuzzleRelatedSection } from '../components/puzzle/PuzzleRelatedSection';
import { PuzzleHallOfFame } from '../components/puzzle/PuzzleHallOfFame';
import { PuzzleSeoContent } from '../components/puzzle/PuzzleSeoContent';
import { SocialShare } from '../components/SocialShare';

// Hooks
import { usePuzzleData } from '../hooks/usePuzzleData';

import { Board as PuzzleBoard } from '../components/Board';
import { BoardHeader } from '../components/BoardHeader';
import { MoveList } from '../components/MoveList';
import { ExportButtons } from '../components/ExportButtons';
import { mapBotToProfile } from '../utils/botUtils';

// Lazy load heavy components
const EntityComments = lazy(() => import('../components/EntityComments').then(m => ({ default: m.EntityComments })));

function parseLegacyPositionToBoard(pos: string[]): (Piece | null)[][] {
  const b = createEmptyBoard();
  for (const item of pos || []) {
    const [rawKey, rawCoord] = String(item).split(':');
    if (!rawKey || rawCoord == null) continue;
    const side = rawKey.toLowerCase().startsWith('r') ? 'red' : 'black';
    const typeKey = rawKey.replace(/^r|^b/i, '').toLowerCase();
    const map: Record<string, any> = {
      king: 'general', general: 'general', advisor: 'advisor',
      elephant: 'elephant', horse: 'horse', chariot: 'chariot',
      cannon: 'cannon', pawn: 'soldier', soldier: 'soldier',
    };
    const type = map[typeKey];
    if (!type) continue;
    const s = String(rawCoord).padStart(2, '0');
    const row = Number(s[0]);
    const col = Number(s[1]);
    if (row < 0 || row > 9 || col < 0 || col > 8) continue;
    const id = `${side}-${type}-${row}${col}`;
    b[row][col] = { id, side, type, position: { row, col }, hasMoved: true } as Piece;
  }
  return b;
}

export function PuzzleViewPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const id = useMemo(() => extractIdFromSlug(slug), [slug]);
  const boardRef = useRef<BoardRef>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const [showAlert, setShowAlert] = useState<{ show: boolean; title: string; message: string; variant?: 'info' | 'warning' | 'danger' | 'success' }>({
    show: false, title: '', message: '', variant: 'info'
  });

  const {
    setup,
    isLiked,
    likeCount,
    creatorProfile,
    similar,
    linkedGames,
    solutions,
    isLoadingSimilar,
    isLoadingLinked,
    setSolutions,
    handleToggleLike,
  } = usePuzzleData(id, authState.token, authState.status, {
    onLoginRequired: () => {
      setShowAlert({
        show: true,
        title: t('puzzles.view.loginRequiredTitle'),
        message: t('puzzles.view.loginRequiredMsg'),
        variant: 'warning'
      });
      window.dispatchEvent(new Event('open-login-modal'));
    }
  });

  // AI & Board State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [humanSide, setHumanSide] = useState<PieceSide>('red');

  const { bots, loading: botsLoading, selectedBotId, selectBot, selectedBot } = useActiveBots({ autoSelect: true, defaultLevel: 4 });

  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [boardState, setBoardState] = useState<{
    moveHistory: any[];
    historyViewIndex: number | null;
    currentPlayer: PieceSide;
    winner: PieceSide | null;
    board: (Piece | null)[][];
    isAiThinking: boolean;
  } | null>(null);

  const [viewingSolution, setViewingSolution] = useState<any | null>(null);
  const { success } = useToast();
  const hasSubmitted = useRef<string | null>(null);

  const ai = useMemo(() => ({
    enabled: viewingSolution ? false : aiEnabled,
    side: (humanSide === 'red' ? 'black' : 'red') as PieceSide,
    level: (selectedBot?.level ?? 4) as AiLevel,
    engine: 'pikafish' as const,
    botId: selectedBotId ?? undefined,
  }), [viewingSolution, aiEnabled, humanSide, selectedBotId, selectedBot]);

  const replayProp = useMemo(() => {
    if (viewingSolution) return { history: viewingSolution.moves, index: replayIndex ?? 0 };
    if (replayIndex !== null) return { history: boardState?.moveHistory || [], index: replayIndex };
    return undefined;
  }, [viewingSolution, boardState?.moveHistory, replayIndex]);

  const playerProfiles = useMemo(() => ({
    red: humanSide === 'red' ? (authState.user ? { name: authState.user.displayName || authState.user.name, picture: authState.user.photoURL || authState.user.picture, elo: authState.user.elo || 1200, rank: authState.user.rank, id: authState.user.uid } : null) : (selectedBot ? mapBotToProfile(selectedBot, t) : null),
    black: humanSide === 'black' ? (authState.user ? { name: authState.user.displayName || authState.user.name, picture: authState.user.photoURL || authState.user.picture, elo: authState.user.elo || 1200, rank: authState.user.rank, id: authState.user.uid } : null) : (selectedBot ? mapBotToProfile(selectedBot, t) : null),
  }), [humanSide, authState.user, selectedBot, t]);

  const idealSlug = useMemo(() => setup ? makeSlug(setup.name || 'the-co', setup.id) : '', [setup]);
  const canonicalUrl = useMemo(() => idealSlug ? getAbsoluteUrl(`/puzzles/${idealSlug}`) : undefined, [idealSlug]);

  useEffect(() => {
    if (!setup || !slug || !idealSlug) return;
    if (slug !== idealSlug) {
      navigate(`/puzzles/${idealSlug}`, { replace: true });
    }
  }, [setup, slug, idealSlug, navigate]);

  useEffect(() => {
    if (!boardState || !id || !setup || authState.status !== 'auth') return;
    if (boardState.winner === humanSide && hasSubmitted.current !== id) {
      hasSubmitted.current = id;
      apiPost<{ ok: boolean; rewardedCoins?: number }>(`/setups/${id}/solutions`, { moves: boardState.moveHistory, side: humanSide }, authState.token)
        .then(r => {
          if (r?.ok) {
            if (r.rewardedCoins && r.rewardedCoins > 0) {
              success(<span>{t('puzzles.view.rewardFirst', { count: r.rewardedCoins })}</span>);
            } else {
              success(t('puzzles.view.rewardUpdate'));
            }
            apiGet<{ ok: boolean; solutions: any[] }>(`/setups/${id}/solutions`).then(sr => sr?.ok && setSolutions(sr.solutions));
          }
        });
    }
  }, [boardState?.winner, humanSide, id, authState.token, authState.status, setup, success, setSolutions]);

  useEffect(() => {
    if (!viewingSolution || replayIndex === null) return;
    const totalMoves = viewingSolution.moves?.length || 0;
    if (replayIndex >= totalMoves) return;
    const timer = setTimeout(() => setReplayIndex(prev => (prev !== null && prev < totalMoves) ? prev + 1 : prev), 1500);
    return () => clearTimeout(timer);
  }, [viewingSolution, replayIndex]);

  const board = useMemo(() => {
    if (!setup) return null;
    const b = setup.board;
    if (Array.isArray(b) && b.length === 10) return b as any;
    if (Array.isArray(b) && b.length && typeof b[0] === 'string') return parseLegacyPositionToBoard(b as any);
    return null;
  }, [setup]);

  const activeBoard = board || createEmptyBoard();

  const initialPlayer = useMemo(() => {
    if (!setup?.fen) return 'red';
    return setup.fen.split(' ')[1] === 'b' ? 'black' : 'red';
  }, [setup?.fen]);

  const replayHistory = useMemo(() => {
    const rawHistory = viewingSolution ? viewingSolution.moves : (boardState?.moveHistory || []);
    if (!rawHistory.length) return [];

    const isKingInCheck = (b: (Piece | null)[][], kingSide: PieceSide) => {
      let kRow = -1, kCol = -1;
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const p = b[r][c];
          if (p && p.type === 'general' && p.side === kingSide) {
            kRow = r; kCol = c; break;
          }
        }
        if (kRow !== -1) break;
      }
      if (kRow === -1) return false;
      const opp = kingSide === 'red' ? 'black' : 'red';
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dr, dc] of dirs) {
        let count = 0;
        for (let step = 1; step < 10; step++) {
          const nr = kRow + dr * step, nc = kCol + dc * step;
          if (nr < 0 || nr > 9 || nc < 0 || nc > 8) break;
          const p = b[nr][nc];
          if (p) {
            count++;
            if (count === 1) {
              if (p.side === opp && (p.type === 'chariot' || p.type === 'general')) return true;
            } else if (count === 2) {
              if (p.side === opp && p.type === 'cannon') return true;
              break;
            }
          }
        }
      }
      const hOffs = [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[1,-2],[-1,2],[1,2]];
      const hLegs = [[-1,0],[-1,0],[1,0],[1,0],[0,-1],[0,-1],[0,1],[0,1]];
      for (let i = 0; i < hOffs.length; i++) {
        const nr = kRow + hOffs[i][0], nc = kCol + hOffs[i][1];
        if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const p = b[nr][nc];
          if (p && p.side === opp && p.type === 'horse' && !b[kRow + hLegs[i][0]][kCol + hLegs[i][1]]) return true;
        }
      }
      const sDir = kingSide === 'red' ? 1 : -1;
      const sPos = [[kRow + sDir, kCol], [kRow, kCol - 1], [kRow, kCol + 1]];
      for (const [sr, sc] of sPos) {
        if (sr >= 0 && sr <= 9 && sc >= 0 && sc <= 8) {
          const p = b[sr][sc];
          if (p && p.side === opp && p.type === 'soldier') return true;
        }
      }
      return false;
    };
    
    try {
      let currentBoard = JSON.parse(JSON.stringify(board || createInitialBoard()));
      let currentPlayer = initialPlayer;
      
      return rawHistory.map((m: any) => {
        const from = m.from || m.move?.from;
        const to = m.to || m.move?.to;
        
        if (from && typeof from.row === 'number' && to && typeof to.row === 'number') {
            const movingPiece = currentBoard[from.row][from.col];
            if (movingPiece) {
                currentBoard[from.row][from.col] = null;
                currentBoard[to.row][to.col] = { ...movingPiece, position: { ...to }, hasMoved: true };
            }
        }
        
        const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';
        const fen = boardToFen(currentBoard, nextPlayer);
        const isCheck = isKingInCheck(currentBoard, nextPlayer) || m.check || m.isCheck || m.move?.isCheck || m.move?.check || false;
        
        const res = { ...m, fen, from, to, isCheck };
        currentPlayer = nextPlayer;
        return res;
      });
    } catch (e) {
      console.warn('[PuzzleViewPage] History simulation failed:', e);
      return rawHistory;
    }
  }, [viewingSolution, boardState?.moveHistory, board, initialPlayer]);

  const handleStateChange = (state: any) => {
    setBoardState(state);
  };

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 py-8">
      <SEO
        title={t('puzzles.view.seoTitle', { name: setup?.name || id })}
        description={setup?.description || t('puzzles.view.seoDesc', { name: setup?.name || id })}
        image={id ? getAbsoluteUrl(`/api/export/image/9x10/puzzle/${id}.webp`) : undefined}
        video={id && solutions?.length > 0 ? getAbsoluteUrl(`/api/export/video/9x10/puzzle/${id}.mp4`) : undefined}
        canonical={canonicalUrl}
        jsonLd={setup ? {
          "@context": "https://schema.org",
          "@type": "Game",
          "name": t('puzzles.meta.schemaGameTitle', { name: setup.name }),
          "description": setup.description,
          "author": { "@type": "Person", "name": setup.createdByName || t('puzzles.meta.authorDefault') },
          "genre": "Xiangqi Puzzle",
          "url": canonicalUrl || window.location.href,
          "video": id && solutions?.length > 0 ? (
            solutions.length === 1 ? {
              "@type": "VideoObject",
              "name": t('puzzles.meta.schemaVideoTitle', { name: setup.name }),
              "description": t('puzzles.meta.schemaVideoDesc', { name: setup.name }),
              "thumbnailUrl": getAbsoluteUrl(`/api/export/image/9x10/puzzle/${id}.webp`),
              "uploadDate": new Date(setup.updatedAt || setup.createdAt || Date.now()).toISOString(),
              "contentUrl": getAbsoluteUrl(`/api/export/video/9x10/puzzle/${id}.mp4`)
            } : solutions.map((s: any, idx: number) => ({
              "@type": "VideoObject",
              "name": t('puzzles.meta.schemaVideoSolutionTitle', { name: setup.name, index: idx + 1 }),
              "description": t('puzzles.meta.schemaVideoSolutionDesc', { name: setup.name, index: idx + 1 }),
              "thumbnailUrl": getAbsoluteUrl(`/api/export/image/9x10/puzzle/${id}.webp`),
              "uploadDate": new Date(s.createdAt || setup.updatedAt || Date.now()).toISOString(),
              "contentUrl": getAbsoluteUrl(`/api/export/video/9x10/puzzle/${id}-s${idx}.mp4`)
            }))
          ) : undefined
        } : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr_minmax(320px,400px)] 2xl:grid-cols-[minmax(380px,480px)_1fr_minmax(380px,480px)] gap-6 xl:gap-8 items-start">
        {/* COL 1: CONTROL PANEL - order-1 on mobile */}
        <div className="order-1 lg:order-1 lg:col-start-1 min-h-[400px]">
          <PuzzleControlPanel
            setup={setup} id={id} initialPlayer={initialPlayer} creatorProfile={creatorProfile}
            linkedGames={linkedGames} isLiked={isLiked} likeCount={likeCount} handleToggleLike={handleToggleLike}
            authState={authState} success={success} aiEnabled={aiEnabled} setAiEnabled={setAiEnabled}
            bots={bots} botsLoading={botsLoading} selectedBotId={selectedBotId} onSelectBot={selectBot}
            humanSide={humanSide} setHumanSide={setHumanSide}
            boardState={boardState} boardRef={boardRef} setReplayIndex={setReplayIndex} setViewingSolution={setViewingSolution}
          />
        </div>

        {/* COL 2 (TOP): BOARD - order-2 on mobile */}
        <div className="order-2 lg:order-2 lg:col-start-2 w-full flex flex-col items-center gap-8 min-w-0">
          {board || setup === null ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div ref={boardContainerRef} className="w-full">
                <PuzzleBoard
                  key={setup ? 'loaded' : 'skeleton'}
                  ref={boardRef} hideLobby initialBoard={activeBoard as any} initialPlayer={initialPlayer}
                  ai={ai} side={viewingSolution ? viewingSolution.side : humanSide} hideSidebar={true}
                  historyViewIndex={viewingSolution ? null : replayIndex}
                  onHistoryViewIndexChange={viewingSolution ? undefined : setReplayIndex}
                  replay={viewingSolution ? replayProp : undefined}
                  onReplayIndexChange={viewingSolution ? setReplayIndex : undefined}
                  onStateChange={setBoardState}
                />
              </div>

              {viewingSolution && (
                <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 bg-amber-50 dark:bg-xq-gold/10 border border-amber-600/20 dark:border-xq-gold/30 px-6 py-3 rounded-2xl shadow-lg ring-1 ring-amber-600/10 dark:ring-xq-gold/10">
                    <span className="text-amber-600 dark:text-xq-gold text-xs font-black uppercase tracking-widest animate-pulse">
                      {t('puzzles.view.viewingSolution')}
                    </span>
                    <div className="flex items-center gap-2">
                      {viewingSolution.userPicture && <img src={viewingSolution.userPicture} className="w-5 h-5 rounded-full border border-xq-gold/50" alt={viewingSolution.userName || t('game.blackPlayerDefault')} width={20} height={20} loading="lazy" />}
                      <span className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{viewingSolution.userName}</span>
                    </div>
                  </div>
                  <button onClick={() => { setViewingSolution(null); setReplayIndex(null); }} className="px-8 py-2.5 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-[12px] hover:bg-xq-gold transition-all active:scale-95 shadow-xl shadow-black/20">
                    {t('puzzles.actions.backToSolve')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full text-center py-20">
              <div className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">
                {t('puzzles.view.loadError')}
              </div>
            </div>
          )}
        </div>

        {/* COL 3 (TOP): HISTORY/MOVELIST - order-3 on mobile */}
        <div className="order-3 lg:order-3 lg:col-start-3 w-full flex flex-col gap-6 lg:sticky lg:top-6">
          <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 shrink-0">
              <BoardHeader
                playerProfiles={playerProfiles}
                roomSummary={{
                  title: setup?.name || t('puzzles.unnamed'),
                  playerUids: {
                    red: humanSide === 'red' ? authState.user?.uid : (selectedBotId || 'bot'),
                    black: humanSide === 'black' ? authState.user?.uid : (selectedBotId || 'bot')
                  }
                }} serverClockOffset={0} tick={0}
                socketConnected={{ red: true, black: true }} presenceMap={new Map()}
              />
            </div>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-[250px] overflow-hidden">
                <MoveList
                  history={replayHistory}
                  historyViewIndex={replayIndex}
                  setHistoryViewIndex={(fn: any) => setReplayIndex(typeof fn === 'function' ? fn(replayIndex) : fn)}
                  exitHistoryView={() => viewingSolution ? setReplayIndex(0) : setReplayIndex(null)}
                  replayTotal={viewingSolution ? viewingSolution.moves.length : (boardState?.moveHistory?.length || 0)}
                  onSeek={(idx) => setReplayIndex(idx)}
                />
              </div>
              <div className="p-4 shrink-0 border-t border-black/5 dark:border-white/5">
                <ExportButtons 
                  board={boardState?.board || activeBoard} 
                  currentPlayer={boardState?.currentPlayer || 'red'} 
                  boardRef={boardContainerRef} 
                  className="flex gap-2"
                  history={replayHistory}
                  onSeek={(idx) => setReplayIndex(idx)}
                  initialFen={setup?.fen}
                  uid={viewingSolution ? `${id}-solution` : id}
                  type="puzzle"
                />
                <SocialShare 
                  url={canonicalUrl} 
                  title={setup?.name || id || ''} 
                  className="mt-6 pt-6 border-t border-black/5 dark:border-white/5"
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
            <PuzzleHallOfFame solutions={solutions} viewingSolution={viewingSolution} setViewingSolution={setViewingSolution} setReplayIndex={setReplayIndex} boardContainerRef={boardContainerRef} />
            <InfoCard title={t('navbar.puzzles')} icon="📜">
              <div className="space-y-4 text-xs font-bold text-slate-600 dark:text-white/50 leading-relaxed p-1">
                <div className="space-y-2">
                  <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.mission')}:</span> {t('puzzles.view.missionDesc')}</p>
                  <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.aiSolver')}:</span> {t('puzzles.view.aiSolverDesc')}</p>
                  <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.achievement')}:</span> {t('puzzles.view.achievementDesc')}</p>
                  <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.aiServer')}:</span> {t('puzzles.view.aiServerDesc')}</p>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Media Section - order-4 on mobile */}
        {setup && (
          <div className={`order-4 lg:col-start-2 w-full max-w-[500px] mx-auto grid gap-6 ${solutions?.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="rounded-[4px] overflow-hidden border border-black/5 dark:border-white/5 aspect-[9/10] w-full bg-transparent">
              <img 
                src={getAbsoluteUrl(`/api/export/image/9x10/puzzle/${id}.webp`)} 
                alt={setup.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>

            {solutions?.length > 0 && (
              <div className="rounded-[4px] overflow-hidden border border-black/5 dark:border-white/5 aspect-[9/10] w-full bg-transparent">
                <video 
                  controls 
                  poster={getAbsoluteUrl(`/api/export/image/9x10/puzzle/${id}.webp`)}
                  className="w-full h-full object-contain"
                  preload="none"
                >
                  <source src={getAbsoluteUrl(`/api/export/video/9x10/puzzle/${id}.mp4`)} type="video/mp4" />
                </video>
              </div>
            )}
          </div>
        )}

        {/* MOBILE ONLY: Hall of Fame & Info - order-5 and 6 on mobile */}
        <div className="lg:hidden order-5 w-full flex flex-col gap-6">
          <PuzzleHallOfFame solutions={solutions} viewingSolution={viewingSolution} setViewingSolution={setViewingSolution} setReplayIndex={setReplayIndex} boardContainerRef={boardContainerRef} />
          <InfoCard title={t('navbar.puzzles')} icon="📜">
            <div className="space-y-4 text-xs font-bold text-slate-600 dark:text-white/50 leading-relaxed p-1">
              <div className="space-y-2">
                <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.mission')}:</span> {t('puzzles.view.missionDesc')}</p>
                <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.aiSolver')}:</span> {t('puzzles.view.aiSolverDesc')}</p>
                <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.achievement')}:</span> {t('puzzles.view.achievementDesc')}</p>
                <p><span className="text-slate-800 dark:text-white/80">{t('puzzles.view.aiServer')}:</span> {t('puzzles.view.aiServerDesc')}</p>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* RELATED SECTION - order-6 on mobile */}
        <div className="order-6 lg:col-span-3 w-full space-y-10">
          <PuzzleRelatedSection
            similar={similar}
            linkedGames={linkedGames}
            isLoadingSimilar={isLoadingSimilar}
            isLoadingLinked={isLoadingLinked}
          />

          <div className="w-full pt-10 border-t border-black/5 dark:border-white/5">
            <div className="max-w-4xl mx-auto">
              <LazyMount fallback={<div className="h-40 bg-white/5 animate-pulse rounded-3xl" />} rootMargin="100px">
                <Suspense fallback={<div className="h-40 bg-white/5 animate-pulse rounded-3xl" />}>
                  <EntityComments entityType="puzzle" entityId={String(id)} />
                </Suspense>
              </LazyMount>
            </div>
          </div>
        </div>
      </div>

      <PuzzleSeoContent setupName={setup?.name} />

      <Alert
        isOpen={showAlert.show}
        onClose={() => setShowAlert(prev => ({ ...prev, show: false }))}
        title={showAlert.title}
        message={showAlert.message}
        variant={showAlert.variant}
      />
    </div>
  );
}

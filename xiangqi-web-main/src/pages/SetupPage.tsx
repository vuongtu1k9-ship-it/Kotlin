import { useRef, useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createEmptyBoard } from '../state/initialBoard';
import type { PieceSide } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Board } from '../components/Board';
import { InfoCard } from '../components/ui/InfoCard';
import { useToast } from '../components/ui/Toast';
import { SEO } from '../components/SEO';
import { BoardHeader } from '../components/BoardHeader';
import { ExportButtons } from '../components/ExportButtons';
import type { BoardRef } from '../components/Board';
import { mapBotToProfile } from '../utils/botUtils';
import { useSetupData } from '../hooks/useSetupData';
import { SetupRulesCard } from '../components/setup/SetupRulesCard';
import { SetupModals } from '../components/setup/SetupModals';
import { SetupSeoContent } from '../components/setup/SetupSeoContent';
import { makeSlug } from '../utils/slug';
import { getAbsoluteUrl } from '../utils/url';
import { boardToFen } from '../utils/fen';
import { createInitialBoard } from '../state/initialBoard';

const BoardEditor = lazy(() => import('../components/setup/BoardEditor').then(m => ({ default: m.BoardEditor })));
const PiecePalette = lazy(() => import('../components/setup/PiecePalette').then(m => ({ default: m.PiecePalette })));
const SetupInfoForm = lazy(() => import('../components/setup/SetupInfoForm').then(m => ({ default: m.SetupInfoForm })));
const AiTryoutConfig = lazy(() => import('../components/setup/AiTryoutConfig').then(m => ({ default: m.AiTryoutConfig })));
const SetupHistory = lazy(() => import('../components/setup/SetupHistory').then(m => ({ default: m.SetupHistory })));
const MoveList = lazy(() => import('../components/MoveList').then(m => ({ default: m.MoveList })));

export function SetupPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const {
    board, setBoard, pick, setPick, name, setName, description, setDescription, level, setLevel,
    saved, isPlayingAi, setIsPlayingAi, aiEnabledInTryout, setAiEnabledInTryout,
    playSide, setPlaySide, aiEngine, setAiEngine, aiBotId, setAiBotId, aiLevel, setAiLevel, duplicateInfo, setDuplicateInfo,
    importFen, setImportFen, showValidationErrors, alertInfo, setAlertInfo,
    placeAt, isValidPlacement, saveSetup, handleTryAi, doImportFen, loadSetup
  } = useSetupData(authState, toast);

  const [isClearOpen, setIsClearOpen] = useState(false);
  const [boardState, setBoardState] = useState<any>(null);
  const [historyViewIndex, setHistoryViewIndex] = useState<number | null>(null);
  const [botProfile, setBotProfile] = useState<any>(null);

  const ai = useMemo(() => ({
    enabled: aiEnabledInTryout,
    side: (playSide === 'red' ? 'black' : 'red') as PieceSide,
    level: aiLevel as any,
    botId: aiBotId || undefined,
    engine: aiEngine
  }), [aiEnabledInTryout, playSide, aiLevel, aiBotId, aiEngine]);

  const replayHistory = useMemo(() => {
    if (!boardState?.moveHistory?.length) return [];
    
    // Helper to detect if a king is in check
    const isKingInCheck = (b: any[][], kingSide: 'red' | 'black') => {
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
      // Setup page tryout starts with the current configured board
      let currentBoard = JSON.parse(JSON.stringify(board || createInitialBoard()));
      let currentPlayer = 'red'; // Setup always starts with Red
      
      return boardState.moveHistory.map((m: any) => {
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
        // Automatic check detection for setup tryouts
        const isCheck = isKingInCheck(currentBoard, nextPlayer) || m.check || m.isCheck || m.move?.isCheck || m.move?.check || false;
        const res = { ...m, fen, from, to, isCheck };
        currentPlayer = nextPlayer;
        return res;
      });
    } catch (e) {
      console.warn('[SetupPage] History simulation failed:', e);
      return boardState.moveHistory;
    }
  }, [boardState?.moveHistory, board]);

  const startFen = useMemo(() => {
    return boardToFen(board, 'red');
  }, [board]);

  const boardToExportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<BoardRef>(null);
  const isGuest = !authState.user || authState.user.provider === 'guest';

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 xl:px-12 py-6 md:py-10">
      <SEO
        title={t('setup.seoTitle')}
        description={t('setup.seoDesc')}
        url={getAbsoluteUrl('/xep-co-the')}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr_minmax(320px,400px)] 2xl:grid-cols-[minmax(380px,480px)_1fr_minmax(380px,480px)] gap-6 xl:gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="order-1 lg:order-1 lg:col-start-1 w-full flex flex-col lg:sticky lg:top-6 self-start space-y-6">
          {isPlayingAi ? (
            <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}>
              <InfoCard title={t('setup.tryoutTitle')} icon="🤖">
                <Suspense fallback={<div className="h-40 bg-white/5 animate-pulse rounded-2xl" />}>
                  <AiTryoutConfig
                    setAiEngine={setAiEngine}
                    aiBotId={aiBotId} setAiBotId={setAiBotId}
                    aiLevel={aiLevel} setAiLevel={setAiLevel}
                    aiEnabledInTryout={aiEnabledInTryout} setAiEnabledInTryout={setAiEnabledInTryout}
                    playSide={playSide} setPlaySide={setPlaySide}
                    onBack={() => setIsPlayingAi(false)}
                    onBotSelected={(b: any) => setBotProfile(b)}
                  />
                </Suspense>
              </InfoCard>
            </div>
          ) : (
            <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}>
              <InfoCard title={t('setup.title')} icon="🚀">
                <Suspense fallback={<div className="h-48 bg-white/5 animate-pulse rounded-2xl" />}>
                  <SetupInfoForm
                    name={name} setName={setName}
                    description={description} setDescription={setDescription}
                    level={level} setLevel={setLevel}
                    onSave={saveSetup}
                    isGuest={isGuest} showValidationErrors={showValidationErrors}
                    onLoginRequired={() => {
                      toast.warning(t('setup.toast.loginSave'));
                      window.dispatchEvent(new Event('open-login-modal'));
                    }}
                  />
                </Suspense>
              </InfoCard>
            </div>
          )}
          <div className="hidden xl:block" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
            <SetupRulesCard />
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="order-2 lg:order-2 lg:col-start-2 w-full flex flex-col items-center gap-4 min-w-0">
          {isPlayingAi ? (
            <div ref={boardToExportRef} className="w-full">
              <Board
                ref={boardRef}
                hideLobby
                initialBoard={board}
                initialPlayer="red"
                ai={ai}
                side={playSide}
                hideSidebar={true}
                onStateChange={setBoardState}
                historyViewIndex={historyViewIndex}
                onHistoryViewIndexChange={setHistoryViewIndex}
              />
            </div>
          ) : (
            <div ref={boardToExportRef} className="w-full min-h-[500px]">
              <Suspense fallback={<div className="xq-board-wrap animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', height: '500px' }} />}>
                <BoardEditor board={board} isValidPlacement={isValidPlacement} onPlaceAt={placeAt} />
              </Suspense>
            </div>
          )}
          <div className="text-slate-400 dark:text-white/20 text-xs font-black uppercase tracking-[0.2em] text-center max-w-sm">
            {isPlayingAi ? t('setup.modeTryout') : t('setup.modeEditor')}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="order-3 lg:col-start-3 w-full flex flex-col lg:sticky lg:top-6 self-start space-y-6">
          {isPlayingAi ? (
            <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
              <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
                <BoardHeader
                  playerProfiles={{
                    red: playSide === 'red' 
                      ? { name: authState.user?.name || t('common.you'), picture: authState.user?.picture || null, elo: (authState.user as any)?.elo || 1200, rank: null } 
                      : mapBotToProfile(botProfile, t),
                    black: playSide === 'black' 
                      ? { name: authState.user?.name || t('common.you'), picture: authState.user?.picture || null, elo: (authState.user as any)?.elo || 1200, rank: null } 
                      : mapBotToProfile(botProfile, t)
                  }}
                  currentPlayer={boardState?.currentPlayer || 'red'}
                  serverFinished={false} ai={ai} roomSummary={{
                    playerUids: {
                      red: playSide === 'red' ? authState.user?.uid : (aiBotId || 'bot'),
                      black: playSide === 'black' ? authState.user?.uid : (aiBotId || 'bot')
                    }
                  }} serverClockOffset={0} tick={0}
                  socketConnected={{ red: true, black: true }} presenceMap={new Map()}
                />
              </div>
              <div className="flex flex-col">
                <Suspense fallback={<div className="h-full bg-white/5 animate-pulse" />}>
                  <MoveList
                    history={boardState?.moveHistory || []} historyViewIndex={historyViewIndex}
                    setHistoryViewIndex={(fn: any) => setHistoryViewIndex(typeof fn === 'function' ? fn(historyViewIndex) : fn)}
                    exitHistoryView={() => setHistoryViewIndex(null)} replayTotal={boardState?.moveHistory.length}
                    onSeek={(idx) => setHistoryViewIndex(idx)}
                  />
                </Suspense>
                <div className="p-5 pt-0 flex flex-col gap-4">
                  <div className="flex gap-2">
                    <button onClick={() => boardRef.current?.undo()} disabled={!boardState?.moveHistory?.length} className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-black uppercase text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-30">{t('setup.actionUndo')}</button>
                    <button onClick={() => boardRef.current?.newGame()} className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-black uppercase text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">{t('setup.actionReset')}</button>
                  </div>
                  <div className="pt-2 border-t border-black/5 dark:border-white/5">
                    <ExportButtons 
                      board={boardState?.board} 
                      currentPlayer={boardState?.currentPlayer} 
                      boardRef={boardToExportRef} 
                      className="flex gap-2" 
                      history={replayHistory}
                      onSeek={(idx) => setHistoryViewIndex(idx)}
                      initialFen={startFen}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}>
                <InfoCard title={t('setup.paletteTitle')} icon="🎨">
                  <Suspense fallback={<div className="h-64 bg-white/5 animate-pulse rounded-2xl" />}>
                    <PiecePalette
                      pick={pick} onSelect={setPick} onClearBoard={() => setIsClearOpen(true)}
                      onImportFen={doImportFen} fenValue={importFen} onFenChange={setImportFen}
                      board={board} playSide={playSide} boardRef={boardToExportRef}
                    />
                  </Suspense>
                </InfoCard>
              </div>
              <button onClick={handleTryAi} className="h-14 w-full rounded-3xl bg-xq-gold text-slate-900 font-black uppercase tracking-widest shadow-2xl shadow-xq-gold/20 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3"><span className="text-xl">🤖</span> {t('setup.actionTry')}</button>
            </>
          )}

          {saved.length > 0 && (
            <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
              <InfoCard title={t('setup.historyTitle')} icon="📂">
                <Suspense fallback={<div className="h-64 bg-white/5 animate-pulse rounded-2xl" />}>
                  <SetupHistory
                    saved={saved} onLoad={loadSetup}
                    onView={(n, i) => nav(`/puzzles/${makeSlug(n, i)}`)}
                    onCreateRoom={(id, n) => {
                      if (!authState.user || authState.user.provider === 'guest') {
                        toast.warning(t('setup.toast.loginChallenge'));
                        window.dispatchEvent(new Event('open-login-modal'));
                        return;
                      }
                      window.dispatchEvent(new CustomEvent('open-challenge-modal', { detail: { setupId: id, puzzleName: n } }));
                    }}
                  />
                </Suspense>
              </InfoCard>
            </div>
          )}
          <div className="xl:hidden block" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}>
            <SetupRulesCard />
          </div>
        </div>
      </div>

      <SetupModals
        duplicateInfo={duplicateInfo} setDuplicateInfo={setDuplicateInfo}
        isClearOpen={isClearOpen} setIsClearOpen={setIsClearOpen}
        onClearBoard={() => { setBoard(createEmptyBoard()); setIsClearOpen(false); toast.info(t('setup.toast.boardCleared')); }}
        alertInfo={alertInfo} setAlertInfo={setAlertInfo}
        onViewDuplicate={() => { if (duplicateInfo) { nav(`/puzzles/${makeSlug(duplicateInfo.name, duplicateInfo.uid)}`); setDuplicateInfo(null); } }}
      />
      <SetupSeoContent />
    </div>
  );
}

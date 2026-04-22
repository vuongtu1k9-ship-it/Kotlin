import React, { useState, useRef, lazy, Suspense, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Piece, PieceSide } from '../types';
import { Board } from '../components/Board';
import { BoardHeader } from '../components/BoardHeader';
import { AiTryoutConfig } from '../components/setup/AiTryoutConfig';
import { ExportButtons } from '../components/ExportButtons';
import { BotSpeechBubble } from '../components/BotSpeechBubble';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../auth/AuthContext';
import { SEO } from '../components/SEO';
import { FenImporter } from '../components/setup/FenImporter';
import { createInitialBoard } from '../state/initialBoard';
import { boardToFen } from '../utils/fen';
import { subscribeToBotTaunt } from '../net/socket';
import { useActiveBots } from '../hooks/useActiveBots';
import { mapBotToProfile } from '../utils/botUtils';
import { BotSelector } from '../components/setup/BotSelector';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';

// MoveList counts for a lot of DOM nodes, keep it lazy with deep defer
const MoveList = lazy(() => import('../components/MoveList').then(m => ({ default: m.MoveList })));

import { AiSeoContent } from '../components/setup/AiSeoContent';

export const AiGamePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [level, setLevel] = useState(4);
  const [aiBotId, setAiBotId] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [humanSide, setHumanSide] = useState<'red' | 'black'>('red');
  const [aiEngine, setAiEngine] = useState<'web' | 'pikafish'>('pikafish');
  const [resetKey, setResetKey] = useState(0);
  const [historyViewIndex, setHistoryViewIndex] = useState<number | null>(null);
  const [boardState, setBoardState] = useState<any>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [botProfile, setBotProfile] = useState<any>(null);
  const [h2h, setH2h] = useState<any>(null);
  const [botTaunt, setBotTaunt] = useState<string | null>(null);

  const { bots, loading: botsLoading, selectedBotId, selectBot, selectedBot } = useActiveBots({ autoSelect: true, defaultLevel: level });
  const { onlinePlayers } = useOnlinePlayers();
  const onlineCount = onlinePlayers.length;

  // Sync botProfile with selectedBot from hook
  useEffect(() => {
    if (selectedBot) setBotProfile(selectedBot);
  }, [selectedBot]);

  const [fenInput, setFenInput] = useState('');
  const [initialBoard, setInitialBoard] = useState<(Piece | null)[][] | undefined>(undefined);
  const [initialPlayer, setInitialPlayer] = useState<PieceSide | undefined>(undefined);

  const { state: authState } = useAuth();
  const userUid = authState.user?.uid;

  const boardRef = useRef<any>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const handleImportFen = async () => {
    if (!fenInput.trim()) return;
    try {
      const { fenToBoard } = await import('../utils/fen');
      const { board, sideToMove } = fenToBoard(fenInput);
      setInitialBoard(board);
      setInitialPlayer(sideToMove);
      setHumanSide(sideToMove);
      setResetKey(prev => prev + 1);
      setFenInput('');
    } catch (e) {
      console.error(t('setup.form.importError'), e);
    }
  };

  // Subscribe to bot taunt events
  useEffect(() => {
    const unsub = subscribeToBotTaunt(({ taunt }) => {
      setBotTaunt(taunt);
      // Auto-clear after bubble dismisses itself
      setTimeout(() => setBotTaunt(null), 8000);
    });
    return unsub;
  }, []);

  // Deep defer for absolute 0ms TBT (6s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSecondary(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch H2H when botProfile changes
  useEffect(() => {
    if (userUid && botProfile?.uid) {
      apiGet(`/users/${userUid}/vs/${botProfile.uid}`).then(res => {
        if (res.ok) setH2h(res.stats);
      });
    } else {
      setH2h(null);
    }
  }, [userUid, botProfile?.uid]);

  const aiConfig = useMemo(() => ({
    enabled: aiEnabled,
    level,
    botId: selectedBotId || undefined,
    engine: aiEngine,
    side: humanSide === 'red' ? 'black' : 'red'
  }), [aiEnabled, level, selectedBotId, aiEngine, humanSide]);

  const handleGameOver = useCallback((result: { winner: 'red' | 'black' | null; endedBy: string | null }) => {
    if (!userUid || !botProfile) return;

    const botUid = botProfile.uid || botProfile._id;
    const botName = botProfile.name;

    const playerUids = {
      red: humanSide === 'red' ? userUid : botUid,
      black: humanSide === 'black' ? userUid : botUid
    };
    const playerNames = {
      red: humanSide === 'red' ? (authState.user?.name || t('common.you')) : botName,
      black: humanSide === 'black' ? (authState.user?.name || t('common.you')) : botName
    };

    // Construct a minimal state for history tracking
    const finalState = {
      ...boardState,
      winner: result.winner,
      endedBy: result.endedBy,
      finished: true,
      playerUids,
      playerNames,
      updatedAt: Date.now(),
    };

    apiPost('/games/ai/finish', {
      state: finalState,
      playerUids,
      playerNames,
      level,
    }).then(res => {
      console.log('[AiGamePage] Game saved:', res);
      // Refresh H2H after saving
      apiGet(`/users/${userUid}/vs/${botUid}`).then(hRes => {
        if (hRes.ok) setH2h(hRes.stats);
      });
    });
  }, [userUid, level, humanSide, boardState, authState.user?.name, botProfile]);

  const replayHistory = useMemo(() => {
    if (!boardState?.moveHistory?.length) return [];
    
    // Helper to detect if a king is in check
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
      // Create a deep copy of the starting board for simulation
      let currentBoard = JSON.parse(JSON.stringify(initialBoard || createInitialBoard()));
      let currentPlayer = initialPlayer || 'red';
      
      return boardState.moveHistory.map((m: any) => {
        const from = m.from || m.move?.from;
        const to = m.to || m.move?.to;
        
        if (from && typeof from.row === 'number' && to && typeof to.row === 'number') {
            const movingPiece = currentBoard[from.row][from.col];
            // Only move if there's actually a piece (safety check)
            if (movingPiece) {
                currentBoard[from.row][from.col] = null;
                currentBoard[to.row][to.col] = { ...movingPiece, position: { ...to }, hasMoved: true };
            }
        }
        
        const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';
        const fen = boardToFen(currentBoard, nextPlayer);
        // Robust check detection from engine/history metadata + manual board check
        const isCheck = isKingInCheck(currentBoard, nextPlayer) || m.check || m.isCheck || m.move?.isCheck || m.move?.check || false;
        const res = { ...m, fen, from, to, isCheck };
        currentPlayer = nextPlayer;
        return res;
      });
    } catch (e) {
      console.warn('[AiGamePage] History simulation failed:', e);
      return boardState.moveHistory;
    }
  }, [boardState?.moveHistory, initialBoard, initialPlayer]);

  const startFen = useMemo(() => {
    if (initialBoard && initialPlayer) {
      return boardToFen(initialBoard, initialPlayer);
    }
    return "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
  }, [initialBoard, initialPlayer]);


  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title={t('ai.seoTitle', { name: selectedBot?.name || t('game.aiPlayer') })}
        description={t('ai.seoDesc', { name: selectedBot?.name || t('game.aiPlayer') })}
      />
      <div className="mx-auto max-w-[1920px] w-full px-4 py-8">
        {/* Title for LCP & SEO */}
        <div className="lg:hidden px-2 mb-4 order-first">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Đánh <span className="text-blue-500">Cờ Tướng Với Máy</span> - AI Pikafish
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr_minmax(320px,400px)] 2xl:grid-cols-[minmax(380px,480px)_1fr_minmax(380px,480px)] gap-6 xl:gap-8 items-start">
        {/* LEFT: Setup - Integrated Unified UI */}
        <div className="order-1 lg:col-start-1 w-full space-y-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}>
          <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-xl border border-black/10 dark:border-white/10 rounded-[32px] p-6 lg:p-8 flex flex-col gap-6">
            
            {/* Header: Dynamic title based on mode */}
            <div className="flex items-center gap-3 px-1">
              <div className="w-2 h-6 bg-xq-gold rounded-full shadow-[0_0_12px_rgba(212,175,55,0.4)]"></div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>{t('ai.settings')}</span>
                {aiEnabled && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-500 lowercase font-bold tracking-tight">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineCount} {t('navbar.online')}
                  </span>
                )}
              </h2>
            </div>

            {/* Config Form (Mode, Bot Select, Side, etc) */}
            <AiTryoutConfig
              aiBotId={selectedBotId}
              setAiBotId={selectBot}
              aiLevel={level}
              setAiLevel={setLevel}
              aiEnabledInTryout={aiEnabled}
              setAiEnabledInTryout={setAiEnabled}
              playSide={humanSide}
              setPlaySide={setHumanSide}
              onBack={() => navigate('/')}
              backLabel={t('navbar.home')}
              setAiEngine={setAiEngine as any}
              hideBotSelector={false} 
            />
            
            {/* FEN Import & Tools (Undo/New Game) */}
            <div className="space-y-6 pt-4 border-t border-black/5 dark:border-white/5">
              <FenImporter
                fenValue={fenInput}
                onFenChange={setFenInput}
                onImport={handleImportFen}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => boardRef.current?.undo()}
                  disabled={!boardState?.moveHistory?.length}
                  className="h-9 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  {t('ai.undo')}
                </button>
                <button
                  onClick={() => {
                    setInitialBoard(undefined);
                    setInitialPlayer(undefined);
                    setResetKey(prev => prev + 1);
                  }}
                  className="h-9 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  {t('ai.newGame')}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* CENTER: Board - Fixed Aspect 9/11 */}
        <div className="order-2 lg:col-start-2 w-full flex flex-col items-center gap-6 min-w-0 max-w-[650px] mx-auto">
          <div
            ref={boardContainerRef}
            className="w-full xq-board-container relative"
            style={{ width: '100%', maxWidth: '650px', aspectRatio: '9/11', background: '#0f172a', borderRadius: '20px', minHeight: '400px' }}
          >
            <Board
              key={`${humanSide}-${level}-${resetKey}`}
              ref={boardRef}
              ai={aiConfig as any}
              side={humanSide}
              initialBoard={initialBoard}
              initialPlayer={initialPlayer}
              hideLobby={true}
              hideSidebar={true}
              onStateChange={setBoardState}
              historyViewIndex={historyViewIndex}
              onHistoryViewIndexChange={setHistoryViewIndex}
              onGameOver={handleGameOver}
              h2h={h2h}
            />
          </div>
        </div>

            {/* RIGHT: Cockpit - Deferred List */}
        <div className="order-3 lg:col-start-3 w-full flex flex-col gap-6 lg:sticky lg:top-6">
          <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col min-h-[450px]">
            <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 shrink-0 relative">
              {/* Bot speech bubble – positioned relative to the header */}
              <BotSpeechBubble
                message={botTaunt}
                personality={botProfile?.personality}
                side={humanSide === 'red' ? 'black' : 'red'}
                humanSide={humanSide}
              />
              <BoardHeader
                playerProfiles={{
                  red: (humanSide === 'black' ? aiConfig.side === 'red' : false) ? mapBotToProfile(selectedBot, t) : { id: authState.user?.uid || null, name: authState.user?.name || t('common.you'), picture: authState.user?.picture || null, elo: (authState.user as any)?.elo || 1200, rank: null },
                  black: (humanSide === 'red' ? aiConfig.side === 'black' : false) ? mapBotToProfile(selectedBot, t) : { id: authState.user?.uid || null, name: authState.user?.name || t('common.you'), picture: authState.user?.picture || null, elo: (authState.user as any)?.elo || 1200, rank: null }
                }}
                currentPlayer={boardState?.currentPlayer || 'red'}
                serverFinished={boardState?.isGameOver || false}
                ai={aiConfig as any}
                roomSummary={{
                   playerUids: {
                     red: humanSide === 'red' ? userUid : (botProfile?.uid || 'bot'),
                     black: humanSide === 'black' ? userUid : (botProfile?.uid || 'bot')
                   }
                }}
                presenceMap={new Map()}
                socketConnected={{ red: true, black: true }}
                serverClockOffset={0}
                tick={0}
                h2h={h2h}
              />
            </div>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-[250px] overflow-hidden">
                {showSecondary && (
                  <Suspense fallback={<div className="h-full w-full bg-slate-50 dark:bg-white/[0.02]" />}>
                    <MoveList
                      history={boardState?.moveHistory || []}
                      historyViewIndex={historyViewIndex}
                      setHistoryViewIndex={(idx: any) => setHistoryViewIndex(idx)}
                      exitHistoryView={() => setHistoryViewIndex(null)}
                      replayTotal={boardState?.moveHistory?.length || 0}
                      onSeek={(idx: number | null) => setHistoryViewIndex(idx)}
                    />
                  </Suspense>
                )}
              </div>
              <div className="p-4 shrink-0 border-t border-black/5 dark:border-white/5">
                <ExportButtons 
                  board={boardState?.board} 
                  currentPlayer={boardState?.currentPlayer} 
                  boardRef={boardContainerRef} 
                  className="flex gap-2" 
                  history={replayHistory}
                  onSeek={(idx) => setHistoryViewIndex(idx)}
                  initialFen={startFen}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <AiSeoContent />
    </div>
  );
};

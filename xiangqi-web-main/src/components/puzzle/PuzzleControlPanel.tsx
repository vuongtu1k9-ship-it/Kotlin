import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { InfoCard } from '../ui/InfoCard';
import { BotSelector } from '../setup/BotSelector';
import type { ActiveBot } from '../../hooks/useActiveBots';
import type { PieceSide } from '../../types';

const UserPresenceBundle = lazy(() => import('../UserPresenceBundle').then(m => ({ default: m.UserPresenceBundle })));

interface PuzzleControlPanelProps {
  setup: any | null;
  id: string | null;
  initialPlayer: PieceSide;
  creatorProfile: any | null;
  linkedGames: any[];
  isLiked: boolean;
  likeCount: number;
  handleToggleLike: () => void;
  authState: any;
  success: (msg: any, options?: any) => void;
  aiEnabled: boolean;
  setAiEnabled: (e: boolean) => void;
  bots: ActiveBot[];
  botsLoading: boolean;
  selectedBotId: string | null;
  onSelectBot: (uid: string) => void;
  humanSide: PieceSide;
  setHumanSide: (s: PieceSide) => void;
  boardState: any;
  boardRef: React.RefObject<any>;
  setReplayIndex: (idx: number | null) => void;
  setViewingSolution: (sol: any | null) => void;
}

export const PuzzleControlPanel: React.FC<PuzzleControlPanelProps> = ({
  setup,
  id,
  initialPlayer,
  creatorProfile,
  linkedGames,
  isLiked,
  likeCount,
  handleToggleLike,
  authState,
  success,
  aiEnabled,
  setAiEnabled,
  bots,
  botsLoading,
  selectedBotId,
  onSelectBot,
  humanSide,
  setHumanSide,
  boardState,
  boardRef,
  setReplayIndex,
  setViewingSolution,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col w-full lg:sticky lg:top-6 self-start space-y-6 order-1">
      <InfoCard title={t('puzzles.view.title')} icon="🧩">
        <div className="space-y-5">
          <div className="flex flex-col gap-1 pb-4 border-b border-black/5 dark:border-white/5 min-h-[140px]">
            <Link to="/puzzles" className="inline-flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors mb-2">← {t('puzzles.view.backToList')}</Link>
            <div className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">{t('puzzles.view.title')}</div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              {setup ? setup.name : (id ? t('puzzles.view.puzzleNameLabel', { id }) : t('common.loading'))}
            </h1>
            {setup?.description ? (
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-white/40 italic leading-relaxed">"{setup.description}"</p>
            ) : (
              <div className="mt-3 h-4 w-3/4 bg-slate-100 dark:bg-white/5 animate-pulse rounded-md" />
            )}
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60">{t('puzzles.view.firstPlayer')}:</span>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${initialPlayer === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}>
                  {initialPlayer === 'red' ? t('puzzles.view.redFirst') : t('puzzles.view.blackFirst')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60">{t('puzzles.view.creator')}:</span>
                {setup?.createdAt && (
                  <span className="text-xs font-bold text-slate-600/60 dark:text-white/60 uppercase tracking-widest">
                    {new Date(setup.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                )}
              </div>
              {creatorProfile && (
                <Suspense fallback={<div className="h-8 w-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />}>
                  <UserPresenceBundle player={creatorProfile} size="sm" />
                </Suspense>
              )}
            </div>

            {setup?.level && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60">{t('puzzles.view.difficulty')}:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`h-1 w-2 rounded-full ${i < setup.level! ? 'bg-amber-600 dark:bg-xq-gold shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-black/5 dark:bg-white/5'}`}></div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Stats Bar */}
            <div className="grid grid-cols-4 gap-2 py-4 border-y border-black/5 dark:border-white/5 my-2">
               <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{setup?.viewCount || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Views</span>
               </div>
               <div className="flex flex-col items-center gap-1 border-x border-black/5 dark:border-white/5">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{setup?.attemptCount || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tries</span>
               </div>
               <div className="flex flex-col items-center gap-1 border-r border-black/5 dark:border-white/5">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">{setup?.solveCount || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Solved</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-black text-rose-500 leading-none">{setup?.likeCount || likeCount || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Likes</span>
               </div>
            </div>

            {linkedGames.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mb-3">{t('puzzles.view.relatedGames')}</div>
                <Link 
                  to={`/game/${linkedGames[0].roomId}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-sm shadow-inner transition-transform group-hover:scale-110">⚔️</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-xq-gold uppercase tracking-widest leading-none mb-1">{t('puzzles.view.justHappened')}</span>
                    <span className="text-xs font-black truncate text-slate-800 dark:text-white/90 group-hover:underline transition-colors">
                      {linkedGames[0].players.redName} vs {linkedGames[0].players.blackName}
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4 border-t border-black/5 dark:border-white/5 mt-4">
          <button
            onClick={handleToggleLike}
            className={`flex items-center justify-center gap-2 h-12 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${isLiked ? 'border-rose-500/40 bg-rose-500/10 text-rose-400' : 'border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:bg-white/10'}`}
          >
            <span aria-hidden="true">{isLiked ? '❤️' : '🤍'}</span> {isLiked ? t('puzzles.view.saved') : t('puzzles.view.savePuzzle')} {likeCount > 0 && `(${likeCount})`}
          </button>
          <button
            onClick={() => {
              if (!setup) return;
              if (!authState.user || authState.user.provider === 'guest') {
                success(t('puzzles.loginToChallenge'), { duration: 5000 });
                return;
              }
              window.dispatchEvent(new CustomEvent('open-challenge-modal', {
                detail: { setupId: setup.id, puzzleName: setup.name }
              }));
            }}
            className="h-12 rounded-2xl bg-blue-600 font-black text-xs text-slate-900 dark:text-white uppercase tracking-[0.15em] hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/30"
          >
            <span aria-hidden="true">⚔️</span> {t('common.challenge')}
          </button>
        </div>
      </InfoCard>

      <InfoCard title={t('puzzles.view.solverTitle')} icon="🤖">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="solve-mode-select" className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 ml-1">{t('puzzles.view.solveMode')}:</label>
            <select
              id="solve-mode-select"
              className="w-full h-11 px-4 text-xs font-black border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/90 shadow-sm transition-all hover:bg-slate-200 dark:bg-white/10 appearance-none cursor-pointer"
              value={aiEnabled ? 'ai' : 'manual'}
              onChange={e => setAiEnabled(e.target.value === 'ai')}
            >
              <option value="ai" className="bg-[#1a1b1e]">{t('puzzles.view.modeAi')}</option>
              <option value="manual" className="bg-[#1a1b1e]">{t('puzzles.view.modeManual')}</option>
            </select>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Bot selector - only shown if AI is enabled */}
            {aiEnabled && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                <label htmlFor="bot-select" className="text-[9px] font-black uppercase tracking-widest text-xq-gold ml-1">
                  {t('setup.tryout.selectBot')}
                </label>
                <div className="relative group">
                  <select
                    id="bot-select"
                    disabled={!aiEnabled}
                    className={`w-full h-11 px-4 pr-10 text-[11px] font-black border rounded-xl focus:outline-none bg-xq-gold/5 shadow-sm transition-all appearance-none uppercase tracking-tight ${
                      !aiEnabled 
                        ? 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20 cursor-not-allowed' 
                        : 'border-xq-gold/20 focus:border-xq-gold/50 text-slate-900 dark:text-white hover:bg-xq-gold/10 cursor-pointer'
                    }`}
                    value={selectedBotId || ''}
                    onChange={e => onSelectBot(e.target.value)}
                  >
                    {botsLoading ? (
                      <option>{t('common.loading')}</option>
                    ) : (
                      bots.map(b => (
                        <option key={b.uid || b._id} value={b.uid || b._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-2">
                          {b.name} — {b.elo} Elo
                        </option>
                      ))
                    )}
                  </select>
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors text-[10px] ${!aiEnabled ? 'text-slate-300 dark:text-white/10' : 'text-xq-gold/40 group-hover:text-xq-gold'}`}>
                    ▼
                  </div>
                </div>
              </div>
            )}

            {/* Side selection - always shown */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-1">
                {aiEnabled ? t('puzzles.view.sideSelect') : t('setup.tryout.viewLabel')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setHumanSide('red')} 
                  className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${humanSide === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20'}`}
                >
                  {t('puzzles.view.redSide')}
                </button>
                <button 
                  onClick={() => setHumanSide('black')} 
                  className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${humanSide === 'black' ? 'bg-slate-500/10 border-slate-500/30 text-slate-300 shadow-[0_0_15px_rgba(100,116,139,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20'}`}
                >
                  {t('puzzles.view.blackSide')}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => boardRef.current?.undo()}
                disabled={!boardState?.moveHistory?.length}
                className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-black uppercase text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-30"
              >
                {t('puzzles.view.undo')}
              </button>
              <button
                onClick={() => {
                  boardRef.current?.newGame();
                  setReplayIndex(null);
                  setViewingSolution(null);
                }}
                className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-black uppercase text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                {t('puzzles.view.restart')}
              </button>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
};

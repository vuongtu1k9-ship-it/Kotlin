import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { makeSlug } from '../utils/slug';

interface H2HCardProps {
  h2h: {
    u1Wins: number;
    u2Wins: number;
    draws: number;
    total: number;
    recentGames?: any[];
  } | null;
  playerUids: { red: string | null; black: string | null } | null;
  playerNames?: { red: string | null; black: string | null } | null;
  className?: string;
}

export const H2HCard: React.FC<H2HCardProps> = ({ h2h, playerUids, playerNames, className = '' }) => {
  const { t, i18n } = useTranslation();
  if (!h2h) {
    return (
      <div className={`p-6 rounded-[32px] bg-white/70 dark:bg-black/40 border border-white/20 dark:border-white/10 backdrop-blur-2xl shadow-2xl ${className} min-h-[300px] flex flex-col gap-4 animate-pulse`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-5 w-32 bg-white/10 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 bg-white/5 rounded-3xl" />
          <div className="h-24 bg-white/5 rounded-3xl" />
          <div className="h-24 bg-white/5 rounded-3xl" />
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full mt-4" />
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-[32px] bg-white/70 dark:bg-black/40 border border-white/20 dark:border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden group ${className}`}>
      {/* Decorative background light */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
            <span className="animate-pulse">⚔️</span>
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/40 leading-none mb-1.5">{t('game.h2h.analysis')}</h3>
            <div className="text-base font-black text-slate-800 dark:text-white/95 tracking-tight">{t('game.h2h.title')}</div>
          </div>
        </div>
        {h2h.total > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">{t('game.h2h.matchesCount', { count: h2h.total })}</span>
          </div>
        )}
      </div>
      
      {h2h.total > 0 ? (
        <div className="relative space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-b from-white/10 to-transparent dark:from-white/[0.03] dark:to-transparent rounded-[24px] p-4 flex flex-col items-center border border-white/20 dark:border-white/5 shadow-xl">
              <span className="text-[9px] font-black text-red-500/80 uppercase tracking-tighter mb-2 truncate max-w-full">{playerNames?.red || t('game.h2h.red')}</span>
              <span className="text-3xl font-mono font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">{h2h.u1Wins}</span>
            </div>
            <div className="bg-gradient-to-b from-white/10 to-transparent dark:from-white/[0.03] dark:to-transparent rounded-[24px] p-4 flex flex-col items-center border border-white/20 dark:border-white/5 shadow-xl">
              <span className="text-[9px] font-black text-slate-400/80 dark:text-white/30 uppercase tracking-tighter mb-2">{t('common.draw')}</span>
              <span className="text-3xl font-mono font-black text-slate-400 dark:text-white/40">{h2h.draws}</span>
            </div>
            <div className="bg-gradient-to-b from-white/10 to-transparent dark:from-white/[0.03] dark:to-transparent rounded-[24px] p-4 flex flex-col items-center border border-white/20 dark:border-white/5 shadow-xl">
              <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-tighter mb-2 truncate max-w-full">{playerNames?.black || t('game.h2h.black')}</span>
              <span className="text-3xl font-mono font-black text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">{h2h.u2Wins}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
               <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest">{Math.round((h2h.u1Wins/h2h.total)*100)}%</span>
               <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">{Math.round((h2h.u2Wins/h2h.total)*100)}%</span>
            </div>
            <div className="h-2.5 w-full bg-black/10 dark:bg-black/40 rounded-full overflow-hidden flex border border-white/5 shadow-inner p-0.5">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000" style={{ width: `${(h2h.u1Wins / h2h.total) * 100}%` }} />
              <div className="h-full bg-white/20 mx-0.5 rounded-full" style={{ width: `${(h2h.draws / h2h.total) * 100}%` }} />
              <div className="h-full bg-gradient-to-l from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${(h2h.u2Wins / h2h.total) * 100}%` }} />
            </div>
          </div>

          {h2h.recentGames && h2h.recentGames.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-black/5 dark:to-white/5" />
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20">{t('game.h2h.recentMatches')}</h4>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-black/5 dark:to-white/5" />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {h2h.recentGames.map((g: any) => {
                  const gId = g.gameId;
                  if (!gId || !g.playerNames) return null;
                  
                  const gSlug = makeSlug(g.puzzleName || `${g.playerNames.red || 'player'}-vs-${g.playerNames.black || 'player'}`, gId);
                  const isRedWin = g.winner === 'red';
                  const isBlackWin = g.winner === 'black';
                  const isDraw = !g.winner;
                  const isUserWinner = ((isRedWin && g.playerUids?.red === playerUids?.red) || (isBlackWin && g.playerUids?.black === playerUids?.red));

                  
                  return (
                    <Link 
                      key={gId}
                      to={`/game/${gSlug}`}
                      className="group/item flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] hover:scale-[1.02] hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isDraw ? 'bg-slate-400' : (isRedWin ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.5)]')}`} />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 truncate group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                            {g.playerNames?.red} <span className="text-slate-300 dark:text-white/10 mx-0.5">vs</span> {g.playerNames?.black}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-medium text-slate-300 dark:text-white/20 tracking-tighter">
                            #{gId.substring(0,6)}
                           </span>
                           <span className="text-[9px] font-medium text-slate-300 dark:text-white/20">•</span>
                           <span className="text-[9px] font-medium text-slate-300 dark:text-white/20 whitespace-nowrap">
                            {new Date(g.updatedAt || g.createdAt).toLocaleDateString(i18n.language)}
                           </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-3">
                        <div className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter transition-all duration-300 ${
                          isDraw ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30' : 
                          isUserWinner 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {isDraw ? t('common.draw') : (
                            isUserWinner 
                            ? t('game.h2h.youWin')
                            : t('game.h2h.opponentWin')
                          )}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                           <span className="text-slate-400 dark:text-white/40 group-hover/item:translate-x-0.5 transition-transform text-xs">→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center bg-black/5 dark:bg-black/20 rounded-[28px] border border-dashed border-black/10 dark:border-white/10">
          <div className="text-3xl mb-4 opacity-20 grayscale">🏆</div>
          <div className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em] italic text-center px-4">{t('game.h2h.collectingData')}</div>
        </div>
      )}
    </div>
  );
};

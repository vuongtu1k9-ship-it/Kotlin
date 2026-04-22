import React from 'react';
import { useTranslation } from 'react-i18next';

interface Solution {
  _id: string;
  userId: string;
  userName: string;
  userPicture?: string;
  createdAt: number;
  moveCount: number;
  side?: 'red' | 'black';
}

interface PuzzleHallOfFameProps {
  solutions: Solution[];
  viewingSolution: any | null;
  setViewingSolution: (sol: any) => void;
  setReplayIndex: (idx: number | null) => void;
  boardContainerRef: React.RefObject<HTMLDivElement>;
}

export const PuzzleHallOfFame: React.FC<PuzzleHallOfFameProps> = ({
  solutions,
  viewingSolution,
  setViewingSolution,
  setReplayIndex,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-xq-gold">{t('puzzles.view.hallOfFame')}</div>
          <div className="text-xs font-bold text-slate-500 dark:text-white/60 lowercase">{t('puzzles.view.solvedBy')}</div>
        </div>
        <div className="h-8 w-8 rounded-full bg-xq-gold/10 border border-xq-gold/20 flex items-center justify-center text-xq-gold text-xs shadow-[0_0_15px_rgba(212,175,55,0.2)]">🏆</div>
      </div>

      <div className="space-y-2 min-h-[200px] max-h-[280px] flex flex-col overflow-y-auto pr-1 custom-scrollbar">
        {solutions.length > 0 ? (
          solutions.map((sol, idx) => (
            <button
              key={sol._id}
              onClick={() => {
                setViewingSolution(sol);
                setReplayIndex(0);
              }}
              className={`w-full shrink-0 group flex items-center justify-between p-3 rounded-2xl border transition-all ${viewingSolution?._id === sol._id ? 'border-xq-gold/40 bg-xq-gold/10' : 'border-black/5 dark:border-white/10 bg-white/[0.02] hover:bg-slate-100 dark:bg-white/10 hover:border-black/20 dark:border-white/20'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={sol.userPicture || `/api/avatars/${sol.userId}.webp`}
                    className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 group-hover:border-xq-gold/30 transition-colors"
                    alt={sol.userName || t('puzzles.view.player')}
                    width={32}
                    height={32}
                    loading="lazy"
                  />
                  {idx === 0 && <span className="absolute -top-[6px] -right-[6px] text-[14px]" aria-hidden="true">👑</span>}
                </div>
                <div className="flex flex-col items-start translate-y-[1px] min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-left ${viewingSolution?._id === sol._id ? 'text-xq-gold' : 'text-slate-900 dark:text-white/90'} text-[11px] font-black uppercase tracking-tight group-hover:text-slate-900 dark:text-white transition-colors`}>{sol.userName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${sol.side === 'black' ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'}`}>
                      {sol.side === 'black' ? 'Đen' : 'Đỏ'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">{new Date(sol.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} • {t('puzzles.view.movesCount', { count: sol.moveCount })}</span>
                </div>
              </div>
              <div className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all ${viewingSolution?._id === sol._id ? 'bg-xq-gold text-black' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60 group-hover:bg-xq-gold group-hover:text-black'}`}>{t('puzzles.view.view')}</div>
            </button>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-3 bg-white/[0.02] rounded-3xl border border-black/5 dark:border-white/5 border-dashed">
            <div className="text-2xl opacity-20">🎯</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 whitespace-pre-line">{t('puzzles.view.noSolutions')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

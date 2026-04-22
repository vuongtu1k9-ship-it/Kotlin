import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MiniBoard } from '../MiniBoard';

interface RecentGamesSectionProps {
  games: any[];
  resultLabel: (g: any) => { text: string; color: string };
}

export const RecentGamesSection: React.FC<RecentGamesSectionProps> = ({ games, resultLabel }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3"><span className="text-emerald-400">⚔️</span> {t('settings.matchHistory')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {games.map(g => {
          const res = resultLabel(g);
          const pRed = g.players?.redName || '...';
          const pBlack = g.players?.blackName || '...';
          return (
            <div key={g.gameId} className="group flex flex-col gap-4 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 p-5 hover:bg-white/[0.05] transition-all hover:-translate-y-1">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400 dark:text-white/20">{g.timeMode}</span>
                <span className={res.color}>{res.text}</span>
              </div>
              <div className="aspect-[9/10] bg-white/90 dark:bg-black/40 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
                <MiniBoard board={g.thumbBoard || g.board} position={g.thumbPosition || g.position} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-slate-800 dark:text-white/70 truncate flex-1">{pRed}</span>
                <span className="text-[8px] italic text-slate-400 dark:text-white/10">VS</span>
                <span className="text-[11px] font-black text-slate-800 dark:text-white/70 truncate flex-1 text-right">{pBlack}</span>
              </div>
              <Link to={`/game/${g.gameId}`} className="py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 group-hover:bg-blue-600 group-hover:text-slate-900 dark:text-white transition-all">{t('profile.sections.viewGame')}</Link>
            </div>
          );
        })}
        {games.length === 0 && <div className="col-span-full py-20 text-center text-[10px] font-black text-slate-400 dark:text-white/10 uppercase italic">{t('profile.sections.historyEmpty', { defaultValue: 'No matches yet' })}</div>}
      </div>
    </div>
  );
};

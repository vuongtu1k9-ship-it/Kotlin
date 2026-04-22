import React from 'react';
import { useTranslation } from 'react-i18next';
import { getEloRank } from '../../utils/eloRanks';
import { makeSlug } from '../../utils/slug';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  user: { uid: string; name?: string; picture?: string | null };
  stats: { elo: number; gamesPlayed: number; followersCount?: number; inventory?: Record<string, number> } | null;
  settings: any;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, stats, settings }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-[3rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 p-10 shadow-2xl flex flex-col md:flex-row items-center gap-12">
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20" />
        {user?.picture ? (
          <img src={user.picture} className="h-40 w-40 rounded-[3rem] border-4 border-black/5 dark:border-white/5 relative z-10 object-cover shadow-2xl" alt="avatar" />
        ) : (
          <div className="h-40 w-40 rounded-[3rem] bg-slate-100 dark:bg-white/5 border-4 border-black/5 dark:border-white/5 flex items-center justify-center text-6xl relative z-10">👤</div>
        )}
      </div>
      
      <div className="flex-1 space-y-6 text-center md:text-left">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-widest leading-none">{user?.name}</h2>
          {stats && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-xq-gold text-black text-xs font-black uppercase tracking-widest shadow-xl">
              <span>{getEloRank(stats.elo, settings['elo.ranks']).icon} {stats.elo}</span>
              <span className="opacity-40">|</span>
              <span>{t(getEloRank(stats.elo, settings['elo.ranks']).title)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-8 text-xs font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest">
          <div className="flex items-center gap-2"><span className="text-lg text-rose-500">❤️</span> {stats?.followersCount || 0} {t('profile.followers')}</div>
          <div className="flex items-center gap-2"><span className="text-lg text-blue-500">⚔️</span> {stats?.gamesPlayed || 0} {t('profile.games')}</div>
          <div className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:text-white transition-colors" onClick={() => navigate(`/player/${makeSlug(user?.name || '', user?.uid || '')}`)}>🔗 {t('profile.publicProfile', { defaultValue: 'Public Profile' })}</div>
        </div>
      </div>

      {stats && (
        <div className="min-w-[200px] flex flex-col items-center md:items-end gap-2">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-xq-gold/40">{t('profile.inventory', { defaultValue: 'Assets' })}</div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🪙</span>
            <span className="text-4xl font-black text-xq-gold tabular-nums">{(stats.inventory?.coins || 0).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

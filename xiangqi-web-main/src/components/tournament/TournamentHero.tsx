import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RichContentRenderer } from '../RichContentRenderer';
import { useCountdown } from '../../hooks/useCountdown';
import { TIME_CONTROL_CONFIG, TOURNAMENT_FORMATS } from '../../constants/tournamentConstants';



interface TournamentHeroProps {
  tournament: any;
  isAdmin: boolean;
  authState: any;
  myAlreadyJoined: boolean;
  myPending: boolean;
  deadlinePassed: boolean;
  onJoin: () => void;
  joining: boolean;
}

export const TournamentHero: React.FC<TournamentHeroProps> = ({
  tournament,
  isAdmin,
  authState,
  myAlreadyJoined,
  myPending,
  deadlinePassed,
  onJoin,
  joining
}) => {
  const { t } = useTranslation();
  const countdown = useCountdown(tournament?.registrationDeadline);

  const tcLabels: Record<string, string> = Object.fromEntries(
    Object.entries(TIME_CONTROL_CONFIG).map(([key, val]) => [
      key, 
      `${val.icon} ${t(`game.timeModes.${key}`)} (${val.display})`
    ])
  );
  const fmtLabels: Record<string, string> = Object.fromEntries(
    Object.entries(TOURNAMENT_FORMATS).map(([key]) => [
      key, 
      t(`tournaments.formats.${key}`)
    ])
  );

  const parseDate = (d?: string | null) => {
    if (!d) return null;
    const p = new Date(d);
    if (!isNaN(p.getTime())) return p;
    const iso = d.replace(' ', 'T');
    const pIso = new Date(iso);
    return isNaN(pIso.getTime()) ? null : pIso;
  };
  const deadlineDt = parseDate(tournament.registrationDeadline);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 shadow-2xl p-8 md:p-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 dark:bg-xq-gold/5 blur-[100px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 dark:bg-xq-accent/5 blur-[100px] -ml-32 -mb-32" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link to="/tournaments" className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 hover:text-indigo-600 dark:hover:text-xq-gold transition-colors">
                {t('tournaments.backToList')}
              </Link>
              <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                tournament.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                tournament.status === 'registration' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
              }`}>
                {t(`tournaments.status.${tournament.status}`)}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-4">
              {tournament.name}
            </h1>
            <RichContentRenderer 
              content={tournament.description || t('tournaments.noDescriptionDetail')}
              className="text-slate-600 dark:text-white/60 text-base leading-relaxed max-w-2xl"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {tournament.timeControl && (
              <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-xq-gold text-sm">⏱️</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">{tcLabels[tournament.timeControl]}</span>
              </div>
            )}
            {tournament.format && (
              <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-xq-gold text-sm">🏆</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">{fmtLabels[tournament.format]}</span>
              </div>
            )}
            {tournament.currentRound && (
              <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-xq-gold text-sm">⚔️</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">{t('tournaments.currentRound', { current: tournament.currentRound, total: tournament.maxRounds ? `/${tournament.maxRounds}` : '' })}</span>
              </div>
            )}
            {tournament.maxPlayers && (
              <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-xq-gold text-sm">👥</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white/80">{t('tournaments.playersCount', { current: tournament.players.length, total: tournament.maxPlayers })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-80 shrink-0 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-inner">
            <div className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-4">{t('tournaments.registrationInfo')}</div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-xq-gold/10 flex items-center justify-center text-xl">📅</div>
                <div>
                  <div className="text-xs font-black uppercase text-slate-400 dark:text-white/30">{t('tournaments.start')}</div>
                  <div className="text-xs font-black text-slate-800 dark:text-white/90">
                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : '---'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${deadlinePassed ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>⏰</div>
                <div>
                  <div className="text-xs font-black uppercase text-slate-400 dark:text-white/30">{t('tournaments.deadline')}</div>
                  <div className={`text-xs font-black ${deadlinePassed ? 'text-red-500' : 'text-orange-500'}`}>
                    {tournament.status === 'registration' && !deadlinePassed ? countdown : (deadlineDt ? deadlineDt.toLocaleString() : t('tournaments.closed'))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {!isAdmin && authState.user && tournament.status === 'registration' && !myAlreadyJoined && !myPending && !deadlinePassed && (
                <button onClick={onJoin} disabled={joining}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-xq-gold dark:hover:bg-yellow-500 dark:text-black text-white py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-indigo-600/20 dark:shadow-xq-gold/20 disabled:opacity-50">
                  {joining ? t('tournaments.joining') : t('tournaments.joinAction')}
                </button>
              )}
              {myAlreadyJoined && (
                <div className="w-full py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-center font-black text-xs uppercase tracking-widest">
                  {t('tournaments.joined')}
                </div>
              )}
              {myPending && (
                <div className="w-full py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-center font-black text-xs uppercase tracking-widest">
                  {t('tournaments.pendingApproval')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

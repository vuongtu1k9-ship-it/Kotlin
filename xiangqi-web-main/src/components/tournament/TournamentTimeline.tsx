import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MiniBoard } from '../MiniBoard';
import { EnrichedMatch } from '../../hooks/useTournamentDetail';
import { makeSlug } from '../../utils/slug';

interface TournamentTimelineProps {
  roundGroups: Record<number, EnrichedMatch[]>;
  isAdmin: boolean;
  authState: any;
  tournament: any;
}

export const TournamentTimeline: React.FC<TournamentTimelineProps> = ({
  roundGroups,
  isAdmin,
  authState,
  tournament
}) => {
  const { t } = useTranslation();
  const getPlayerName = (uid: string | undefined | null, fallback?: string) => {
    if (!uid) return fallback || '---';
    const p = tournament.standings?.find((s: any) => s.uid === uid || s.id === uid);
    if (p?.name) return p.name;
    return fallback || (uid.length > 20 ? uid.slice(0, 8) : uid);
  };

  return (
    <div>
      {Object.keys(roundGroups).length === 0 ? (
        <div className="text-center py-16 text-slate-600 dark:text-white/40 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
          {isAdmin ? t('tournaments.timeline.emptyAdmin') : t('tournaments.timeline.emptyUser')}
        </div>
      ) : (
        Object.entries(roundGroups).sort(([a], [b]) => Number(b) - Number(a)).map(([round, roundMatches]) => (
          <div key={round} className="mb-6">
            <h3 className="text-sm font-black text-xq-gold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-xq-gold/20"></span>
              {t('tournaments.timeline.roundLabel', { round })}
              <span className="h-px flex-1 bg-xq-gold/20"></span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundMatches.map(m => {
                const done = m.state?.isGameOver || m.state?.finished;
                const winner = m.state?.winner;
                
                const getUid = (side: 'red' | 'black') => {
                  const s = m.state?.players?.[side];
                  if (typeof s === 'string') return s;
                  if (s && typeof s === 'object' && 'uid' in s) return (s as any).uid;
                  if (m.playerUids?.[side]) return m.playerUids[side];
                  return undefined;
                };

                const redUid = getUid('red');
                const blackUid = getUid('black');
                const redName = getPlayerName(redUid, m.redName || t('tournaments.timeline.sides.red'));
                const blackName = getPlayerName(blackUid, m.blackName || t('tournaments.timeline.sides.black'));

                const gameSlug = makeSlug(m.redName || redName + '-vs-' + (m.blackName || blackName), m._id);

                return (
                  <div key={m._id} className="relative group bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-5 hover:border-indigo-600/30 dark:hover:border-xq-gold/30 transition-all duration-300 shadow-lg shadow-black/[0.02] flex flex-col gap-5">
                    <div className="w-full aspect-[9/10] group-hover:scale-[1.02] transition-transform duration-500">
                      <MiniBoard board={m.state?.board} />
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${done ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/20' : 'bg-indigo-600/10 text-indigo-600 dark:bg-xq-gold/10 dark:text-xq-gold animate-pulse'}`}>
                          {done ? t('common.finished') : t('tournaments.timeline.status.active')}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className={`text-sm font-black truncate ${winner === 'red' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/40'}`}>
                              {redName}
                            </span>
                          </div>
                          {winner === 'red' && <div className="text-indigo-600 dark:text-xq-gold text-lg">🏆</div>}
                        </div>

                        <div className="flex items-center gap-2 px-1">
                          <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
                          <span className="text-xs font-black text-slate-300 dark:text-white/10 uppercase italic">vs</span>
                          <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-400 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            <span className={`text-sm font-black truncate ${winner === 'black' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/40'}`}>
                              {blackName}
                            </span>
                          </div>
                          {winner === 'black' && <div className="text-indigo-600 dark:text-xq-gold text-lg">🏆</div>}
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        {done ? (
                          <Link to={`/game/${gameSlug}`} className="flex-1 h-9 flex items-center justify-center text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-xq-gold bg-indigo-600/5 dark:bg-xq-gold/5 border border-indigo-600/10 dark:border-xq-gold/10 rounded-xl hover:bg-indigo-600 dark:hover:bg-xq-gold hover:text-white dark:hover:text-black transition-all">
                            {t('tournaments.timeline.actions.review')}
                          </Link>
                        ) : (
                          <Link to={`/game/${gameSlug}`} className="flex-1 h-9 flex items-center justify-center text-xs font-black uppercase tracking-widest text-white dark:text-black bg-indigo-600 dark:bg-xq-gold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-600/10 dark:shadow-xq-gold/10">
                            {authState.user && (redUid === authState.user.uid || blackUid === authState.user.uid) ? t('tournaments.timeline.actions.play') : t('tournaments.timeline.actions.watch')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

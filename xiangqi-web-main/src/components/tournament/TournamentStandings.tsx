import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { makeSlug } from '../../utils/slug';

interface TournamentStandingsProps {
  standings: any[];
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export const TournamentStandings: React.FC<TournamentStandingsProps> = ({ standings }) => {
  const { t } = useTranslation();
  if (standings.length === 0) {
    return (
      <div className="text-center py-16 text-slate-600 dark:text-white/40 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
        {t('tournaments.standings.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...standings].sort((a, b) => b.points - a.points || b.wins - a.wins).map((s, i) => (
        <div key={s.uid} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : i === 1 ? 'bg-black/8 dark:bg-white/8 border-white/15' : i === 2 ? 'bg-orange-700/10 border-orange-700/30' : 'bg-slate-100 dark:bg-white/5 border-black/10 dark:border-white/10'}`}>
          <div className="w-10 text-center text-2xl flex-shrink-0">{RANK_MEDALS[i] || `#${i+1}`}</div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-xq-gold/30 to-xq-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {s.picture ? <img src={s.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-slate-800 dark:text-white/80 font-bold text-sm">{String(s.name || '?').charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/player/${makeSlug(s.name || '', s.uid)}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-400 transition-colors truncate block">
              {s.name || s.uid}
            </Link>
            <div className="text-xs text-slate-600 dark:text-white/40">ELO {s.elo || 1200}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-xq-gold">{s.points}</div>
            <div className="text-xs text-slate-600 dark:text-white/40 font-mono">
              {s.wins}{t('tournaments.standings.stats.win')} · {s.draws}{t('tournaments.standings.stats.draw')} · {s.losses}{t('tournaments.standings.stats.loss')}
              {s.byes ? ` · ${s.byes}${t('tournaments.standings.stats.bye')}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

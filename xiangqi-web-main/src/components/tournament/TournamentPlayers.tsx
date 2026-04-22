import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { makeSlug } from '../../utils/slug';

interface TournamentPlayersProps {
  tournament: any;
  isAdmin: boolean;
  onApprove: (uid: string) => void;
  onReject: (uid: string) => void;
}

export const TournamentPlayers: React.FC<TournamentPlayersProps> = ({
  tournament,
  isAdmin,
  onApprove,
  onReject
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {isAdmin && tournament.pendingPlayers && tournament.pendingPlayers.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
          <h4 className="text-orange-300 font-bold text-sm mb-3">{t('tournaments.players.pendingTitle', { count: tournament.pendingPlayers.length })}</h4>
          <div className="space-y-2">
            {tournament.pendingPlayers.map((uid: string) => (
              <div key={uid} className="flex items-center justify-between bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-2">
                <span className="text-sm text-slate-800 dark:text-white/70 font-mono">{uid}</span>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(uid)} className="text-green-400 hover:text-green-300 text-xs font-bold border border-green-500/30 px-3 py-1 rounded-lg">✅ {t('tournaments.players.approve')}</button>
                  <button onClick={() => onReject(uid)} className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-500/30 px-3 py-1 rounded-lg">✕ {t('common.reject')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4">
        <h4 className="text-slate-600 dark:text-white/60 font-bold text-sm mb-3">{t('tournaments.players.registeredTitle', { count: tournament.players.length })}{tournament.maxPlayers ? `/${tournament.maxPlayers}` : ''}</h4>
        {tournament.players.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-white/30 text-sm">{t('tournaments.players.empty')}</div>
        ) : (
          <div className="space-y-2">
            {tournament.standings.length > 0
              ? tournament.standings.map((s: any, i: number) => (
                <div key={s.uid} className="flex items-center gap-3 py-2 border-b border-black/5 dark:border-white/5 last:border-0">
                  <span className="text-sm text-slate-400 dark:text-white/30 w-6 text-center">#{i+1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                    {s.picture ? <img src={s.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-xs text-slate-600 dark:text-white/60">{String(s.name || '?').charAt(0)}</span>}
                  </div>
                  <Link to={`/player/${makeSlug(s.name || '', s.uid)}`} className="text-slate-800 dark:text-white/80 hover:text-blue-400 transition-colors font-medium text-sm flex-1 truncate">
                    {s.name || s.uid}
                  </Link>
                  <span className="text-slate-400 dark:text-white/30 text-xs font-mono">ELO {s.elo || 1200}</span>
                </div>
              ))
              : tournament.players.map((uid: string, i: number) => (
                <div key={uid} className="flex items-center gap-3 py-2 border-b border-black/5 dark:border-white/5 last:border-0">
                  <span className="text-sm text-slate-400 dark:text-white/30 w-6 text-center">#{i+1}</span>
                  <Link to={`/player/${makeSlug('', uid)}`} className="text-slate-600 dark:text-white/60 hover:text-blue-400 transition-colors text-sm font-mono flex-1 truncate">
                    {uid}
                  </Link>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

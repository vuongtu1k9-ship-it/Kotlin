import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserPresenceBundle } from '../UserPresenceBundle';
import { type PlayerInfo } from '../../hooks/useOnlinePlayers';

interface OpponentSearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedOpponentUid: string | null;
  setSelectedOpponentUid: (uid: string | null) => void;
  isSearching: boolean;
  quickPickPlayers: PlayerInfo[];
  filteredPlayers: PlayerInfo[];
  activeOpponent: PlayerInfo | null;
}

export const OpponentSearch: React.FC<OpponentSearchProps> = ({
  searchQuery, setSearchQuery, selectedOpponentUid, setSelectedOpponentUid,
  isSearching, quickPickPlayers, filteredPlayers, activeOpponent
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">
        {t('match.config.findOpponent')} {selectedOpponentUid && ` - ${t('match.config.selected')}`}
      </label>
      
      {!selectedOpponentUid ? (
        <div className="space-y-4">
          <div className="relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('match.config.searchPlaceholder')}
              className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-xq-gold/50 transition-all placeholder:text-slate-400 dark:text-white/20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-xq-gold transition-colors">
              {isSearching ? <div className="w-4 h-4 border-2 border-xq-gold border-t-transparent rounded-full animate-spin" /> : '🔍'}
            </div>
          </div>

          {quickPickPlayers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                 <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">{t('match.config.online')}</span>
                 <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar scrollbar-hide">
                {quickPickPlayers.map(p => (
                  <button
                    key={p.uid}
                    type="button"
                    onClick={() => setSelectedOpponentUid(p.uid)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group/p"
                  >
                    <div className="relative">
                      <img 
                        src={p.picture || `/api/avatars/${p.uid}.webp`} 
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 group-hover/p:border-xq-gold/50 transition-all"
                        alt={p.name}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 dark:text-white/40 group-hover/p:text-slate-900 dark:text-white truncate max-w-[40px] uppercase">
                      {p.name || '...'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery && (
            <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-200 dark:bg-black/20 border border-black/5 dark:border-white/5 custom-scrollbar">
              {filteredPlayers.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-slate-400 dark:text-white/20 italic">{t('match.config.noResults')}</div>
              ) : (
                filteredPlayers.map(p => (
                  <button
                    key={p.uid}
                    type="button"
                    onClick={() => setSelectedOpponentUid(p.uid)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:bg-white/5 border-b border-white/[0.02] last:border-0 transition-colors"
                  >
                    <UserPresenceBundle player={p} size="sm" />
                    <span className="text-[10px] font-black text-xq-gold/60 uppercase group-hover:text-xq-gold">{t('match.config.select')}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-xq-gold/5 border border-xq-gold/20">
          {activeOpponent && <UserPresenceBundle player={activeOpponent} size="sm" />}
          <button 
            type="button"
            onClick={() => setSelectedOpponentUid(null)}
            className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase underline decoration-2 cursor-pointer"
          >
            {t('match.config.unselect')}
          </button>
        </div>
      )}
    </div>
  );
};

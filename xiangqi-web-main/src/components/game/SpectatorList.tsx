import React from 'react';
import { useTranslation } from 'react-i18next';

interface SpectatorListProps {
  spectators: any[];
}

export const SpectatorList: React.FC<SpectatorListProps> = ({ spectators }) => {
  const { t } = useTranslation();
  return (
    <div className="pt-4 border-t border-black/10 dark:border-white/10">
       <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-black text-slate-500 dark:text-white/70 uppercase tracking-[0.2em]">{t('game.spectators.title', { count: spectators.length })}</div>
          {spectators.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse"></span>}
       </div>
       <div className="flex -space-x-2 overflow-hidden py-1">
          {spectators.length === 0 ? (
            <div className="text-xs text-slate-400/50 italic py-1">{t('game.spectators.empty')}</div>
          ) : (
            <>
              {spectators.slice(0, 8).map((sp, idx) => (
                <img
                  key={idx}
                  src={sp.picture || `/api/avatars/${sp.uid}.webp`}
                  className="h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                  title={sp.name}
                  alt={t('game.spectators.alt', { name: sp.name })}
                />
              ))}
              {spectators.length > 8 && (
                <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-900 text-slate-600 dark:text-white/40">
                  +{spectators.length - 8}
                </div>
              )}
            </>
          )}
       </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';

interface ActiveGameBannerProps {
  activeRoomId: string;
  onJoin: (id: string) => void;
}

export const ActiveGameBanner: React.FC<ActiveGameBannerProps> = ({ activeRoomId, onJoin }) => {
  const { t } = useTranslation();
  return (
    <div className="relative group overflow-hidden rounded-[32px] p-[1px] bg-gradient-to-r from-amber-600/50 dark:from-xq-gold/50 via-blue-600/50 dark:via-blue-500/50 to-amber-600/50 dark:to-xq-gold/50 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-[31px] bg-[#0f172a] backdrop-blur-xl border border-black/5 dark:border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/5 dark:from-xq-gold/5 via-blue-600/5 dark:via-blue-500/5 opacity-50" />

        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 dark:bg-xq-gold/20 flex items-center justify-center text-2xl shadow-inner border border-amber-600/20 dark:border-xq-gold/20">
              ⚔️
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight uppercase tracking-tighter font-heading">
              {t('lobby.activeGameTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-white/70 font-bold uppercase tracking-[0.2em] mt-1">
              {t('lobby.activeGameSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative w-full sm:w-auto">
          <Button
            onClick={() => onJoin(activeRoomId)}
            variant="primary"
            className="flex-1 sm:flex-none px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 dark:shadow-[0_10px_20px_rgba(212,175,55,0.2)] hover:shadow-amber-600/40 dark:hover:shadow-xq-gold/40 transition-all hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-xq-gold dark:to-yellow-400 text-white dark:text-slate-900 border-none"
          >
            🚀 {t('lobby.returnToGame')}
          </Button>
        </div>
      </div>
    </div>
  );
};

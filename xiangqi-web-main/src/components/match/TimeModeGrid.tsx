import React from 'react';
import { useTranslation } from 'react-i18next';

const TIME_MODES = [
  { val: 'blitz', icon: '⚡' },
  { val: 'rapid', icon: '🏃' },
  { val: 'standard', icon: '⏱' },
  { val: 'slow', icon: '🎯' },
];

interface TimeModeGridProps {
  timeMode: string;
  setTimeMode: (val: string) => void;
}

export const TimeModeGrid: React.FC<TimeModeGridProps> = ({ timeMode, setTimeMode }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">{t('game.timeModes.gridLabel')}</label>
      <div className="grid grid-cols-2 gap-2">
        {TIME_MODES.map(m => (
          <button
            key={m.val}
            type="button"
            onClick={() => setTimeMode(m.val)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              timeMode === m.val
                ? 'bg-xq-gold/10 border-xq-gold/40 text-xq-gold shadow-lg shadow-xq-gold/5'
                : 'bg-white/[0.03] border-black/5 dark:border-white/5 text-slate-600 dark:text-white/40 hover:bg-white/[0.06]'
            }`}
          >
            <span className="text-xl">{m.icon}</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-black uppercase">{t(`game.timeModes.${m.val}`)}</span>
              <span className="text-[9px] font-bold opacity-40 mt-1">{t(`game.timeModeSub.${m.val}`)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

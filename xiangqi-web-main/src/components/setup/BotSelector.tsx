import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveBot } from '../../hooks/useActiveBots';
import { getEloRank } from '../../utils/eloRanks';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const PERSONALITY_ICON: Record<string, string> = {
  aggressive: '⚔️',
  defensive:  '🛡️',
  balanced:   '⚖️',
};

interface BotSelectorProps {
  bots: ActiveBot[];
  loading: boolean;
  selectedBotId: string | null;
  onSelect: (uid: string) => void;
  /** Optional height constraint */
  maxHeight?: string;
  onlineCount?: number;
}

export const BotSelector: React.FC<BotSelectorProps> = ({
  bots,
  loading,
  selectedBotId,
  onSelect,
  maxHeight = '420px',
  onlineCount,
}) => {
  const { t } = useTranslation();
  const settings = useSiteSettings();

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse px-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-24 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="h-2 w-16 bg-slate-200 dark:bg-white/10 rounded opacity-50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!bots.length) {
    return (
      <div className="py-8 text-center bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
        <p className="text-xs text-slate-400 font-bold italic">
          {t('ai.bot.error_not_found')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Headcount Header */}
      <div className="flex items-center justify-end px-1 mb-1">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 opacity-60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Live</span>
        </div>
      </div>

      {/* Vertical Scroll List */}
      <div 
        className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar"
        style={{ maxHeight }}
      >
        {bots.map(bot => {
          const isSelected = bot.uid === selectedBotId;
          const personality = bot.personality || 'balanced';
          const icon = PERSONALITY_ICON[personality] ?? '🤖';
          const rank = getEloRank(bot.elo || 1200, settings['elo.ranks']);

          return (
            <button
              key={bot.uid}
              onClick={() => onSelect(bot.uid)}
              className={`
                relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group
                border-2
                ${isSelected 
                  ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                  : 'bg-white/40 dark:bg-white/5 border-transparent hover:border-black/5 dark:hover:border-white/10 hover:bg-white/60 dark:hover:bg-white/[0.08]'}
              `}
            >
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <div className={`
                    w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300
                    ${isSelected ? 'border-indigo-500' : 'border-black/10 dark:border-white/10 group-hover:border-white/20'}
                `}>
                  <img 
                    src={bot.avatar || `/api/avatars/${bot.uid}.webp`} 
                    alt={bot.name} 
                    className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'grayscale-0' : 'grayscale-[0.5] group-hover:grayscale-0'}`} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center text-2xl bg-slate-800">{icon}</div>
                </div>
                
                {/* Online indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xl ${
                  bot.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-[13px] font-bold truncate transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white/90'}`}>
                    {bot.name}
                  </span>
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">
                    {bot.elo || 1200} Elo
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-2 mt-1">
                   {/* Rank Badge */}
                   <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/5">
                      <span className="text-[9px] opacity-90">{rank.icon}</span>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500 dark:text-white/50">
                        {t(rank.title)}
                      </span>
                   </div>
                   {/* Elo Value */}
                   <span className="text-[10px] font-black tracking-tighter text-amber-600 dark:text-amber-400">
                     {bot.elo || 1200}
                   </span>
                   {/* Personality Icon */}
                   <span className="text-[10px] opacity-40 ml-auto group-hover:opacity-100 transition-opacity">
                      {icon}
                   </span>
                </div>
              </div>

              {/* Status/Arrow Indicator */}
              <div className={`shrink-0 transition-all duration-300 ${isSelected ? 'text-indigo-500 opacity-100' : 'opacity-0 group-hover:opacity-40 dark:text-white'}`}>
                <span className="text-lg">→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

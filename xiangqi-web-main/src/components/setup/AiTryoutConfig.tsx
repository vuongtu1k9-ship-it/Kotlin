import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieceSide } from '../../types';
import { apiGet } from '../../api';
import { BotSelector } from './BotSelector';

interface AiTryoutConfigProps {
  setAiEngine: (v: 'web' | 'pikafish') => void;
  aiBotId?: string | null;
  setAiBotId?: (v: string | null) => void;
  aiLevel: number;
  setAiLevel: (v: number) => void;
  aiEnabledInTryout: boolean;
  setAiEnabledInTryout: (v: boolean) => void;
  playSide: PieceSide;
  setPlaySide: (v: PieceSide) => void;
  onBack: () => void;
  backLabel?: string;
  onBotSelected?: (bot: any) => void;
  hideBotSelector?: boolean;
}

export const AiTryoutConfig: React.FC<AiTryoutConfigProps> = ({
  setAiEngine, aiBotId, setAiBotId, aiLevel, setAiLevel,
  aiEnabledInTryout, setAiEnabledInTryout,
  playSide, setPlaySide, onBack,
  backLabel, onBotSelected, hideBotSelector
}) => {
  const { t } = useTranslation();
  const actualBackLabel = backLabel || t('setup.tryout.backLabel');

  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiGet('/bots/active').then(res => {
      if (!mounted) return;
      if (res?.ok && res.bots) {
        setBots(res.bots);
        // Auto-select middle-level bot if none selected
        if (!aiBotId && res.bots.length > 0) {
          const mid = res.bots[Math.floor(res.bots.length / 2)];
          if (setAiBotId) setAiBotId(mid.uid || mid._id);
          setAiLevel(mid.level || 4);
          if (onBotSelected) onBotSelected(mid);
        }
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode: AI vs Manual */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ai-toggle-select" className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-1">
          {t('setup.tryout.modeLabel')}
        </label>
        <select
          id="ai-toggle-select"
          className="w-full h-10 px-3 text-[11px] font-bold border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          value={aiEnabledInTryout ? 'ai' : 'manual'}
          onChange={e => setAiEnabledInTryout(e.target.value === 'ai')}
        >
          <option value="ai" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('setup.tryout.modeAi')}</option>
          <option value="manual" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('setup.tryout.modeManual')}</option>
        </select>
      </div>

      {/* Custom Bot Select — Now right below Mode */}
      <div className={`flex flex-col gap-1.5 transition-all duration-300 ${!aiEnabledInTryout ? 'opacity-40 grayscale-[0.5]' : 'animate-in fade-in slide-in-from-top-1 duration-300'}`}>
        <label htmlFor="bot-select" className="text-[9px] font-black uppercase tracking-widest text-xq-gold ml-1">
          {t('setup.tryout.selectBot')}
        </label>
        <div className="relative group">
          <select
            id="bot-select"
            disabled={!aiEnabledInTryout}
            className={`w-full h-11 px-4 pr-10 text-[11px] font-black border rounded-xl focus:outline-none bg-xq-gold/5 shadow-sm transition-all appearance-none uppercase tracking-tight ${
              !aiEnabledInTryout 
                ? 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20 cursor-not-allowed' 
                : 'border-xq-gold/20 focus:border-xq-gold/50 text-slate-900 dark:text-white hover:bg-xq-gold/10 cursor-pointer'
            }`}
            value={aiBotId || ''}
            onChange={e => {
              const uid = e.target.value;
              const b = bots.find(x => (x.uid || x._id) === uid);
              if (!b) return;
              if (setAiBotId) setAiBotId(uid);
              setAiLevel(b.level || 4);
              setAiEngine('pikafish');
              if (onBotSelected) onBotSelected(b);
            }}
          >
            {loading ? (
              <option>{t('common.loading')}</option>
            ) : (
              bots.map(b => (
                <option key={b.uid || b._id} value={b.uid || b._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-2">
                  {b.name} — {b.elo} Elo
                </option>
              ))
            )}
          </select>
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors text-[10px] ${!aiEnabledInTryout ? 'text-slate-300 dark:text-white/10' : 'text-xq-gold/40 group-hover:text-xq-gold'}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Side select */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-1">
          {aiEnabledInTryout ? t('setup.tryout.sideLabel') : t('setup.tryout.viewLabel')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPlaySide('red')}
            className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${playSide === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20'}`}
          >
            {t('setup.tryout.sideRed')}
          </button>
          <button
            onClick={() => setPlaySide('black')}
            className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${playSide === 'black' ? 'bg-slate-500/10 border-slate-500/30 text-slate-300 shadow-[0_0_15px_rgba(100,116,139,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20'}`}
          >
            {t('setup.tryout.sideBlack')}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-black/5 dark:border-white/5">
        <button
          onClick={onBack}
          className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-black uppercase text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>⬅️</span> {actualBackLabel}
        </button>
      </div>
    </div>
  );
};

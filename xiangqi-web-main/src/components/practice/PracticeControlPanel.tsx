import React from 'react';
import { useTranslation } from 'react-i18next';
import { MoveList } from '../MoveList';
import { ExportButtons } from '../ExportButtons';
import { BotSelector } from '../setup/BotSelector';
import type { ActiveBot } from '../../hooks/useActiveBots';

interface PracticeControlPanelProps {
  aiEnabled: boolean;
  setAiEnabled: (val: boolean) => void;
  bots: ActiveBot[];
  botsLoading: boolean;
  selectedBotId: string | null;
  onSelectBot: (uid: string) => void;
  humanSide: 'red' | 'black';
  setHumanSide: (val: 'red' | 'black') => void;
  compactSettings?: boolean;
}

export const PracticeControlPanel: React.FC<PracticeControlPanelProps> = ({
  aiEnabled,
  setAiEnabled,
  bots,
  botsLoading,
  selectedBotId,
  onSelectBot,
  humanSide,
  setHumanSide,
  compactSettings = false
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col w-full space-y-6`}>
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/30 backdrop-blur-md p-6 shadow-sm dark:shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400/60">{t('practice.panel.aiTrain')}</span>
            {!compactSettings && <span className="text-xs font-bold text-slate-600 dark:text-white/40">{t('practice.panel.aiTrainDesc')}</span>}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={aiEnabled} 
              onChange={(e) => setAiEnabled(e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">{t('setup.tryout.selectBot')}</span>
            <BotSelector
              bots={bots}
              loading={botsLoading}
              selectedBotId={selectedBotId}
              onSelect={onSelectBot}
              compact
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-2 block">{t('practice.panel.humanSide')}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setHumanSide('red')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all border ${
                humanSide === 'red' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 shadow-sm'
              }`}
            >
              {t('practice.panel.redSide')}
            </button>
            <button 
              onClick={() => setHumanSide('black')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all border ${
                humanSide === 'black' ? 'bg-slate-800 dark:bg-black/20 border-slate-700 dark:border-white text-white dark:text-black shadow-lg shadow-black/20' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 shadow-sm'
              }`}
            >
              {t('practice.panel.blackSide')}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{t('practice.panel.guide.title')}</h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-4"> <div className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 text-xs text-slate-600 dark:text-white/40 font-black">1</div> <p className="text-sm text-slate-600 dark:text-white/60 font-bold">{t('practice.panel.guide.step1')}</p> </div>
          <div className="flex items-center gap-4"> <div className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 text-xs text-slate-600 dark:text-white/40 font-black">2</div> <p className="text-sm text-slate-600 dark:text-white/60 font-bold">{t('practice.panel.guide.step2')}</p> </div>
          <div className="flex items-center gap-4"> <div className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 text-xs text-slate-600 dark:text-white/40 font-black">3</div> <p className="text-sm text-slate-600 dark:text-white/60 font-bold">{t('practice.panel.guide.step3')}</p> </div>
        </div>
      </div>
    </div>
  );
};

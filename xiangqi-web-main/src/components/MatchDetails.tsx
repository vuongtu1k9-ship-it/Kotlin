import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Move } from '../types';
import { getMaterialBalance, getHalfMoveClock } from '../utils/boardUtils';

interface MatchDetailsProps {
  roomSummary: any;
  board: (any | null)[][];
  moveHistory: Move[];
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({
  roomSummary, board, moveHistory
}) => {
  const { t } = useTranslation();
  const finished = roomSummary?.finished;
  
  const balance = getMaterialBalance(board);
  const halfMoveClock = getHalfMoveClock(moveHistory);

  return (
    <div className="mx-4 mb-4 p-5 rounded-[24px] bg-white/[0.03] border border-white/5 space-y-6">


      {/* Material & Progress */}
      {!finished && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{t('game.panel.details.materialAdvantage')}</div>
            <div className={`text-[10px] font-mono font-black ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-slate-400' : 'text-white/40'}`}>
              {balance > 0 
                ? t('game.panel.details.redAdvantage', { count: balance }) 
                : balance < 0 
                ? t('game.panel.details.blackAdvantage', { count: -balance }) 
                : t('game.panel.details.balanced')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{t('game.panel.details.drawProgress')}</div>
            <div className={`text-[10px] font-mono font-black ${halfMoveClock >= 40 ? 'text-orange-400' : 'text-white/40'}`}>
              {halfMoveClock}/60
            </div>
          </div>
        </div>
      )}

      {/* Rules Section */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t('game.panel.details.drawRules')}</div>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-1" />
            <div className="text-[10px] leading-relaxed">
              <span className="font-black text-white/70">{t('game.panel.details.rule60Label')}</span>
              <span className="text-white/40 ml-1">{t('game.panel.details.rule60')}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40 mt-1" />
            <div className="text-[10px] leading-relaxed">
              <span className="font-black text-white/70">{t('game.panel.details.ruleRepeatLabel')}</span>
              <span className="text-white/40 ml-1">{t('game.panel.details.ruleRepeat')}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 mt-1" />
            <div className="text-[10px] leading-relaxed">
              <span className="font-black text-white/70">{t('game.panel.details.ruleTimeoutLabel')}</span>
              <span className="text-white/40 ml-1">{t('game.panel.details.ruleTimeout')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

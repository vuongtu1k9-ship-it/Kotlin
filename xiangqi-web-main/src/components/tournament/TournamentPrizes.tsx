import React from 'react';
import { useTranslation } from 'react-i18next';

interface TournamentPrizesProps {
  tournament: any;
  shopGifts: Record<string, any>;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export const TournamentPrizes: React.FC<TournamentPrizesProps> = ({ tournament, shopGifts }) => {
  const { t } = useTranslation();
  if (!tournament.prizes || tournament.prizes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-center py-4 text-slate-600 dark:text-white/40 text-sm">{t('tournaments.prizes.title')}</div>
      {tournament.prizes.map((prize: any, i: number) => {
        return (
          <div key={prize.rank} className={`flex items-center gap-5 px-6 py-5 rounded-2xl border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : i === 1 ? 'bg-gray-400/10 border-gray-400/30' : i === 2 ? 'bg-orange-700/10 border-orange-700/30' : 'bg-slate-100 dark:bg-white/5 border-black/10 dark:border-white/10'}`}>
            <div className="text-4xl">{RANK_MEDALS[i] || `#${i+1}`}</div>
            <div className="flex-1">
              <div className={`font-black text-lg ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-slate-900 dark:text-white'}`}>{prize.title}</div>
              {prize.description && <div className="text-slate-600 dark:text-white/50 text-sm mt-0.5">{prize.description}</div>}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {prize.coins ? (
                  <span className="bg-xq-gold/20 text-xq-gold px-2 py-0.5 rounded text-xs font-black italic border border-xq-gold/30">
                    🪙 +{prize.coins} {t('tournaments.prizes.goldUnit')}
                  </span>
                ) : null}
                {prize.items?.map((it: any, idx: number) => {
                  const itemData = shopGifts[it.id] || { name: it.id, icon: '🎁' };
                  return (
                    <span key={idx} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs font-black italic border border-purple-500/30">
                      {itemData.icon} +{it.quantity} {itemData.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

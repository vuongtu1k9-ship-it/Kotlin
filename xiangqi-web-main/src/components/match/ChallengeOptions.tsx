import React from 'react';
import { useTranslation } from 'react-i18next';

interface ChallengeOptionsProps {
  expanded: boolean;
  setExpanded: (e: boolean) => void;
  message: string;
  setMessage: (m: string) => void;
  betType: 'none' | 'gifts';
  setBetType: (t: 'none' | 'gifts') => void;
  betGiftType: 'ring' | 'bear' | 'candy';
  setBetGiftType: (t: 'ring' | 'bear' | 'candy') => void;
}

export const ChallengeOptions: React.FC<ChallengeOptionsProps> = ({
  expanded, setExpanded, message, setMessage, betType, setBetType, betGiftType, setBetGiftType
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
       <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 hover:text-slate-600 dark:text-white/40 transition-colors px-1"
      >
        {t('match.config.challengeOptions')}
        <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {expanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase px-1">{t('match.config.message')}</span>
            <input 
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('match.config.defaultMessage')}
              className="w-full h-10 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-xq-gold/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase px-1">{t('match.config.betGifts')}</span>
              <button
                type="button"
                onClick={() => setBetType(betType === 'none' ? 'gifts' : 'none')}
                className={`w-full h-10 rounded-xl border text-[10px] font-black uppercase transition-all ${
                  betType === 'gifts' ? 'bg-pink-500/10 border-pink-400/40 text-pink-400 shadow-lg shadow-pink-500/5' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20 hover:bg-slate-200 dark:bg-white/10'
                }`}
              >
                 🎁 {betType === 'gifts' ? t('match.config.betActive') : t('match.config.betNone')}
              </button>
            </div>

            {betType === 'gifts' && (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase px-1">{t('match.config.giftType')}</span>
                <select 
                  value={betGiftType}
                  onChange={e => setBetGiftType(e.target.value as any)}
                  className="w-full h-10 bg-slate-100 dark:bg-black border border-pink-500/20 rounded-xl px-2 text-[10px] text-pink-600 dark:text-pink-200 outline-none focus:border-pink-500/50"
                >
                  <option value="candy">🍬 {t('match.config.gifts.candy')}</option>
                  <option value="bear">🧸 {t('match.config.gifts.bear')}</option>
                  <option value="ring">💍 {t('match.config.gifts.ring')}</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

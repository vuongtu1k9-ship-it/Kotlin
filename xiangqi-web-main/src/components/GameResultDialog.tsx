import { Dialog } from './ui/Dialog';
import { PieceSide } from '../types';
import { useTranslation } from 'react-i18next';

interface GameResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  winner: PieceSide | null;
  endedBy: string | null;
  mySide: PieceSide | null;
  onShare?: () => void;
  scoreChange?: { gain: number; coins: number; next: number } | null;
}

export function GameResultDialog({ isOpen, onClose, winner, endedBy, mySide, onShare, scoreChange }: GameResultDialogProps) {
  const { t } = useTranslation();
  const isDraw = winner === null;
  const isWin = winner === mySide && mySide !== null;
  const isLoss = winner !== mySide && mySide !== null && winner !== null;

  const title = isDraw ? t('game.result.draw') : isWin ? t('game.result.win') : isLoss ? t('game.result.loss') : t('game.result.finished');
  const variant = isWin ? 'success' : isLoss ? 'danger' : 'info';

  const getReasonText = () => {
    return t([`game.panel.reasons.${endedBy}`, 'game.panel.reasons.default']);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="text-center w-full">
          <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-2">{getReasonText()}</p>
          
          {scoreChange && (
             <div className="flex flex-col gap-4 mt-2 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between gap-8">
                   <div className="text-left">
                      <div className="text-[9px] font-black uppercase text-slate-400 dark:text-white/30 tracking-widest">{t('game.result.elo')}</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                         {scoreChange.next - scoreChange.gain} 
                         <span className={scoreChange.gain >= 0 ? "text-emerald-500 text-sm" : "text-red-500 text-sm"}>
                           {scoreChange.gain >= 0 ? '+' : ''}{scoreChange.gain}
                         </span>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[9px] font-black uppercase text-slate-400 dark:text-white/30 tracking-widest">{t('game.result.reward')}</div>
                      <div className="text-lg font-black text-xq-gold flex items-center justify-end gap-1.5">
                         +{scoreChange.coins} <span className="text-xs">🪙</span>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-3">
             <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {t('game.result.review')}
            </button>
            {onShare && (
              <button
                onClick={onShare}
                className="flex-1 py-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500/20"
              >
                {t('game.result.share')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

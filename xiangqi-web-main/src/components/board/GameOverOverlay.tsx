import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PieceSide } from '../../types';

interface GameOverOverlayProps {
  showResultModal: boolean;
  dismissedGameOver: boolean;
  setDismissedGameOver: (v: boolean) => void;
  winner: PieceSide | null;
  side?: PieceSide | null;
  mySide: PieceSide | null;
  endedBy: string | null;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  showResultModal,
  dismissedGameOver,
  setDismissedGameOver,
  winner,
  side,
  mySide,
  endedBy,
}) => {
  const { t } = useTranslation();
  if (!showResultModal || dismissedGameOver) return null;

  const currentViewSide = side || mySide;

  return (
    <div className="xq-game-over-overlay animate-in fade-in zoom-in duration-500">
      <button 
        onClick={() => setDismissedGameOver(true)}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        title={t('game.result.review')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="xq-game-over-content">
        <div className="xq-game-over-status">
          {winner === null ? t('game.status.draw') : (
            currentViewSide ? (
              currentViewSide === winner ? t('match.resultWin') : t('match.resultLoss')
            ) : (winner === 'red' ? t('game.status.redWin') : t('game.status.blackWin'))
          )}
        </div>
        {endedBy && (
          <div className="xq-game-over-reason">
            {t([`game.panel.reasons.${endedBy}`, 'game.panel.reasons.default'])}
          </div>
        )}
        <button 
          onClick={() => setDismissedGameOver(true)}
          className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all"
        >
          {t('game.result.review')}
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Confirm } from './ui/Dialog';
import type { PieceSide } from '../types';

interface GameModalsProps {
  swapRequest: { side: PieceSide } | null;
  drawRequest: { side: PieceSide } | null;
  handleRespondSwap: (accepted: boolean) => void;
  handleRespondDraw: (accepted: boolean) => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  swapRequest, drawRequest, handleRespondSwap, handleRespondDraw
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Confirm
        isOpen={!!swapRequest}
        title={t('game.modals.swapTitle')}
        message={t('game.modals.swapMessage')}
        onConfirm={() => handleRespondSwap(true)}
        onClose={() => handleRespondSwap(false)}
        variant="info"
        confirmLabel={t('game.modals.accept')}
        cancelLabel={t('common.reject')}
      />

      <Confirm
        isOpen={!!drawRequest}
        title={t('game.modals.drawTitle')}
        message={t('game.modals.drawMessage')}
        onConfirm={() => handleRespondDraw(true)}
        onClose={() => handleRespondDraw(false)}
        variant="info"
        confirmLabel={t('game.modals.accept')}
        cancelLabel={t('common.reject')}
      />
    </>
  );
};

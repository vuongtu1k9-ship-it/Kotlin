import React from 'react';
import { useTranslation } from 'react-i18next';

interface CheckNotifyProps {
  showCheckNotify: boolean;
  checkNotifyKey: number;
}

export const CheckNotify: React.FC<CheckNotifyProps> = ({ showCheckNotify, checkNotifyKey }) => {
  const { t } = useTranslation();
  if (!showCheckNotify) return null;

  return (
    <div className="xq-check-notify">
      <div key={checkNotifyKey} className="xq-check-text">{t('game.status.check')}</div>
    </div>
  );
};

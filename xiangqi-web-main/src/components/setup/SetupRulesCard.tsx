import React from 'react';
import { useTranslation } from 'react-i18next';
import { InfoCard } from '../ui/InfoCard';

export const SetupRulesCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <InfoCard title={t('setup.rules.title')} icon="📜">
      <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-white/70 leading-relaxed">
        <div className="space-y-2">
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.orientation.label')}</span> {t('setup.rules.orientation.desc')}</p>
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.turn.label')}</span> {t('setup.rules.turn.desc')}</p>
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.general.label')}</span> {t('setup.rules.general.desc')}</p>
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.check.label')}</span> {t('setup.rules.check.desc')}</p>
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.facing.label')}</span> {t('setup.rules.facing.desc')}</p>
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.defense.label')}</span> {t('setup.rules.defense.desc')}</p>
          <p><span className="font-bold text-slate-900 dark:text-white">{t('setup.rules.soldier.label')}</span> {t('setup.rules.soldier.desc')}</p>
        </div>
      </div>
    </InfoCard>
  );
};

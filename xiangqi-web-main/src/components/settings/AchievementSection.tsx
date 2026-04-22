import React from 'react';
import { useTranslation } from 'react-i18next';

interface AchievementSectionProps {
  tourResults: { id: string; name: string; rank: number | null; points: number }[];
}

export const AchievementSection: React.FC<AchievementSectionProps> = ({ tourResults }) => {
  const { t } = useTranslation();
  if (tourResults.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
        <span className="text-xq-gold">🏅</span> {t('settings.achievements')}
      </h3>
      <div className="flex flex-wrap gap-4">
        {tourResults.map(res => (
          <div key={res.id} className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-center text-3xl shadow-lg" title={res.name}>
            {res.rank === 1 ? '🥇' : res.rank === 2 ? '🥈' : res.rank === 3 ? '🥉' : '🎖️'}
          </div>
        ))}
      </div>
    </div>
  );
};

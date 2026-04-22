import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

export const PracticeSeoContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
          <Trans i18nKey="practice.seoContent.title" />
        </h2>
        <div className="space-y-8 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
          <p>
            <Trans i18nKey="practice.seoContent.intro" />
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">{t('practice.seoContent.item1.title')}</h3>
              <p>{t('practice.seoContent.item1.desc')}</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">{t('practice.seoContent.item3.title')}</h3>
              <p>{t('practice.seoContent.item3.desc')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
        {(t('practice.seoContent.hashtags', { returnObjects: true }) as string[] || []).map((tag, i) => (
          <span key={i} className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">
            {tag}
          </span>
        ))}
      </div>

    </div>
  );
};

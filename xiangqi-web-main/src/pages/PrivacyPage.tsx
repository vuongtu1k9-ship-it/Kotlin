import { Card } from '../ui/Card';
import { SEO } from '../components/SEO';
import { useTranslation } from 'react-i18next';

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-12 pt-4">
      <SEO 
        title={t('privacy.meta.title')} 
        description={t('privacy.meta.description')}
      />
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 px-6 mb-12">
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              {t('privacy.title_p1')} <span className="text-emerald-500">{t('privacy.title_p2')}</span>
           </h1>
           <p className="max-w-2xl mx-auto text-[11px] text-slate-600 dark:text-white/40 font-bold leading-relaxed">
              {t('privacy.intro')}
           </p>
        </div>

        <Card title={t('privacy.cardTitle')} subtitle={`${t('privacy.lastUpdated')}: ${t('privacy.lastUpdatedDate')}`}>
          <div className="prose prose-invert max-w-none text-slate-800 dark:text-white/70 space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20">
                1. {t('privacy.sections.collection.title')}
              </h3>
              <p>{t('privacy.sections.collection.intro')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('privacy.sections.collection.item1')}</li>
                <li>{t('privacy.sections.collection.item2')}</li>
                <li>{t('privacy.sections.collection.item3')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20">
                2. {t('privacy.sections.usage.title')}
              </h3>
              <p>{t('privacy.sections.usage.intro')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('privacy.sections.usage.item1')}</li>
                <li>{t('privacy.sections.usage.item2')}</li>
                <li>{t('privacy.sections.usage.item3')}</li>
                <li>{t('privacy.sections.usage.item4')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-rose-500/10 w-fit px-3 py-1 rounded-lg border border-rose-500/20">
                3. {t('privacy.sections.security.title')}
              </h3>
              <p>
                {t('privacy.sections.security.content')}
              </p>
            </section>

              <p>
                {t('privacy.sections.sharing.content_p1')} <strong>{t('privacy.sections.sharing.content_p2')}</strong> {t('privacy.sections.sharing.content_p3')}
              </p>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20">
                5. {t('privacy.sections.rights.title')}
              </h3>
              <p>{t('privacy.sections.rights.intro')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('privacy.sections.rights.item1')}</li>
                <li>{t('privacy.sections.rights.item2')}</li>
                <li>{t('privacy.sections.rights.item3')}</li>
              </ul>
            </section>

            <div className="pt-8 border-t border-black/5 dark:border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30">
                {t('privacy.footer')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

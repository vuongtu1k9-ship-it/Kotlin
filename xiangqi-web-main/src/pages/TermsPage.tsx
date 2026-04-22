import { Card } from '../ui/Card';
import { SEO } from '../components/SEO';
import { useTranslation } from 'react-i18next';

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-12 pt-4">
      <SEO 
        title={t('terms.meta.title')} 
        description={t('terms.meta.description')}
      />
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 px-6 mb-12">
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              {t('terms.title_p1')} <span className="text-blue-500">{t('terms.title_p2')}</span>
           </h1>
           <p className="max-w-2xl mx-auto text-[11px] text-slate-600 dark:text-white/40 font-bold leading-relaxed">
              {t('terms.intro')}
           </p>
        </div>

        <Card title={t('terms.cardTitle')} subtitle={`${t('terms.lastUpdated')}: ${t('terms.lastUpdatedDate')}`}>
          <div className="prose prose-invert max-w-none text-slate-800 dark:text-white/70 space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-blue-500/10 w-fit px-3 py-1 rounded-lg border border-blue-500/20">
                1. {t('terms.sections.acceptance.title')}
              </h3>
              <p>
                {t('terms.sections.acceptance.content')}
              </p>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-blue-500/10 w-fit px-3 py-1 rounded-lg border border-blue-500/20">
                2. {t('terms.sections.accounts.title')}
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('terms.sections.accounts.item1')}</li>
                <li>{t('terms.sections.accounts.item2')}</li>
                <li>{t('terms.sections.accounts.item3')}</li>
                <li>{t('terms.sections.accounts.item4')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-rose-500/10 w-fit px-3 py-1 rounded-lg border border-rose-500/20">
                3. {t('terms.sections.fairplay.title')}
              </h3>
              <p>{t('terms.sections.fairplay.intro')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('terms.sections.fairplay.item1')}</li>
                <li>{t('terms.sections.fairplay.item2')}</li>
                <li>{t('terms.sections.fairplay.item3')}</li>
                <li>{t('terms.sections.fairplay.item4')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-blue-500/10 w-fit px-3 py-1 rounded-lg border border-blue-500/20">
                4. {t('terms.sections.copyright.title')}
              </h3>
              <p>
                {t('terms.sections.copyright.content')}
              </p>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-blue-500/10 w-fit px-3 py-1 rounded-lg border border-blue-500/20">
                5. {t('terms.sections.liability.title')}
              </h3>
              <p>
                {t('terms.sections.liability.content')}
              </p>
            </section>

            <section>
              <h3 className="text-slate-900 dark:text-white font-black text-base mb-3 bg-blue-500/10 w-fit px-3 py-1 rounded-lg border border-blue-500/20">
                6. {t('terms.sections.changes.title')}
              </h3>
              <p>
                {t('terms.sections.changes.content')}
              </p>
            </section>

            <div className="pt-8 border-t border-black/5 dark:border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/30">
                {t('terms.footer')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

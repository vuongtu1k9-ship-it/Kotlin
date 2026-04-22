import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { SEO } from '../SEO';
import { getSiteOrigin } from '../../utils/url';
import { makeSlug } from '../../utils/slug';
import { LazyMount } from '../ui/LazyMount';
import { Card } from '../../ui/Card';

const MiniBoard = lazy(() => import('../MiniBoard').then(m => ({ default: m.MiniBoard })));

interface LobbySeoSectionProps {
  recentPuzzles: any[];
  isInitialLoad: boolean;
}

export const LobbySeoSection: React.FC<LobbySeoSectionProps> = ({ recentPuzzles, isInitialLoad }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Latest Puzzles Section - Synchronized with RoomListSection */}
      <Card
        className="min-h-[400px]"
        title={
          <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
            <div className="h-4 w-1 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest font-heading">
              {t('lobby.seo.recentPuzzles.title')}
            </h2>
          </div>
        }
        subtitle={t('lobby.seo.recentPuzzles.subtitle')}
        headerRight={
          <Link to="/puzzles" className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--cobalt-indigo)] hover:text-indigo-800">
            {t('common.viewAll')}
          </Link>
        }
      >
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {isInitialLoad ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[410px] rounded-3xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200 dark:border-white/5" />
            ))
          ) : (
            recentPuzzles?.slice(0, 12).map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col gap-4 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 shadow-sm transition-all duration-300 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />

                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400/80">
                        {t('lobby.seo.recentPuzzles.puzzleType')}
                      </span>
                      <code className="text-[10px] font-bold text-slate-400 dark:text-white/20 truncate">{p.id}</code>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 dark:text-white/90 truncate mt-1 group-hover:text-emerald-500 transition-colors">
                      {p.name || t('lobby.seo.recentPuzzles.unnamed')}
                    </div>
                  </div>
                  <div className="flex items-end flex-col gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-white/40">
                      {p.level ? t('lobby.seo.recentPuzzles.levelPrefix', { level: p.level }) : t('lobby.seo.recentPuzzles.normalLevel')}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/puzzles/${makeSlug(p.name || 'puzzle', p.id)}`}
                  className="relative aspect-[9/10] w-full overflow-hidden rounded-[12px] bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 group-hover:border-emerald-500/30 transition-colors"
                >
                  <LazyMount fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse rounded-[12px]" />}>
                    <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                      <MiniBoard board={p.thumbBoard} />
                    </Suspense>
                  </LazyMount>
                </Link>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-white/30 truncate">
                    <span>{p.createdByName || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Link 
                       to={`/puzzles/${makeSlug(p.name || 'puzzle', p.id)}`}
                       className="px-4 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                     >
                       {t('lobby.seo.recentPuzzles.solve')}
                     </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 px-4 mt-12">
        <section className="p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-6 shadow-md dark:shadow-2xl">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-blue-500">💎</span> {t('lobby.seo.features.title')}
          </h2>
          <div className="space-y-4 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
            <div>
              <h3 className="text-slate-600 dark:text-white/60 font-black mb-1">{t('lobby.seo.features.premium.title')}</h3>
              <p>
                <Trans i18nKey="lobby.seo.features.premium.desc">
                  <strong className="text-slate-600 dark:text-white/60"></strong> 
                </Trans>
              </p>
            </div>
            <div>
              <h3 className="text-slate-600 dark:text-white/60 font-black mb-1">{t('lobby.seo.features.ai.title')}</h3>
              <p>
                <Trans i18nKey="lobby.seo.features.ai.desc">
                  <strong className="text-slate-600 dark:text-white/60"></strong>
                </Trans>
              </p>
            </div>
            <div>
              <h3 className="text-slate-600 dark:text-white/60 font-black mb-1">{t('lobby.seo.features.data.title')}</h3>
              <p>
                <Trans i18nKey="lobby.seo.features.data.desc">
                  <strong className="text-slate-600 dark:text-white/60"></strong>
                </Trans>
              </p>
            </div>
          </div>
        </section>

        <section className="p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-6 shadow-md dark:shadow-2xl">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-xq-gold">📖</span> {t('lobby.seo.guide.title')}
          </h2>
          <div className="space-y-4 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
            <p>
              <Trans i18nKey="lobby.seo.guide.intro">
                <strong>cotuong.xyz</strong>
              </Trans>
            </p>
            <ol className="space-y-3 list-decimal pl-4">
              <li><strong className="text-slate-600 dark:text-white/60">{t('lobby.seo.guide.step1.title')}</strong> {t('lobby.seo.guide.step1.desc')}</li>
              <li><strong className="text-slate-600 dark:text-white/60">{t('lobby.seo.guide.step2.title')}</strong> {t('lobby.seo.guide.step2.desc')}</li>
              <li>
                <strong className="text-slate-600 dark:text-white/60">{t('lobby.seo.guide.step3.title')}</strong> 
                <Trans i18nKey="lobby.seo.guide.step3.desc">
                  <Link to="/practice" className="text-blue-400"></Link>
                </Trans>
              </li>
            </ol>
            <p className="pt-2 italic">
              {t('lobby.seo.guide.note')}
            </p>
          </div>
        </section>
      </div>

      <div className="mx-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-8">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('lobby.seo.faq.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-[13px] font-medium leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-blue-600 dark:text-blue-400 font-black">{t('lobby.seo.faq.q1.q')}</h3>
            <p className="text-slate-600 dark:text-white/40">{t('lobby.seo.faq.q1.a')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-blue-600 dark:text-blue-400 font-black">{t('lobby.seo.faq.q2.q')}</h3>
            <p className="text-slate-600 dark:text-white/40">{t('lobby.seo.faq.q2.a')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-blue-600 dark:text-blue-400 font-black">{t('lobby.seo.faq.q3.q')}</h3>
            <p className="text-slate-600 dark:text-white/40">{t('lobby.seo.faq.q3.a')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-blue-600 dark:text-blue-400 font-black">{t('lobby.seo.faq.q4.q')}</h3>
            <p className="text-slate-600 dark:text-white/40">{t('lobby.seo.faq.q4.a')}</p>
          </div>
        </div>
      </div>

      <SEO
        title={t('lobby.seo.meta.title')}
        description={t('lobby.seo.meta.description')}
        url={getSiteOrigin()}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": t('lobby.seo.schema.siteName'),
            "url": getSiteOrigin(),
            "description": t('lobby.seo.schema.siteDesc')
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": t('lobby.seo.schema.q1.name'),
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": t('lobby.seo.schema.q1.text')
                }
              },
              {
                "@type": "Question",
                "name": t('lobby.seo.schema.q2.name'),
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": t('lobby.seo.schema.q2.text')
                }
              }
            ]
          }
        ]}
      />
    </>
  );
};

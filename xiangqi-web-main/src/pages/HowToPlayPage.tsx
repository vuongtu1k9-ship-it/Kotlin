import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Piece } from '../components/Piece';
import { LazyMount } from '../components/ui/LazyMount';
import { YouTubeEmbed } from '../components/ui/YouTubeEmbed';
import { getSiteOrigin, getAbsoluteUrl } from '../utils/url';

const EmbeddedBoard = lazy(() => import('../components/EmbeddedBoard').then(m => ({ default: m.EmbeddedBoard })));

export function HowToPlayPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10">
      <SEO 
        title={t('howToPlay.meta.title')} 
        description={t('howToPlay.meta.description')}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": t('navbar.home'),
                "item": getSiteOrigin()
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t('navbar.howToPlay'),
                "item": getAbsoluteUrl('/how-to-play')
              }
            ]
          }
        ]}
      />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {t('howToPlay.title')}
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-white/50 mt-1">{t('howToPlay.subtitle')}</p>
        </div>
      </div>
      <div className="p-8 md:p-12 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] shadow-sm transition-all">
        <div className="prose prose-slate max-w-none text-slate-800 dark:text-white/80 space-y-8">
          <p className="text-lg leading-relaxed">
            {t('howToPlay.intro_p1')} <strong>{t('common.pieces.general')}</strong> {t('howToPlay.intro_p3')}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-blue-600 dark:text-blue-400 font-black text-2xl tracking-tighter">{t('howToPlay.section1.title')}</h3>
              <ul className="list-disc pl-6 space-y-3 text-lg leading-relaxed">
                <li><strong>{t('howToPlay.section1.river.label')}</strong> {t('howToPlay.section1.river.desc')}</li>
                <li><strong>{t('howToPlay.section1.palace.label')}</strong> {t('howToPlay.section1.palace.desc')}</li>
              </ul>
              <p className="text-base text-slate-500 italic">{t('howToPlay.section1.boardDesc')}</p>
            </div>
            <div className="max-w-[480px] mx-auto w-full">
              <LazyMount fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse rounded-3xl" />}>
                <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                  <EmbeddedBoard 
                    title={t('howToPlay.section1.openingTitle')}
                    fen="rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR" 
                    moves="h2e2 h7e7 h0g2 h9g7 i0h0 b9c7 g3g4"
                    size="md"
                  />
                </Suspense>
              </LazyMount>
            </div>
          </div>

          <h3 className="text-blue-600 dark:text-blue-400 font-black text-2xl tracking-tighter mt-12">{t('howToPlay.section2.title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[
              { id: 'general', type: 'general' as const },
              { id: 'advisor', type: 'advisor' as const },
              { id: 'elephant', type: 'elephant' as const },
              { id: 'horse', type: 'horse' as const },
              { id: 'chariot', type: 'chariot' as const },
              { id: 'cannon', type: 'cannon' as const },
              { id: 'soldier', type: 'soldier' as const },
            ].map((p, idx) => (
              <div key={idx} className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-md flex flex-col group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">{t(`howToPlay.section2.pieces.${p.id}.name`)}</h4>
                  <div className="w-16 h-16 shadow-sm rounded-full"><Piece type={p.type} side="red" /></div>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed flex-grow">{t(`howToPlay.section2.pieces.${p.id}.desc`)}</p>
                <Link to={`/practice/basic-${idx + 1}`} className="text-sm text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest hover:underline mt-6 inline-block">{t(`howToPlay.section2.pieces.${p.id}.action`)}</Link>
              </div>
            ))}
          </div>

          <div className="mt-16 space-y-10">
            <h3 className="text-blue-400 font-black text-2xl flex items-center gap-3 tracking-tighter">
              <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">3</span>
              {t('howToPlay.section3.title')}
            </h3>
            
            <p className="italic text-slate-500 dark:text-white/60 text-lg border-l-4 border-blue-600 dark:border-blue-400 pl-6 py-3 bg-slate-50 dark:bg-white/5 rounded-r-2xl">
              {t('howToPlay.section3.intro')}
            </p>

            <div className="overflow-x-auto rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-lg">
              <table className="w-full text-base text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-sm font-black text-slate-500 dark:text-white/40 border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-8 py-5">{t('howToPlay.section3.table.type')}</th>
                    <th className="px-8 py-5 text-rose-600">{t('howToPlay.section3.table.red')}</th>
                    <th className="px-8 py-5 text-slate-500">{t('howToPlay.section3.table.black')}</th>
                    <th className="px-8 py-5">{t('howToPlay.section3.table.meaning')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {[
                    { typeId: 'general', red: { t: 'general', s: 'red', char: '帥' }, black: { t: 'general', s: 'black', char: '將' } },
                    { typeId: 'advisor', red: { t: 'advisor', s: 'red', char: '仕' }, black: { t: 'advisor', s: 'black', char: '士' } },
                    { typeId: 'elephant', red: { t: 'elephant', s: 'red', char: '相' }, black: { t: 'elephant', s: 'black', char: '象' } },
                    { typeId: 'horse', red: { t: 'horse', s: 'red', char: '傌' }, black: { t: 'horse', s: 'black', char: '馬' } },
                    { typeId: 'cannon', red: { t: 'cannon', s: 'red', char: '炮' }, black: { t: 'cannon', s: 'black', char: '砲' } },
                    { typeId: 'soldier', red: { t: 'soldier', s: 'red', char: '兵' }, black: { t: 'soldier', s: 'black', char: '卒' } },
                    { typeId: 'chariot', red: { t: 'chariot', s: 'red', char: '車' }, black: { t: 'chariot', s: 'black', char: '車' } },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-900 dark:text-white text-lg">{t(`howToPlay.section2.pieces.${row.typeId}.name`)}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 shrink-0 shadow-sm rounded-full"><Piece type={row.red.t as any} side="red" /></div>
                          <span className="font-black text-rose-500 text-xl">{row.red.char}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 shrink-0 shadow-sm rounded-full"><Piece type={row.black.t as any} side="black" /></div>
                          <span className="font-black text-slate-500 text-xl">{row.black.char}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-base text-slate-600 dark:text-white/50 italic">{t(`howToPlay.section3.meanings.${row.typeId}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4 transition-all hover:bg-white/[0.05]">
                  <h4 className="text-base font-black text-blue-400">{t('howToPlay.section3.why.title')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 leading-relaxed">
                    {t('howToPlay.section3.why.desc')}
                  </p>
               </div>
               <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4 transition-all hover:bg-white/[0.05]">
                  <h4 className="text-base font-black text-emerald-400">{t('howToPlay.section3.elephantExample.title')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 leading-relaxed">
                    {t('howToPlay.section3.elephantExample.desc_p1')} <strong>{t('howToPlay.section3.elephantExample.desc_p2')}</strong>, {t('howToPlay.section3.elephantExample.desc_p3')} <strong>{t('howToPlay.section3.elephantExample.desc_p4')}</strong>. {t('howToPlay.section3.elephantExample.desc_p5')}
                  </p>
               </div>
            </div>
          </div>

          <h3 className="text-blue-400 font-black text-2xl flex items-center gap-3 mt-20 tracking-tighter">
            <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">4</span>
            {t('howToPlay.section4.title')}
          </h3>
          <div className="overflow-x-auto rounded-[2rem] border border-black/10 dark:border-white/10 bg-white/[0.02] mt-6 shadow-lg">
            <table className="w-full text-base text-left">
              <thead className="bg-slate-100 dark:bg-white/5 text-sm font-black text-slate-600 dark:text-white/40">
                <tr>
                  <th className="px-8 py-5">{t('howToPlay.section4.table.piece')}</th>
                  <th className="px-8 py-5">{t('howToPlay.section4.table.score')}</th>
                  <th className="px-8 py-5">{t('howToPlay.section4.table.stage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { id: 'chariot', score: '9 - 10' },
                  { id: 'cannon', score: '4.5 - 5' },
                  { id: 'horse', score: '4 - 4.5' },
                  { id: 'soldier', score: '1 - 2' },
                  { id: 'defense', score: '2' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900 dark:text-white text-lg">{t(`howToPlay.section4.pieces.${row.id}.name`)}</td>
                    <td className="px-8 py-5 text-xq-gold font-black text-xl">{row.score}</td>
                    <td className="px-8 py-5 text-base text-slate-600 dark:text-white/50">{t(`howToPlay.section4.pieces.${row.id}.power`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-blue-400 font-black text-2xl flex items-center gap-3 mt-20 tracking-tighter">
            <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">5</span>
            {t('howToPlay.section5.title')}
          </h3>
            <ul className="list-disc pl-8 space-y-4 text-lg">
              <li><strong>{t('howToPlay.section5.rules.kingFace.label')}</strong> {t('howToPlay.section5.rules.kingFace.desc')}</li>
              <li><strong>{t('howToPlay.section5.rules.check.label')}</strong> {t('howToPlay.section5.rules.check.desc')}</li>
              <li><strong>{t('howToPlay.section5.rules.mate.label')}</strong> {t('howToPlay.section5.rules.mate.desc')}</li>
            </ul>

            <h3 className="text-blue-400 font-black text-2xl flex items-center gap-3 mt-20 tracking-tighter">
              <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">6</span>
              {t('howToPlay.section6.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/[0.03] p-10 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-inner">
               <div className="space-y-4">
                  <h4 className="text-xq-gold font-bold text-xl tracking-tighter">{t('howToPlay.section6.phases.opening.title')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 leading-relaxed italic">{t('howToPlay.section6.phases.opening.quote')}</p>
                  <p className="text-base text-slate-600 dark:text-white/50 leading-relaxed">{t('howToPlay.section6.phases.opening.desc')}</p>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xq-gold font-bold text-xl tracking-tighter">{t('howToPlay.section6.phases.midgame.title')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 leading-relaxed">{t('howToPlay.section6.phases.midgame.desc')}</p>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xq-gold font-bold text-xl tracking-tighter">{t('howToPlay.section6.phases.endgame.title')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 leading-relaxed">{t('howToPlay.section6.phases.endgame.desc')}</p>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xq-gold font-bold text-xl tracking-tighter">{t('howToPlay.section6.phases.tactics.title')}</h4>
                  <ul className="text-base text-slate-600 dark:text-white/50 space-y-2 list-disc pl-6">
                    <li><strong>{t('howToPlay.section6.phases.tactics.maHauPhao')}</strong></li>
                    <li><strong>{t('howToPlay.section6.phases.tactics.thienDiaPhao')}</strong></li>
                    <li><strong>{t('howToPlay.section6.phases.tactics.daiDamXa')}</strong></li>
                  </ul>
               </div>
            </div>

            <h3 className="text-blue-400 font-black text-2xl flex items-center gap-3 mt-20 tracking-tighter">
              <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">7</span>
              {t('howToPlay.section7.title')}
            </h3>
            <div className="space-y-6">
               <div className="p-8 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-slate-200/50 dark:hover:bg-white/10">
                  <h4 className="text-slate-900 dark:text-white text-lg font-bold mb-2">{t('howToPlay.section7.faqs.f1.q')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 italic">{t('howToPlay.section7.faqs.f1.a')}</p>
               </div>
               <div className="p-8 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-slate-200/50 dark:hover:bg-white/10">
                  <h4 className="text-slate-900 dark:text-white text-lg font-bold mb-2">{t('howToPlay.section7.faqs.f2.q')}</h4>
                  <p className="text-base text-slate-600 dark:text-white/50 italic">{t('howToPlay.section7.faqs.f2.a')}</p>
               </div>
               <div className="p-8 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-slate-200/50 dark:hover:bg-white/10">
                  <h4 className="text-slate-900 dark:text-white text-lg font-bold mb-2">{t('howToPlay.section7.faqs.f3.q')}</h4>
                      <div className="space-y-2">
                        <p>{t('howToPlay.section7.faqs.f3.a_intro')}</p>
                        <p>1. <strong>{t('howToPlay.section7.faqs.f3.a_item1_title')}</strong> {t('howToPlay.section7.faqs.f3.a_item1_desc')}</p>
                        <p>2. <strong>{t('howToPlay.section7.faqs.f3.a_item2_title')}</strong> {t('howToPlay.section7.faqs.f3.a_item2_desc')}</p>
                        <p>3. <strong>{t('howToPlay.section7.faqs.f3.a_item3_title')}</strong> {t('howToPlay.section7.faqs.f3.a_item3_desc')}</p>
                        <p>4. <strong>{t('howToPlay.section7.faqs.f3.a_item4_title')}</strong> {t('howToPlay.section7.faqs.f3.a_item4_desc')}</p>
                      </div>
               </div>
               <div className="p-8 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-slate-200/50 dark:hover:bg-white/10">
                  <h4 className="text-slate-900 dark:text-white text-lg font-bold mb-2">{t('howToPlay.section7.faqs.f4.q')}</h4>
                    <p className="text-base text-slate-600 dark:text-white/50 italic">
                      {t('howToPlay.section7.faqs.f4.a_p1')} <strong>{t('howToPlay.section7.faqs.f4.a_p2')}</strong> {t('howToPlay.section7.faqs.f4.a_p3')}
                    </p>
               </div>
            </div>
            
            <div className="mt-12 text-center">
               <Link to="/practice" className="inline-block bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-base shadow-2xl shadow-blue-600/30 transition-all scale-100 hover:scale-105 active:scale-95">
                  {t('howToPlay.section7.practiceAction')}
               </Link>
            </div>

            {/* 📜 SEO ENRICHMENT: LỊCH SỬ CỜ TƯỚNG */}
            <div className="mt-24 border-t border-black/5 dark:border-white/5 pt-16 space-y-8">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('howToPlay.history.title')}</h3>
               <div className="text-base text-slate-600 dark:text-white/40 leading-relaxed space-y-6 font-medium text-[15px]">
                  <p>
                    <Trans i18nKey="howToPlay.history.p1">
                      <strong></strong>
                      <strong></strong>
                    </Trans>
                  </p>
                  <p>
                    {t('howToPlay.history.p2')}
                  </p>
                  <p>
                    <Trans i18nKey="howToPlay.history.p3">
                      <strong></strong>
                    </Trans>
                  </p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

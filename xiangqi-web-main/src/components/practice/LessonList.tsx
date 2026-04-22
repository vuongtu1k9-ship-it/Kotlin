import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LessonCard } from './LessonCard';
import { PracticeLesson, PracticeCategory } from '../../hooks/usePracticeData';

interface LessonListProps {
  lessonList: PracticeLesson[];
  categories: PracticeCategory[];
  authState: any;
  onOpenLesson: (l: PracticeLesson) => void;
}

export const LessonList: React.FC<LessonListProps> = ({ lessonList, categories, authState, onOpenLesson }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const isCompleted = (id: string) => authState.user?.learningProgress?.[id] === 'completed';
  // Use authoritative categories from API to avoid duplicates from lesson data
  const categoryNames = categories.length > 0
    ? categories.map(c => c.name)
    : Array.from(new Set(lessonList.map(l => l.category))).sort();
  const displayCategories = activeCategory === 'all' ? categoryNames : categoryNames.filter(c => c === activeCategory);

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      {/* Search & Intro */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-black text-slate-800 dark:text-white/90 tracking-tighter uppercase mb-4">
            {t('practice.list.title')}
          </h2>
          <p className="text-lg font-medium text-slate-500 dark:text-white/40 leading-relaxed">
            {t('practice.list.description')}
          </p>
        </div>
        
        {authState.status === 'auth' && authState.user && (
          <div className="flex-none flex items-center gap-4 bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
             <div className="text-center px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-2 block">{t('practice.list.coins')}</span>
                <div className="flex items-center justify-center gap-3">
                   <span className="text-3xl">🪙</span>
                   <span className="text-3xl font-black text-amber-400 tabular-nums">{authState.user.inventory?.coins || 0}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 sticky top-4 z-50 py-2 bg-slate-50/80 dark:bg-[#0f172a]/80 backdrop-blur-md rounded-2xl px-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === 'all' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 dark:text-white/40 hover:text-blue-500'}`}
        >
          {t('practice.list.all')}
        </button>
        {categoryNames.map(cat => {
          const count = lessonList.filter(l => l.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 dark:text-white/40 hover:text-blue-500'}`}
            >
              {cat}
              <span className={`text-[10px] font-bold rounded-full px-1.5 ${activeCategory === cat ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grouped Content */}
      <div className="space-y-24">
        {displayCategories.map(category => {
          const catLessons = lessonList.filter(l => l.category === category).sort((a, b) => {
            const orderA = a.order ?? 9999;
            const orderB = b.order ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            // Fallback to alphabetical ID or title sorting if order is same/missing
            return a.id.localeCompare(b.id, undefined, { numeric: true });
          });
          if (catLessons.length === 0) return null;

          return (
            <div key={category} className="space-y-8">
              <div className="flex items-end justify-between border-b border-black/5 dark:border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{category}</h3>
                </div>
                <span className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">{t('practice.list.lessonCount', { count: catLessons.length })}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catLessons.map(l => (
                  <LessonCard 
                    key={l.id} 
                    lesson={l} 
                    isCompleted={isCompleted(l.id)} 
                    onOpen={onOpenLesson} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.02] to-transparent border border-black/5 dark:border-white/5 space-y-12">
         <div className="text-center space-y-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('practice.curriculum.title')}</h2>
            <p className="text-sm text-slate-600 dark:text-white/40 uppercase tracking-widest font-black">{t('practice.curriculum.subtitle')}</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: t('practice.curriculum.steps.01.title'), desc: t('practice.curriculum.steps.01.desc') },
              { step: '02', title: t('practice.curriculum.steps.02.title'), desc: t('practice.curriculum.steps.02.desc') },
              { step: '03', title: t('practice.curriculum.steps.03.title'), desc: t('practice.curriculum.steps.03.desc') },
              { step: '04', title: t('practice.curriculum.steps.04.title'), desc: t('practice.curriculum.steps.04.desc') },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-3 relative overflow-hidden group hover:bg-white/[0.08] transition-all">
                <span className="text-4xl font-black text-white/5 absolute -right-2 -top-2 group-hover:text-blue-500/10 transition-colors">{item.step}</span>
                <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed font-medium uppercase tracking-tighter">{item.desc}</p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

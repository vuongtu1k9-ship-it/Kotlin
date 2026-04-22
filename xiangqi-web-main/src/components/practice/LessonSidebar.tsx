import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PracticeLesson } from '../../hooks/usePracticeData';

interface LessonSidebarProps {
  selectedLesson: PracticeLesson;
  onClose: () => void;
  isCompleted: boolean;
  completing: boolean;
  onComplete: () => void;
  nextLessonAvailable: boolean;
  onNextLesson: () => void;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({ 
  selectedLesson, 
  onClose, 
  isCompleted, 
  completing, 
  onComplete,
  nextLessonAvailable,
  onNextLesson
}) => {
  const { t } = useTranslation();
  
  const getLocalizedDifficulty = (diff: string) => {
    if (diff === 'Khó') return t('practice.sidebar.difficulty_hard' as any, 'Hard');
    if (diff === 'Trung bình') return t('practice.sidebar.difficulty_med' as any, 'Medium');
    return t('practice.sidebar.difficulty_easy' as any, 'Easy');
  };

  return (
    <div className="flex flex-col w-full lg:w-[320px] 2xl:w-[380px] shrink-0 lg:sticky lg:top-6 self-start space-y-6 lg:order-1">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl p-6 shadow-xl space-y-6">
        <div className="space-y-4">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400/80 hover:text-blue-300 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> {t('practice.sidebar.back')}
          </button>
          
          <div className="flex flex-col gap-1">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1">{selectedLesson.category}</div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white/90 tracking-tighter uppercase leading-tight">{selectedLesson.title}</h2>
            
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-2">
               <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{t('practice.sidebar.difficulty')}</span>
               <div className="flex gap-0.5" title={getLocalizedDifficulty(selectedLesson.difficulty)}>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const isD = (selectedLesson.difficulty === 'Khó' && i < 6) || (selectedLesson.difficulty === 'Trung bình' && i < 3) || (i < 2);
                    return (
                      <div key={i} className={`h-1 w-3 rounded-full ${isD ? 'bg-amber-600 dark:bg-xq-gold shadow-[0_0_8px_rgba(180,83,9,0.3)] dark:shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'bg-black/5 dark:bg-white/5'}`}></div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
           <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2 relative overflow-hidden transition-all hover:bg-white/[0.08]">
              <span className="text-xs font-black uppercase tracking-widest text-blue-400/60 block">{t('practice.sidebar.content')}</span>
              <p className="text-sm font-bold text-slate-800 dark:text-white/70 leading-relaxed tracking-tight whitespace-pre-wrap">
                {selectedLesson.description || selectedLesson.mission || t('practice.sidebar.defaultMission')}
              </p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/5 dark:border-white/5 text-center">
           <div className="flex flex-col gap-1">
              <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-white/20">{t('practice.sidebar.reward')}</span>
              <span className="text-xl font-black text-xq-gold">+{selectedLesson.reward} <span className="text-xs">🪙</span></span>
           </div>
           <div className="flex flex-col gap-1 border-l border-black/5 dark:border-white/5">
                <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-white/20">{t('practice.sidebar.status')}</span>
                <span className={`text-sm font-black uppercase ${isCompleted ? 'text-emerald-400' : 'text-slate-600 dark:text-white/40'}`}>
                   {isCompleted ? t('practice.sidebar.statusDone') : t('practice.sidebar.statusPending')}
                </span>
            </div>
        </div>

        <div className="pt-2">
          <button 
            disabled={completing} 
            onClick={() => {
              if (isCompleted) {
                onNextLesson();
              } else {
                onComplete();
              }
            }} 
            className="w-full h-12 rounded-2xl bg-blue-600 font-black text-sm text-slate-900 dark:text-white hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-600/30 ring-1 ring-blue-400/20 uppercase tracking-tighter disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {completing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('practice.sidebar.processing')}
              </>
            ) : isCompleted ? (
              <>
                {nextLessonAvailable ? t('practice.sidebar.nextLesson') : t('practice.sidebar.finishCourse')}
                <span className="text-xl">⮕</span>
              </>
            ) : (
              <>
                {t('practice.sidebar.completeAndNext')}
                <span className="text-xl">⮕</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

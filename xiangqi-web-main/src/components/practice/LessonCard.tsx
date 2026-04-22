import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { MiniBoard } from '../MiniBoard';
import { LazyMount } from '../ui/LazyMount';
import { PracticeLesson } from '../../hooks/usePracticeData';

interface LessonCardProps {
  lesson: PracticeLesson;
  isCompleted: boolean;
  onOpen: (lesson: PracticeLesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, isCompleted, onOpen }) => {
  const { t } = useTranslation();

  const getLocalizedDifficulty = (diff: string) => {
    if (diff === 'Khó') return t('practice.sidebar.difficulty_hard' as any, 'Hard'); // Fallback to hard if key missing or check mapping
    if (diff === 'Trung bình') return t('practice.sidebar.difficulty_med' as any, 'Medium');
    return t('practice.sidebar.difficulty_easy' as any, 'Easy');
  };

  return (
    <div className="group relative flex flex-col gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-5 shadow-sm transition-all hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-sm font-black uppercase tracking-widest rounded-md">{lesson.category}</span>
             <span className={`px-2 py-0.5 text-sm font-black uppercase tracking-widest rounded-md ${lesson.difficulty === 'Khó' ? 'bg-rose-500/10 text-rose-400' : lesson.difficulty === 'Trung bình' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{getLocalizedDifficulty(lesson.difficulty)}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight line-clamp-1">{lesson.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
            <span className="flex items-center gap-1 text-amber-400 font-black">🪙 {lesson.reward} {t('practice.card.reward')}</span>
            <span>• {isCompleted ? `✅ ${t('practice.card.status.completed')}` : `🕒 ${t('practice.card.status.pending')}`}</span>
          </div>
        </div>
      </div>
      <div onClick={() => onOpen(lesson)} className="relative aspect-[9/10] rounded-2xl overflow-hidden bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 cursor-pointer group-hover:border-blue-500/50 transition-all shadow-inner flex items-center justify-center">
         <div className="w-full h-full max-w-full max-h-full p-2"> 
          <LazyMount fallback={<div className="w-full h-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />}>
            <Suspense fallback={<div className="w-full h-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />}>
              <MiniBoard fen={lesson.boards?.[0]?.fen || null} /> 
            </Suspense>
          </LazyMount>
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white text-black px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform"> {t('practice.card.start')} </div>
         </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed italic line-clamp-2">"{lesson.description || t('practice.card.defaultDesc')}"</p>
      {isCompleted && <div className="absolute top-4 right-4 text-emerald-400 text-xl" title={t('practice.card.completedTitle')}>✔️</div>}
    </div>
  );
};

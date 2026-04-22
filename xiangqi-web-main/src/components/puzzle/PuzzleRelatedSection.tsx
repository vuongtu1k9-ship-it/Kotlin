import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { makeSlug } from '../../utils/slug';
import { LazyMount } from '../ui/LazyMount';

const MiniBoard = lazy(() => import('../MiniBoard').then(m => ({ default: m.MiniBoard })));

interface PuzzleRelatedSectionProps {
  similar: any[];
  linkedGames: any[];
  isLoadingSimilar: boolean;
  isLoadingLinked: boolean;
}

export const PuzzleRelatedSection: React.FC<PuzzleRelatedSectionProps> = ({ 
  similar, 
  linkedGames, 
  isLoadingSimilar, 
  isLoadingLinked 
}) => {
  const { t } = useTranslation();

  // Always hide if not loading and no data
  const showSimilar = isLoadingSimilar || similar.length > 0;
  const showLinked = isLoadingLinked || linkedGames.length > 0;

  if (!showSimilar && !showLinked) return null;

  return (
    <>
      {/* Similar Puzzles Desktop - Reserve space with skeleton */}
      {showSimilar && (
        <div className="hidden lg:block space-y-4 w-full">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-2 tracking-[0.2em]">{t('puzzles.view.similarPuzzles')}</h2>
          <div className="grid grid-cols-2 gap-3 min-h-[300px]">
            {isLoadingSimilar ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[9/10] rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
              ))
            ) : (
              similar.slice(0, 4).map(s => (
                <a key={s.id} href={`/puzzles/${makeSlug(s.name, s.id)}`} className="group flex flex-col gap-2 rounded-2xl border border-black/5 dark:border-white/5 bg-white/[0.02] p-2 hover:bg-slate-100 dark:bg-white/5 transition-all">
                  <div className="aspect-[9/10] overflow-hidden rounded-[12px] bg-white/95 dark:bg-black/60 border border-black/5 dark:border-white/5 group-hover:border-blue-500/20 shadow-sm">
                    <LazyMount fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                      <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                        <MiniBoard board={s.thumbBoard} />
                      </Suspense>
                    </LazyMount>
                  </div>
                  <h3 className="truncate text-[11px] font-black text-slate-600 dark:text-white/40 text-center uppercase group-hover:text-blue-400 tracking-tighter">{s.name}</h3>
                </a>
              ))
            )}
          </div>
        </div>
      )}

      {/* Linked Games - Stable container */}
      {showLinked && (
        <div className="w-full pt-8 border-t border-black/5 dark:border-white/5 space-y-6 min-h-[300px] lg:col-span-1">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30 text-center">{t('puzzles.view.relatedMatchReports')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {isLoadingLinked ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse rounded-2xl" />
              ))
            ) : (
              linkedGames.slice(0, 4).map(g => {
                const redName = g.players?.redName || g.playerNames?.red || 'player';
                const blackName = g.players?.blackName || g.playerNames?.black || 'player';
                const slugName = g.puzzleName || `${redName}-vs-${blackName}`;
                const gameSlug = makeSlug(slugName, g.roomId);

                return (
                  <Link key={g.roomId} to={`/game/${gameSlug}`} className="group flex flex-col gap-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/[0.02] p-2 hover:bg-slate-100 dark:bg-white/5 transition-all">
                    <LazyMount fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse rounded-[12px]" />}>
                      <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                        <MiniBoard board={g.thumbBoard} />
                      </Suspense>
                    </LazyMount>
                    <div className="text-xs font-black text-slate-600 dark:text-white/40 text-center truncate uppercase tracking-tighter leading-none">{redName} vs {blackName}</div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

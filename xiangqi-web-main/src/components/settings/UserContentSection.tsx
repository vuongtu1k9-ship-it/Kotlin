import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MiniBoard } from '../MiniBoard';
import { makeSlug } from '../../utils/slug';

interface UserContentSectionProps {
  myPuzzles: any[];
  likedPuzzles: any[];
  likedGames: any[];
  onEditPuzzle: (id: string) => void;
  onDeletePuzzle: (p: any) => void;
  resultLabel: (g: any) => { text: string; color: string };
}

export const UserContentSection: React.FC<UserContentSectionProps> = ({
  myPuzzles, likedPuzzles, likedGames, onEditPuzzle, onDeletePuzzle, resultLabel
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      {/* My Puzzles */}
      {myPuzzles.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3"><span className="text-blue-400">🧩</span> {t('profile.sections.puzzles')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
            {myPuzzles.slice(0, 4).map(p => (
              <div key={p.id} className="group flex flex-col gap-3 rounded-[2rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 p-4 hover:bg-white/[0.05] transition-all hover:-translate-y-1">
                <div className="aspect-square bg-white/90 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-xl">
                  <MiniBoard board={p.thumbBoard} fen={p.fen} />
                </div>
                <div className="px-1 space-y-1">
                  <div className="text-[11px] font-black text-slate-800 dark:text-white/70 truncate">{p.name || t('lobby.seo.recentPuzzles.unnamed')}</div>
                  <div className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Lvl {p.level || '?'} • {new Date(p.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button onClick={() => onEditPuzzle(p.id)} className="py-2.5 rounded-xl bg-blue-600/10 text-center text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600 hover:text-slate-900 dark:text-white transition-all">{t('setup.history.loadAction')} ✏️</button>
                  <button onClick={() => onDeletePuzzle(p)} className="py-2.5 rounded-xl bg-red-600/10 text-center text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-600 hover:text-slate-900 dark:text-white transition-all">{t('notifications.challenges.deleteAction')} 🗑️</button>
                </div>
                <Link to={`/puzzles/${makeSlug(p.name, p.uid || p.id)}`} className="py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 group-hover:bg-purple-600 group-hover:text-slate-900 dark:text-white transition-all">{t('setup.history.viewAction')}</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liked Puzzles */}
      {likedPuzzles.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3"><span className="text-purple-400">♥</span> {t('puzzles.saved')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
            {likedPuzzles.slice(0, 4).map(p => (
              <div key={p.id} className="group flex flex-col gap-3 rounded-[2rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 p-4 hover:bg-white/[0.05] transition-all hover:-translate-y-1">
                <div className="aspect-square bg-white/90 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-xl">
                  <MiniBoard board={p.thumbBoard} fen={p.fen} />
                </div>
                <div className="px-1 space-y-1">
                  <div className="text-[11px] font-black text-slate-800 dark:text-white/70 truncate">{p.name || t('lobby.seo.recentPuzzles.unnamed')}</div>
                  <div className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Lvl {p.level || '?'} • By {p.createdByName || t('common.loading')}</div>
                </div>
                <Link to={`/puzzles/${makeSlug(p.name, p.uid || p.id)}`} className="py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 group-hover:bg-purple-600 group-hover:text-slate-900 dark:text-white transition-all">{t('setup.history.viewAction')} 🧩</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liked Games */}
      {likedGames.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3"><span className="text-rose-500">♥</span> {t('profile.sections.history')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {likedGames.slice(0, 4).map(g => {
              const res = resultLabel(g);
              return (
                <div key={g.gameId || g.roomId} className="group flex flex-col gap-4 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 p-5 hover:bg-white/[0.05] transition-all hover:-translate-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 dark:text-white/20">{g.timeMode}</span>
                    <span className={res.color}>{res.text}</span>
                  </div>
                  <div className="aspect-[9/10] bg-white/90 dark:bg-black/40 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
                    <MiniBoard board={g.thumbBoard || g.board} position={g.thumbPosition || g.position} />
                  </div>
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-[10px] font-black text-slate-800 dark:text-white/70 truncate">{g.players?.redName || '...'}</span>
                    <span className="text-[7px] italic text-slate-400 dark:text-white/10 shrink-0">VS</span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-white/70 truncate text-right">{g.players?.blackName || '...'}</span>
                  </div>
                  <Link to={`/game/${g.gameId || g.roomId}`} className="py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 group-hover:bg-rose-600 group-hover:text-slate-900 dark:text-white transition-all">{t('profile.sections.viewGame')}</Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

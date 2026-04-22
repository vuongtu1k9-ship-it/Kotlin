import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { makeSlug } from '../../utils/slug';

interface GameInfoPanelProps {
  roomId: string | undefined;
  meta: any | null;
  isFinished: boolean;
  winner: string | null;
  endedBy: string | null;
  playerNames: { red: string | null; black: string | null } | null;
  title: string;
  isLiked: boolean;
  likeCount: number;
  handleToggleLike: () => void;
}

export const GameInfoPanel: React.FC<GameInfoPanelProps> = ({
  roomId,
  meta,
  isFinished,
  winner,
  endedBy,
  playerNames,
  title,
  isLiked,
  likeCount,
  handleToggleLike,
}) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl p-6 shadow-xl space-y-6 min-h-[300px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <div>
          <h2 className="text-xs font-black text-slate-400 dark:text-white/70 uppercase tracking-[0.2em] leading-none">{t('game.panel.title')}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-black text-white">{t('game.panel.matchId', { id: roomId })}</p>
            {meta?.createdAt && (
              <span className="text-xs font-bold text-slate-400 dark:text-white/60 uppercase tracking-tighter">
                {t('game.panel.createdOn', { date: new Date(meta.createdAt).toLocaleDateString(i18n.language) })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isFinished && (
          <div className="overflow-hidden rounded-2xl border border-amber-600/20 dark:border-xq-gold/30 bg-amber-50 dark:bg-xq-gold/10">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-amber-600/20 dark:bg-xq-gold/20 flex items-center justify-center text-xl shadow-inner border border-amber-600/20 dark:border-xq-gold/20 shrink-0">
                {winner ? '🏆' : '🤝'}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-amber-600 dark:text-xq-gold/80 leading-none mb-1">
                  {winner ? t('game.panel.winnerTitle', { side: winner === 'red' ? (playerNames?.red || t('game.h2h.red')) : (playerNames?.black || t('game.h2h.black')) }) : t('game.panel.resultTitle')}
                </div>
                <div className="text-sm font-black text-amber-700 dark:text-white truncate uppercase tracking-tight">
                  {winner ? t('game.panel.winStatus') : t('game.panel.drawStatus')}
                </div>
                {endedBy && (
                  <div className="text-[10px] font-bold text-amber-600/60 dark:text-xq-gold/40 mt-1 uppercase tracking-widest">
                    {t([`game.panel.reasons.${endedBy}`, 'game.panel.reasons.default'])}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/70 mb-2">{t('game.panel.details.title')}</h3>
          <p className="text-xs font-bold text-slate-800 dark:text-white/80 leading-relaxed mb-4">
            {title || t('game.panel.details.defaultTitle', { id: roomId })}
          </p>

          {meta?.setupId && (
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
              <Link 
                to={`/puzzles/${makeSlug(meta.puzzleName || 'the-co', meta.setupId)}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-indigo-400 group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm shadow-inner transition-transform group-hover:scale-110">🧩</div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">{t('game.panel.details.puzzleOrigin')}</span>
                  <span className="text-xs font-black truncate group-hover:underline text-slate-800 dark:text-white/90 transition-colors">
                    {meta.puzzleName || t('game.panel.details.puzzleTitle', { id: meta.setupId.substring(0, 8) })}
                  </span>
                </div>
              </Link>
            </div>
          )}
          
          <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 dark:text-blue-400/80">{t('game.panel.details.drawRules')}</h4>
            <ul className="text-xs text-slate-600 dark:text-white/70 space-y-1.5 list-disc pl-3 font-medium">
              <li><strong className="text-slate-800 dark:text-white/60">{t('game.panel.details.rule60Label')}</strong> {t('game.panel.details.rule60')}</li>
              <li><strong className="text-slate-800 dark:text-white/60">{t('game.panel.details.ruleRepeatLabel')}</strong> {t('game.panel.details.ruleRepeat')}</li>
              <li><strong className="text-slate-800 dark:text-white/60">{t('game.panel.details.ruleTimeoutLabel')}</strong> {t('game.panel.details.ruleTimeout')}</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleToggleLike}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${isLiked
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 text-slate-600 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
          >
            <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
            <span className="text-xs font-black uppercase tracking-widest">{likeCount > 0 ? likeCount : t('game.panel.actions.save')}</span>
          </button>
          <Link to="/game" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20 text-slate-600 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10">
            <span className="text-lg">🎮</span>
            <span className="text-xs font-black uppercase tracking-widest">{t('game.panel.actions.lobby')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

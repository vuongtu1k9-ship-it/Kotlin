import React from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMs } from '../ui/time';
import type { PieceSide } from '../types';
import { useToast } from './ui/Toast';

import { useBoardTimer } from '../hooks/useBoardTimer';

interface BoardInfoProps {
  roomId: string;
  mySide: PieceSide | null;
  roomSummary: any;
  serverClockOffset: number;
  spectators: any[];
  isAiGame?: boolean;
}

export const BoardInfo: React.FC<BoardInfoProps> = ({
  roomId, mySide, roomSummary, serverClockOffset, spectators, isAiGame
}) => {
  const { t } = useTranslation();
  const { success } = useToast();
  const { tick } = useBoardTimer({ roomId, serverClockOffset });
  const clock = roomSummary?.clock;
  const finished = roomSummary?.finished;

  const perMoveMs = clock?.perMoveDeadlineAt && clock?.turnSide && !finished
    ? Math.max(0, clock.perMoveDeadlineAt - (Date.now() + serverClockOffset) + (tick - tick))
    : null;

  return (
    <div className="px-3 pt-1 pb-2 space-y-2 border-b border-white/8">
      {/* Room / role row */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
          <b>{isAiGame ? t('room.vsAi') : t('room.labelWithId', { id: roomId || 'Local' })}</b>
        </div>
        {roomId && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              success(t('room.copyLinkSuccess'));
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20 active:scale-95 text-[10px] uppercase tracking-tighter"
          >
            <span>🔗</span>
            <span>{t('room.inviteBtn')}</span>
          </button>
        )}
        {mySide && (
          <span className="text-slate-600 dark:text-white/40">
            {t('room.role')}: <b className="text-xq-gold">{mySide === 'red' ? t('common.sides.red') : t('common.sides.black')}</b>
          </span>
        )}
        {/* Per-move countdown */}
        {perMoveMs !== null && (
          <span className={`ml-auto text-[10px] font-mono font-bold ${perMoveMs < 10000 ? 'text-red-400 animate-pulse' : 'text-slate-600 dark:text-white/40'}`}>
            {t('room.turn')}: {fmtMs(perMoveMs)}
          </span>
        )}
      </div>

      {/* Spectators */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-white/5">
        <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider shrink-0">
          {t('room.spectatorsShort')} ({spectators.length})
        </div>
        <div className="flex -space-x-2 overflow-hidden flex-1">
          {spectators.length === 0 && <span className="text-[10px] text-slate-400/50 italic ml-2">{t('room.noSpectators')}</span>}
          {spectators.slice(0, 10).map((sp, idx) => (
              <img
                key={idx}
                src={sp.picture || `/api/avatars/${sp.uid}.webp`}
                className="h-7 w-7 rounded-full border-2 border-black/50 ring-1 ring-white/10 object-cover"
                title={sp.name}
              />
            ))}
            {spectators.length > 10 && (
              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold border-2 border-black ring-1 ring-white/10">
                +{spectators.length - 10}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

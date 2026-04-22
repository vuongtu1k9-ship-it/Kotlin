import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PieceSide } from '../../types';

interface BoardBannerProps {
  serverFinished: boolean;
  started: boolean;
  serverMoveIndex: number;
  roomId?: string;
  playerUids: { red: string | null; black: string | null };
  mySide: PieceSide | null;
}

export const BoardBanner: React.FC<BoardBannerProps> = ({
  serverFinished,
  started,
  serverMoveIndex,
  roomId,
  playerUids,
  mySide,
}) => {
  const { t } = useTranslation();
  if (serverFinished || started || serverMoveIndex !== 0) return null;

  return (
    <div className="w-full max-w-[500px] mt-6 animate-in fade-in duration-700">
       <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-blue-500/10 dark:border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
               <div className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
               </div>
               <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em]">
                 {(!roomId || (playerUids.red && playerUids.black)) 
                   ? (mySide === 'red' ? t('game.status.startPrompt_red') : t('game.status.startPrompt_black'))
                   : t('game.status.waitingForPlayers')}
               </span>
            </div>
          </div>
       </div>
    </div>
  );
};

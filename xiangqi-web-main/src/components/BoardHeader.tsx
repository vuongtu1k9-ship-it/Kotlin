import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMs } from '../ui/time';
import type { PieceSide } from '../types';
import { UserPresenceBundle } from './UserPresenceBundle';
import { useBoardTimer } from '../hooks/useBoardTimer';
import { useBoardPing } from '../hooks/useBoardPing';

interface PlayerProfile {
  id: string | null;
  name: string | null;
  picture: string | null;
  elo: number;
  rank: string | null;
  isBot?: boolean;
}

interface BoardHeaderProps {
  playerProfiles: { red: PlayerProfile | null; black: PlayerProfile | null };
  currentPlayer?: PieceSide;
  serverFinished?: boolean;
  ai?: { enabled: boolean; side: PieceSide; level: number; engine?: 'web' | 'pikafish' };
  // Clock
  roomSummary?: any;
  serverClockOffset?: number;
  socketConnected?: { red: boolean; black: boolean };
  presenceMap?: Map<string, any>;
  h2h?: { u1Wins: number, u2Wins: number, draws: number, total?: number } | null;
}

const PlayerSection: React.FC<{
  side: PieceSide;
  flipped: boolean;
  profile: PlayerProfile | null;
  clockMs: number | null;
  isThisTurn: boolean;
  perMoveMs: number | null;
  perMoveLimit: number;
  playerUid: string | null;
  globalPresence: any;
  isAiGame: boolean;
  playerName: string;
  socketConnected: boolean;
  ping: number | null;
}> = React.memo(({
  side, flipped, profile, clockMs, isThisTurn, perMoveMs, perMoveLimit, playerUid,
  globalPresence, playerName, socketConnected, ping
}) => {
  const { t } = useTranslation();
  const sideTheme = side === 'red' 
    ? {
        bg: isThisTurn ? 'bg-gradient-to-b from-red-600/20 to-red-600/5' : 'bg-red-500/5',
        border: isThisTurn ? 'border-red-500/50' : 'border-red-500/5',
        accent: 'text-red-500',
        badgeBg: 'bg-red-500/20',
        glow: isThisTurn ? 'shadow-[0_0_30px_rgba(239,68,68,0.25)]' : '',
        label: t('game.redSide'),
        icon: '帥'
      }
    : {
        bg: isThisTurn ? 'bg-gradient-to-b from-indigo-600/20 to-indigo-600/5' : 'bg-slate-500/5',
        border: isThisTurn ? 'border-indigo-500/50' : 'border-white/5',
        accent: isThisTurn ? 'text-indigo-400' : 'text-slate-400',
        badgeBg: 'bg-slate-800',
        glow: isThisTurn ? 'shadow-[0_0_30px_rgba(99,102,241,0.25)]' : '',
        label: t('game.blackSide'),
        icon: '將'
      };

  const player = useMemo(() => ({
    ...(globalPresence || {}),
    uid: playerUid || (side === 'red' ? 'red' : 'black'),
    name: playerName,
    picture: profile?.picture || null,
    elo: profile?.elo,
    rank: profile?.rank || undefined,
    online: !!globalPresence?.online,
  }), [globalPresence, playerUid, side, playerName, profile]);

  return (
    <div className={`relative flex flex-col p-2 sm:p-4 pb-3 sm:pb-5 transition-all duration-700 ease-out border ${sideTheme.bg} ${sideTheme.border} ${sideTheme.glow} ${flipped ? 'items-end' : 'items-start'} ${isThisTurn ? 'z-10' : 'z-0'}`}>
      <div className={`absolute top-0 ${flipped ? 'right-0 rounded-bl-2xl' : 'left-0 rounded-br-2xl'} px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${sideTheme.accent} ${sideTheme.badgeBg} border-b border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-sm opacity-60`}>
        <span>{sideTheme.label}</span>
        {socketConnected && ping !== null && (
          <span className="flex items-center gap-1 ml-1">
            <span className={`w-0.5 h-0.5 rounded-full ${ping < 150 ? 'bg-emerald-500' : ping < 300 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-[7px] font-mono lowercase tracking-normal">{ping}ms</span>
          </span>
        )}
      </div>

      <div className={`mt-6 w-full flex flex-col ${flipped ? 'items-end text-right pl-13 sm:pl-14' : 'items-start pr-13 sm:pr-14'} gap-2 sm:gap-4 overflow-hidden`}>
        <UserPresenceBundle 
          player={player as any}
          dotColor={socketConnected ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}
          showDot={!!playerUid} 
          size="md"
          flipped={flipped}
          linkToProfile={!!playerUid}
          showStatusLabel={false}
          showRank={!!profile}
        />

        <div className="w-full space-y-2">
          {clockMs !== null && (
            <div className={`font-mono text-2xl font-black px-4 py-2 rounded-2xl border backdrop-blur-xl transition-all duration-500 flex items-center justify-center
              ${isThisTurn 
                ? 'bg-black/60 border-white/30 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] scale-105' 
                : 'bg-black/20 border-white/5 text-slate-500 dark:text-white/70 opacity-60'}
              ${(clockMs < 30000 && isThisTurn) ? 'bg-red-900/40 border-red-500 text-red-500 animate-pulse' : ''}
            `}>
              {fmtMs(Math.max(0, clockMs))}
            </div>
          )}
          
          {perMoveMs !== null && (
            <div className={`flex flex-col gap-1.5 w-full px-1 pt-1 border-t border-white/5 mt-2 transition-all duration-500 ${isThisTurn ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-white/60">
                <span>{t('game.move')}</span>
                <span className={`text-sm font-mono ${perMoveMs < 15000 && isThisTurn ? 'text-red-500 animate-pulse' : 'text-white/80'}`}>
                  {fmtMs(perMoveMs)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 origin-left border-r border-white/20
                    ${(perMoveMs < 15000 && isThisTurn) ? 'bg-gradient-to-r from-red-600 to-red-400' : (side === 'red' ? 'bg-gradient-to-r from-red-700 to-red-500' : 'bg-gradient-to-r from-indigo-700 to-indigo-500')}`}
                  style={{ width: `${Math.min(100, (perMoveMs / perMoveLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
export const BoardHeader: React.FC<BoardHeaderProps> = React.memo(({
  playerProfiles = { red: null, black: null }, ai, serverFinished: serverFinishedProp,
  roomSummary, serverClockOffset = 0, socketConnected = { red: false, black: false },
  presenceMap
}) => {
  const { t } = useTranslation();
  const { tick } = useBoardTimer({ roomId: roomSummary?.roomId || '', serverClockOffset });
  const isAiGame = !!ai?.enabled;
  const ping = useBoardPing(!!roomSummary?.roomId);

  const getPlayerName = (side: PieceSide) => {
    const prof = playerProfiles?.[side];
    if (prof?.name) return prof.name;
    
    if (isAiGame) {
      if (ai?.side === side) return t('game.aiPlayer');
      return t('common.you');
    }
    
    return (roomSummary?.players as any)?.[`${side}Name`] 
               || roomSummary?.playerNames?.[side]
               || t('game.player');
  };

  const rawClock = roomSummary?.clock || roomSummary?.state?.clock;
  const hasClock = !!rawClock?.remainingMs;
  const isFinished = serverFinishedProp || roomSummary?.finished || roomSummary?.state?.finished;

  const getClockMs = (side: PieceSide) => {
    if (!hasClock || !rawClock) return null;
    const base = rawClock.remainingMs[side];
    const isActive = rawClock.turnSide === side && roomSummary?.serverTime && !isFinished;
    return base - (isActive ? Math.max(0, Date.now() + serverClockOffset - roomSummary.serverTime) : 0) + (tick - tick);
  };

  const renderSide = (side: PieceSide, flipped: boolean) => {
    const profile = playerProfiles?.[side] || null;
    const clockMs = getClockMs(side);
    const isThisTurn = rawClock?.turnSide === side && !isFinished;
    const turnDeadline = rawClock?.perMoveDeadlineAt;
    const perMoveLimit = rawClock?.perMoveMs || 120000;
    const perMoveMs = (isThisTurn && turnDeadline)
      ? Math.max(0, turnDeadline - (Date.now() + serverClockOffset) + (tick - tick))
      : perMoveLimit;

    const playerUid = roomSummary?.players?.[`${side}Uid` as keyof typeof roomSummary.players]
                   || roomSummary?.playerUids?.[side];
    const globalPresence = playerUid ? presenceMap?.get(playerUid) : null;

    return (
      <PlayerSection
        side={side}
        flipped={flipped}
        profile={profile}
        clockMs={clockMs}
        isThisTurn={isThisTurn}
        perMoveMs={perMoveMs}
        perMoveLimit={perMoveLimit}
        playerUid={playerUid}
        globalPresence={globalPresence}
        isAiGame={isAiGame}
        playerName={getPlayerName(side)}
        socketConnected={!!socketConnected?.[side]}
        ping={ping}
      />
    );
  };

  return (
    <div className="flex flex-col bg-[#0B0F19] border-b border-white/10 overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
      </div>

      {roomSummary?.puzzleName && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-xq-gold/10 border-b border-white/5 relative z-10 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-xq-gold animate-ping" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-xq-gold">🎯 {t('game.puzzleTag')}</span>
          <span className="text-xs font-black text-white/95 truncate max-w-[280px] uppercase tracking-tight">{roomSummary.puzzleName}</span>
        </div>
      )}

      <div className="grid grid-cols-2 w-full min-w-0 relative items-stretch">
        <div className="min-w-0 border-r border-white/5">{renderSide('red', false)}</div>
        <div className="min-w-0">{renderSide('black', true)}</div>
        
        {/* VS Indicator - Absolutely Centered */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/10" />
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          
          <div className="relative group pointer-events-auto">
            <div className="absolute inset-0 bg-xq-gold/20 rounded-full blur-lg group-hover:bg-xq-gold/40 transition-all" />
            <div className="relative bg-[#0B0F19] border-2 border-xq-gold/30 hover:border-xq-gold w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all">
              <span className="text-[10px] sm:text-xs font-black italic text-xq-gold uppercase tracking-tighter">VS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

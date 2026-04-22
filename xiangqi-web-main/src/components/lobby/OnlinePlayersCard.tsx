import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { UserPresenceBundle } from '../UserPresenceBundle';
import { PlayerInfo } from '../../hooks/useOnlinePlayers';
import { useSocial } from '../../state/SocialContext';

interface OnlinePlayersCardProps {
  visiblePlayers: PlayerInfo[];
  authState: any;
  toastError: (msg: string) => void;
  lastInteractionTime: React.MutableRefObject<number>;
}

export const OnlinePlayersCard: React.FC<OnlinePlayersCardProps> = ({ 
  visiblePlayers, 
  authState, 
  toastError,
  lastInteractionTime
}) => {
  const { t } = useTranslation();
  const onlinePlayersRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isHovered = useRef(false);
  const { isFollowing } = useSocial();

  const handleInteraction = () => {
    lastInteractionTime.current = Date.now();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onlinePlayersRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - onlinePlayersRef.current.offsetLeft;
    scrollLeftStart.current = onlinePlayersRef.current.scrollLeft;
    handleInteraction();
  };

  const handleMouseLeaveOrUp = () => {
    isDragging.current = false;
    isHovered.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !onlinePlayersRef.current) return;
    e.preventDefault();
    handleInteraction();
    const x = e.pageX - onlinePlayersRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    onlinePlayersRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  useEffect(() => {
    const el = onlinePlayersRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const el = onlinePlayersRef.current;
    if (!el || visiblePlayers.length < 5) return;

    let requestId: number;
    let lastTime = performance.now();
    const speed = 0.4;

    const scroll = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      const now = Date.now();
      const isCoolingDown = now - lastInteractionTime.current < 2500;

      if (!isDragging.current && !isHovered.current && !isCoolingDown) {
        const targetScroll = el.scrollLeft + speed * (deltaTime / 16.67);
        el.scrollLeft = targetScroll;

        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }

      requestId = requestAnimationFrame(scroll);
    };

    requestId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(requestId);
  }, [visiblePlayers.length, lastInteractionTime]);

  const scrollPlayers = (direction: 'left' | 'right') => {
    if (onlinePlayersRef.current) {
      const scrollAmount = 300;
      onlinePlayersRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Card
      className="h-[240px] transition-all duration-300 relative group/card"
      title={
        <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
          <div className="h-4 w-1 bg-[var(--cobalt-indigo)] rounded-full" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest font-heading">
            {t('lobby.onlinePlayers')}
          </h2>
        </div>
      }
      subtitle={t('lobby.onlinePlayersCount', { count: visiblePlayers.length })}
      headerRight={
        <div className="flex items-center gap-1.5 bg-emerald-600/10 dark:bg-green-500/10 px-2 py-1 rounded-lg border border-emerald-600/20 dark:border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-green-400">Live</span>
        </div>
      }
    >
      <div className="relative">
        <button
          onClick={() => scrollPlayers('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg border border-black/5 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover/card:opacity-100 -translate-x-2 group-hover/card:translate-x-0"
        >
          ←
        </button>

        <button
          onClick={() => scrollPlayers('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg border border-black/5 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover/card:opacity-100 translate-x-2 group-hover/card:translate-x-0"
        >
          →
        </button>

        <div
          ref={onlinePlayersRef}
          className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar h-[160px] flex-nowrap cursor-grab active:cursor-grabbing select-none touch-pan-x"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => {
            isHovered.current = true;
            handleInteraction();
          }}
          onTouchStart={handleInteraction}
          onTouchMove={handleInteraction}
        >
          {visiblePlayers.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex-shrink-0 w-60 h-[105px] rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 ${i > 1 ? 'animate-pulse' : ''}`} />
            ))
          ) : (
            visiblePlayers.map((p: PlayerInfo) => (
              <div
                key={p.uid}
                className="flex-shrink-0 w-60 p-3 h-[105px] rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-white/20 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between gap-4">
                  <UserPresenceBundle 
                    player={p} 
                    size="md" 
                    className="flex-1" 
                    isFollowed={isFollowing(p.uid)}
                  />
                </div>

                {p.uid !== authState.user?.uid && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => {
                        if (!authState.user || authState.user.provider === 'guest') {
                          toastError(t('lobby.loginToChat'));
                          return;
                        }
                        window.dispatchEvent(new CustomEvent('open-private-chat', { detail: p }));
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 hover:bg-blue-600 dark:hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      {t('lobby.chatAction')}
                    </button>

                    <button
                      onClick={() => {
                        if (!authState.user || authState.user.provider === 'guest') {
                          toastError(t('lobby.loginToChallenge'));
                          return;
                        }
                        window.dispatchEvent(new CustomEvent('open-challenge-modal', { detail: { uid: p.uid, name: p.name || p.uid, picture: p.picture, customStatus: p.customStatus, activityStatus: p.activityStatus } }));
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-600/10 dark:bg-xq-gold/20 hover:bg-amber-600 dark:hover:bg-xq-gold text-amber-600 dark:text-xq-gold hover:text-white dark:hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      {t('lobby.challengeAction')}
                    </button>

                    {p.playingRoomId && (
                      <Link
                        to={`/game/${p.playingRoomId}`}
                        className="p-1.5 rounded-xl bg-emerald-600/10 dark:bg-green-500/20 hover:bg-emerald-600 dark:hover:bg-green-500 text-emerald-600 dark:text-green-400 hover:text-white transition-all shadow-sm"
                      >
                        👁️
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

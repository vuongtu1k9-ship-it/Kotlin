import { useState, useEffect } from 'react';
import { getSocket } from '../net/socket';

export type ActivityStatus = 'idle' | 'waiting' | 'playing' | 'spectating' | 'offline';
export type CustomStatus = 'online' | 'busy' | 'offline' | 'free' | 'invisible' | 'idle';

export interface PlayerInfo {
  uid: string;
  name: string;
  picture: string | null;
  online: boolean;
  elo?: number;
  rank?: string;
  playingRoomId?: string | null;
  /** Auto-derived: idle | waiting | playing */
  activityStatus?: ActivityStatus;
  /** Manual override: online | busy | offline */
  customStatus?: CustomStatus;
}

/** Returns the label/color to display as a status badge.
 *  customStatus=busy overrides everything. offline is hidden by server.
 */
export function resolveStatusBadge(p: PlayerInfo): { label: string; color: string } {
  if (!p.online) return { label: 'Ngoại tuyến', color: 'text-slate-600 dark:text-white/40' };
  
  // Custom manual status overrides
  if (p.customStatus === 'busy') return { label: 'Bận', color: 'text-amber-600 dark:text-amber-400' };
  if (p.customStatus === 'free') return { label: 'Rảnh', color: 'text-emerald-600 dark:text-emerald-400' };
  if (p.customStatus === 'invisible') return { label: 'Ngoại tuyến', color: 'text-slate-600 dark:text-white/40' };
  if (p.customStatus === 'idle') return { label: 'Idle', color: 'text-slate-400' };

  // Automatic activity statuses
  switch (p.activityStatus) {
    case 'playing':    return { label: 'Thi đấu', color: 'text-red-500 dark:text-red-400' };
    case 'waiting':    return { label: 'Đang đợi', color: 'text-blue-600 dark:text-blue-400' };
    case 'spectating': return { label: 'Đang xem', color: 'text-purple-600 dark:text-purple-400' };
    default:           return { label: 'Rảnh', color: 'text-emerald-600 dark:text-emerald-400' };
  }
}

export function useOnlinePlayers() {
  const [presenceMap, setPresenceMap] = useState<Map<string, PlayerInfo>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = getSocket();

    const handlePresenceUpdate = (presence: PlayerInfo) => {
      setPresenceMap(prev => {
        const next = new Map(prev);
        next.set(presence.uid, { ...(next.get(presence.uid) || {}), ...presence });
        return next;
      });
    };

    const handlePresenceList = (data: { ok: boolean; presence: PlayerInfo[] }) => {
      if (data.ok && Array.isArray(data.presence)) {
        setPresenceMap(prev => {
          const next = new Map(prev);
          data.presence.forEach(p => next.set(p.uid, p));
          return next;
        });
        setLoading(false);
      }
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('presence:list', handlePresenceList);
    socket.emit('presence:list');

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('presence:list', handlePresenceList);
    };
  }, []);

  const onlinePlayers = Array.from(presenceMap.values()).filter(p => p.online);
  
  return { onlinePlayers, presenceMap, loading };
}

/**
 * Hook to track user inactivity and update presence status to 'idle'.
 */
export function useInactivityTracking() {
  useEffect(() => {
    const socket = getSocket();
    let timeoutId: any = null;
    const IDLE_TIME = 5 * 60 * 1000; // 5 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // If we were idle, notify server we are back
      // Note: We don't want to spam this, so we could track state
      // but simpler is to let the server handle it if it was already online.
      
      timeoutId = setTimeout(() => {
        socket.emit('presence:custom_status', { status: 'idle' });
      }, IDLE_TIME);
    };

    const handleActivity = () => {
      // If we move, and were likely idle, we should set back to online/auto
      // For now, let's just reset the timer.
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);
}

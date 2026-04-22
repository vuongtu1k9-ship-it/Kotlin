import { useState, useEffect, useMemo } from 'react';
import { lobbyList, type LobbyRoomSummary, getSocket } from '../net/socket';
import { apiGet } from '../api';
import { useNavigate } from 'react-router-dom';
import { makeSlug } from '../utils/slug';
import { logger } from '../utils/logger';

export type Tab = 'open' | 'live' | 'finished' | 'all';

export function useLobbyData(authState: any) {
  const nav = useNavigate();
  const [roomsLive, setRoomsLive] = useState<LobbyRoomSummary[]>([]);
  const [roomsDb, setRoomsDb] = useState<LobbyRoomSummary[]>([]);
  const [recentPuzzles, setRecentPuzzles] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const refresh = async () => {
    logger.debug('Lobby: Starting refresh...');
    // Run all fetches in parallel to prevent blocking
    const results = await Promise.allSettled([
      // 1. Fetch Games
      apiGet<{ ok: boolean; games?: any[] }>(`/games?status=all&limit=12`, authState.token),
      // 2. Fetch Socket Lobby
      Promise.race([
        lobbyList(),
        new Promise<{ ok: false; error: string }>((resolve) => 
          setTimeout(() => resolve({ ok: false, error: 'SOCKET_TIMEOUT' }), 1500)
        ),
      ]),
      // 3. Fetch Puzzles
      (async () => {
        logger.debug('Lobby: Fetching puzzles...');
        return apiGet<{ ok: boolean; setups?: any[] }>('/setups/public?limit=12&source=all', authState.token);
      })()
    ]);

    // Handle Games
    if (results[0].status === 'fulfilled') {
      const g = results[0].value;
      if (g?.ok && Array.isArray(g.games)) setRoomsDb(g.games);
    }

    // Handle Socket
    if (results[1].status === 'fulfilled') {
      const s = results[1].value;
      if ((s as any).ok) setRoomsLive(((s as any).rooms || []).slice(0, 12));
    }

    // Handle Puzzles
    if (results[2].status === 'fulfilled') {
      const p = results[2].value;
      logger.debug('Lobby: Puzzles result received', p);
      if (p?.ok && Array.isArray(p.setups)) {
        setRecentPuzzles(p.setups);
      } else {
        logger.error('Lobby: Failed to fetch recent puzzles', p);
      }
    } else {
      logger.error('Lobby: Puzzle fetch rejected', results[2].reason);
    }

    setIsInitialLoad(false);
  };

  useEffect(() => {
    void refresh();
    const socket = getSocket();

    const handleActiveUpdate = (data: { roomId: string | null }) => {
      setActiveRoomId(data.roomId);
    };
    const handleLobbyUpdate = (room: LobbyRoomSummary) => {
      setRoomsLive(prev => {
        const idx = prev.findIndex(r => r.roomId === room.roomId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...room };
          return next;
        }
        return [room, ...prev].slice(0, 24);
      });
    };
    const handleLobbyRemove = (data: { roomId: string }) => {
      setRoomsLive(prev => prev.filter(r => r.roomId !== data.roomId));
      setRoomsDb(prev => prev.filter(r => r.roomId !== data.roomId));
    };

    socket.on('room:active_game', handleActiveUpdate);
    socket.on('lobby:update', handleLobbyUpdate);
    socket.on('lobby:remove', handleLobbyRemove);
    socket.emit('room:active_check');

    return () => {
      socket.off('room:active_game', handleActiveUpdate);
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('lobby:remove', handleLobbyRemove);
    };
  }, [authState.token]);

  const rooms = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of roomsDb as any[]) m.set(r.roomId, r);
    for (const r of roomsLive as any[]) {
      const existing = m.get(r.roomId);
      if (existing) {
        m.set(r.roomId, { ...existing, ...r, thumbBoard: r.thumbBoard ?? existing.thumbBoard, thumbPosition: r.thumbPosition ?? existing.thumbPosition });
      } else m.set(r.roomId, r);
    }
    return Array.from(m.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 12);
  }, [roomsDb, roomsLive]);

  const filteredRooms = useMemo(() => {
    const list = rooms.slice();
    if (tab === 'all') return list;
    if (tab === 'finished') return list.filter((r) => r.finished);
    if (tab === 'open') return list.filter((r) => !r.finished && !r.started);
    return list.filter((r) => !r.finished && r.started);
  }, [rooms, tab]);

  const doJoin = async (room: any) => {
    const id = room.roomId.trim();
    if (!id) return;
    const redName = room.players?.red ? room.players.redName : (room.playerNames?.red || 'player');
    const blackName = room.players?.black ? room.players.blackName : (room.playerNames?.black || 'player');
    const name = room.puzzleName || `${redName}-vs-${blackName}`;
    nav(`/game/${makeSlug(name, id)}`);
  };

  return {
    rooms,
    filteredRooms,
    recentPuzzles,
    tab,
    setTab,
    activeRoomId,
    isInitialLoad,
    doJoin,
    refresh
  };
}

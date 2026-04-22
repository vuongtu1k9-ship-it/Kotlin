import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../api';
import { logger } from '../utils/logger';
import { makeSlug } from '../utils/slug';
import { PieceSide } from '../types';
import { useNavigate } from 'react-router-dom';

export function useGameData(roomId: string | undefined, authState: any, paramsRoomId: string | undefined) {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [h2h, setH2h] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [winner, setWinner] = useState<PieceSide | null>(null);
  const [endedBy, setEndedBy] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [playerProfiles, setPlayerProfiles] = useState<{ red: any; black: any }>({ red: null, black: null });
  const [spectators, setSpectators] = useState<any[]>([]);
  const [liveHistory, setLiveHistory] = useState<any[]>([]);
  const [historyViewIndex, setHistoryViewIndex] = useState<number | null>(null);

  const isMultiplayer = !!roomId;

  useEffect(() => {
    if (!isMultiplayer || !roomId) return;
    // Reset state for new roomId
    setMeta(null);
    setError(null);
    setTitle('');
    setLikeCount(0);
    setIsLiked(false);
    setH2h(null);
    setWinner(null);
    setEndedBy(null);
    setIsStarted(false);
    setPlayerProfiles({ red: null, black: null });
    setSpectators([]);
    setLiveHistory([]);
    setHistoryViewIndex(null);

    apiGet<{ ok: boolean; game?: any; error?: string }>(`/games/${roomId}`)
      .then(res => {
        if (res.ok && res.game) {
          setMeta(res.game);
          setTitle(res.game.title || '');
          setLikeCount(res.game.likeCount || 0);

          const redName = res.game.players?.redName || res.game.playerNames?.red || 'player';
          const blackName = res.game.players?.blackName || res.game.playerNames?.black || 'player';
          const slugName = res.game.puzzleName || `${redName}-vs-${blackName}`;
          const expectedIdSlug = makeSlug(slugName, roomId);
          if (paramsRoomId !== expectedIdSlug) {
            navigate(`/game/${expectedIdSlug}`, { replace: true });
          }
          if (res.game.state?.winner !== undefined) {
            setWinner(res.game.state.winner);
          }
          if (res.game.state?.endedBy || res.game.endedBy) {
            setEndedBy(res.game.state?.endedBy || res.game.endedBy);
          }
        } else {
          setError(res.error || 'GAME_NOT_FOUND');
        }
      })
      .catch(err => {
        logger.debug('Fetch game meta failed', err);
        setError('FETCH_ERROR');
      });
  }, [roomId, isMultiplayer, paramsRoomId, navigate]);

  useEffect(() => {
    if (!isMultiplayer || authState.status !== 'auth' || !authState.user || !roomId) return;
    apiGet<{ ok: boolean; likes?: string[] }>('/games/likes/mine', authState.token)
      .then(r => {
        if (r.ok && r.likes) setIsLiked(r.likes.includes(roomId));
      })
      .catch(err => logger.debug('Fetch isLiked failed', err));
  }, [roomId, isMultiplayer, authState.status, authState.user, authState.token]);

  const playerUids = meta?.playerUids || meta?.state?.playerUids || null;

  useEffect(() => {
    const redUid = playerUids?.red;
    const blackUid = playerUids?.black;
    if (redUid && blackUid) {
      apiGet<{ ok: boolean, stats: any, recentGames: any[] }>(`/users/${redUid}/vs/${blackUid}`).then(res => {
        if (res.ok && res.stats) {
          setH2h({ ...res.stats, recentGames: res.recentGames });
        } else {
          setH2h({ u1Wins: 0, u2Wins: 0, draws: 0, total: 0, recentGames: [] });
        }
      }).catch(() => {
        setH2h({ u1Wins: 0, u2Wins: 0, draws: 0, total: 0, recentGames: [] });
      });
    }
  }, [playerUids?.red, playerUids?.black]);

  const handleStateChange = useCallback((state: any) => {
    if (state.roomSummary) {
      setMeta((prev: any) => ({ ...prev, ...state.roomSummary }));
    }
    if (state.spectators !== undefined) {
      setSpectators(state.spectators);
    }
    if (state.started !== undefined) {
      setIsStarted(state.started);
    }
    if (state.playerProfiles) {
      setPlayerProfiles(state.playerProfiles);
    }
    if (meta?.status !== 'finished') {
      setLiveHistory(state.moveHistory || []);
    }
    if (state.historyViewIndex !== undefined) {
      setHistoryViewIndex(state.historyViewIndex);
    }
    if (state.winner !== undefined) {
      setWinner(state.winner);
    }
    if (state.endedBy !== undefined) {
      setEndedBy(state.endedBy);
    }
  }, [meta?.status]);

  return {
    meta,
    setMeta,
    error,
    isLiked,
    setIsLiked,
    likeCount,
    setLikeCount,
    h2h,
    title,
    winner,
    setWinner,
    endedBy,
    setEndedBy,
    isStarted,
    playerProfiles,
    spectators,
    liveHistory,
    historyViewIndex,
    setHistoryViewIndex,
    handleStateChange,
  };
}

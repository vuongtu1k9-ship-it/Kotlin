import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';
import { logger } from '../utils/logger';

export function usePuzzleData(id: string | null, token: string | null | undefined, status: string, options?: { onLoginRequired?: () => void }) {
  const [setup, setSetup] = useState<any | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [linkedGames, setLinkedGames] = useState<any[]>([]);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(true);
  const [isLoadingLinked, setIsLoadingLinked] = useState(true);

  useEffect(() => {
    const sid = String(id || '').trim();
    if (!sid) return;

    setIsLoadingSimilar(true);
    setIsLoadingLinked(true);

    apiGet<{ ok: boolean; setup?: any }>(`/setups/public/${encodeURIComponent(sid)}`, token).then(r => {
      if (r?.ok && r.setup) {
        setSetup(r.setup);
        setLikeCount(r.setup.likeCount || 0);
      }
    });

    apiGet<{ ok: boolean; setups?: any[] }>(`/setups/similar/${encodeURIComponent(sid)}?limit=6`, token).then(r => {
      if (r?.ok) setSimilar(r.setups || []);
      setIsLoadingSimilar(false);
    });

    apiGet<{ ok: boolean; games?: any[] }>(`/games?setupId=${encodeURIComponent(sid)}&limit=12`).then(r => {
      if (r?.ok) setLinkedGames(r.games || []);
      setIsLoadingLinked(false);
    });

    apiGet<{ ok: boolean; solutions: any[] }>(`/setups/${encodeURIComponent(sid)}/solutions`).then(r => {
      if (r?.ok) setSolutions(r.solutions);
    });
  }, [id, token]);

  useEffect(() => {
    if (setup?.createdByUid) {
      apiGet<{ ok: boolean; user?: any }>(`/users/${encodeURIComponent(setup.createdByUid)}/summary`, token)
        .then(r => r?.ok && setCreatorProfile(r.user));
    }
  }, [setup?.createdByUid, token]);

  useEffect(() => {
    if (status === 'auth' && id) {
      apiGet<{ ok: boolean; likes?: string[] }>('/setups/likes/mine', token)
        .then(r => r?.ok && setIsLiked(r.likes?.includes(id) || false));
    }
  }, [id, status]);

  const handleToggleLike = async () => {
    if (status !== 'auth') {
      options?.onLoginRequired?.();
      return;
    }
    const sid = String(id || '').trim();
    const prev = isLiked;
    setIsLiked(!prev);
    setLikeCount(c => Math.max(0, c + (prev ? -1 : 1)));
    apiPost(`/setups/like/${sid}`, {}, token).catch((e: any) => {
      logger.debug('handleToggleLike failed', e);
      setIsLiked(prev);
      setLikeCount(c => Math.max(0, c + (prev ? 1 : -1)));
    });
  };

  return {
    setup,
    isLiked,
    likeCount,
    creatorProfile,
    similar,
    linkedGames,
    solutions,
    isLoadingSimilar,
    isLoadingLinked,
    setSolutions,
    handleToggleLike,
  };
}

/**
 * useActiveBots.ts
 *
 * Shared hook that fetches the list of active bots from /api/bots/active.
 * Provides: bots list, selected botId, setter, and botProfile lookup.
 * Used by AiGamePage, PuzzleViewPage, PracticePage, SetupPage.
 */

import { useState, useEffect, useCallback } from 'react';

export interface ActiveBot {
  uid: string;
  _id: string;
  name: string;
  level: number;
  personality: 'aggressive' | 'defensive' | 'balanced';
  avatar?: string;
  status?: string;
  elo?: number;
  rank?: string;
}

interface UseActiveBotsOptions {
  /** Automatically select the first bot on load */
  autoSelect?: boolean;
  /** Default level to pick if no bot is auto-selected */
  defaultLevel?: number;
}

export function useActiveBots(opts: UseActiveBotsOptions = {}) {
  const [bots, setBots] = useState<ActiveBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/bots/active')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const list: ActiveBot[] = Array.isArray(data.bots) ? data.bots : [];
        setBots(list);

        if (opts.autoSelect && list.length > 0) {
          // Randomly select a bot from the list
          const randomIndex = Math.floor(Math.random() * list.length);
          const pick = list[randomIndex];
          setSelectedBotId(pick.uid);
        }
      })
      .catch(() => {
        if (!cancelled) setBots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const selectedBot = bots.find(b => b.uid === selectedBotId) ?? null;

  const selectBot = useCallback((uid: string | null) => {
    setSelectedBotId(uid);
  }, []);

  return {
    bots,
    loading,
    selectedBotId,
    selectedBot,
    selectBot,
    setSelectedBotId,
  };
}

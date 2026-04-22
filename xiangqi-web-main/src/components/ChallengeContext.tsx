import { createContext, useContext, useState, ReactNode } from 'react';
import type { ChallengeConfig } from '../types';

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  url?: string;
  createdAt: number;
}

export interface PendingChallenge {
  id: string;
  direction: 'incoming' | 'outgoing';
  senderUid: string;
  senderName: string;
  senderPicture?: string | null;
  targetUid: string;
  targetName: string;
  config: ChallengeConfig;
  status: 'pending' | 'wait' | 'accepted' | 'declined' | 'canceled';
  createdAt: number;
}

interface ChallengeContextType {
  pendingChallenges: PendingChallenge[];
  addChallenge: (c: PendingChallenge) => void;
  removeChallenge: (id: string) => void;
  clearChallenges: () => void;
  updateChallengeStatus: (id: string, status: 'pending' | 'wait' | 'accepted' | 'declined' | 'canceled') => void;
  resolveChallenge: (id: string, status: 'accepted' | 'declined' | 'canceled') => void;
  systemNotifs: SystemNotification[];
  addSystemNotif: (n: SystemNotification) => void;
  clearSystemNotifs: () => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const [pendingChallenges, setPendingChallenges] = useState<PendingChallenge[]>([]);
  const [systemNotifs, setSystemNotifs] = useState<SystemNotification[]>([]);

  const addChallenge = (c: PendingChallenge) => {
    setPendingChallenges(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = c;
        return next;
      }
      return [...prev, c];
    });
  };

  const removeChallenge = (id: string) => {
    setPendingChallenges(prev => prev.filter(c => c.id !== id));
  };

  const clearChallenges = () => {
    setPendingChallenges([]);
  };

  const updateChallengeStatus = (id: string, status: 'pending' | 'wait' | 'accepted' | 'declined' | 'canceled') => {
    setPendingChallenges(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const resolveChallenge = (id: string, status: 'accepted' | 'declined' | 'canceled') => {
    setPendingChallenges(prev => {
      const c = prev.find(x => x.id === id);
      if (!c) return prev;
      return prev.map(x => x.id === id ? { ...x, status } : x);
    });
  };

  const addSystemNotif = (n: SystemNotification) => {
    setSystemNotifs(prev => [n, ...prev].slice(0, 20)); // Keep max 20
  };

  const clearSystemNotifs = () => setSystemNotifs([]);

  return (
    <ChallengeContext.Provider value={{ pendingChallenges, addChallenge, removeChallenge, clearChallenges, updateChallengeStatus, resolveChallenge, systemNotifs, addSystemNotif, clearSystemNotifs }}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallengeContext() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallengeContext must be used within ChallengeProvider');
  return ctx;
}

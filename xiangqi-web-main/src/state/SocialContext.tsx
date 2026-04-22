import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiGet, apiPost } from '../api';
import { logger } from '../utils/logger';

interface SocialContextValue {
  followingUids: string[];
  followersUids: string[];
  isFollowing: (uid: string) => boolean;
  toggleFollow: (uid: string) => Promise<void>;
  refreshSocial: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const [followingUids, setFollowingUids] = useState<string[]>([]);
  const [followersUids, setFollowersUids] = useState<string[]>([]);

  const refreshSocial = useCallback(async () => {
    if (authState.status !== 'auth' || !authState.user?.uid) {
      setFollowingUids([]);
      setFollowersUids([]);
      return;
    }
    try {
      const [fing, fers] = await Promise.all([
        apiGet<{ok: boolean, following: any[]}>(`/users/${authState.user.uid}/following`, authState.token),
        apiGet<{ok: boolean, followers: any[]}>(`/users/${authState.user.uid}/followers`, authState.token),
      ]);
      if (fing.ok && Array.isArray(fing.following)) {
        setFollowingUids(fing.following.map((f: any) => f.uid));
      }
      if (fers.ok && Array.isArray(fers.followers)) {
        setFollowersUids(fers.followers.map((f: any) => f.uid));
      }
    } catch (e) {
      logger.error('Failed to refresh social data', e);
    }
  }, [authState.status, authState.user?.uid, authState.token]);

  useEffect(() => {
    refreshSocial();
  }, [refreshSocial]);

  const isFollowing = useCallback((uid: string) => followingUids.includes(uid), [followingUids]);

  const toggleFollow = useCallback(async (uid: string) => {
    if (authState.status !== 'auth' || !authState.user?.uid || uid === authState.user.uid) return;
    try {
      const res = await apiPost<{ok: boolean, isFollowing: boolean}>(`/users/follow/${encodeURIComponent(uid)}`, {}, authState.token);
      if (res.ok) {
        // Optimistic update
        setFollowingUids(prev => {
          if (res.isFollowing) {
            return prev.includes(uid) ? prev : [...prev, uid];
          } else {
            return prev.filter(id => id !== uid);
          }
        });
      }
    } catch (e) {
      logger.error('Toggle follow failed', e);
    }
  }, [authState.status, authState.user?.uid, authState.token]);

  return (
    <SocialContext.Provider value={{ followingUids, followersUids, isFollowing, toggleFollow, refreshSocial }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const v = useContext(SocialContext);
  if (!v) throw new Error('useSocial must be used within SocialProvider');
  return v;
}

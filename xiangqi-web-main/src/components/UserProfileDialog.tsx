import React, { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog } from './ui/Dialog';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { getEloRank } from '../utils/eloRanks';
import { makeSlug } from '../utils/slug';
import { logger } from '../utils/logger';
import { useToast } from './ui/Toast';
import { useSocial } from '../state/SocialContext';

interface UserProfile {
  uid: string;
  name: string;
  picture: string | null;
  elo: number;
  gamesPlayed: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  status?: string;
}

export function UserProfileDialog() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const settings = useSiteSettings();
  const navigate = useNavigate();
  const toast = useToast();
  const { isFollowing, toggleFollow } = useSocial();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = async (e: any) => {
      const { uid } = e.detail;
      if (!uid) return;

      setIsOpen(true);
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        const res = await apiGet(`/users/${encodeURIComponent(uid)}/summary`, authState.token);
        if (res.ok) {
          setProfile({
            uid: res.user.uid,
            name: res.user.name,
            picture: res.user.picture,
            elo: res.elo || 1200,
            gamesPlayed: res.gamesPlayed || 0,
            followersCount: res.followersCount || 0,
            followingCount: res.followingCount || 0,
            isFollowing: res.isFollowing || false,
            status: res.status
          });
        } else {
          setError(t('profile.notFound'));
        }
      } catch (err) {
        logger.error('Failed to fetch user profile for dialog', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('open-user-profile', handleOpen);
    return () => window.removeEventListener('open-user-profile', handleOpen);
  }, [authState.token, t]);

  const handleToggleFollow = async () => {
    if (!profile || !authState.user || profile.uid === authState.user.uid) return;
    try {
      const wasFollowing = profile.isFollowing;
      await toggleFollow(profile.uid);
      setProfile(prev => prev ? { 
        ...prev, 
        isFollowing: !wasFollowing, 
        followersCount: prev.followersCount + (!wasFollowing ? 1 : -1) 
      } : null);
    } catch (e) {
      logger.debug('Toggle follow failed in dialog', e);
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-private-chat', { 
      detail: { 
        uid: profile.uid, 
        name: profile.name, 
        picture: profile.picture,
        online: true 
      } 
    }));
  };

  const handleChallenge = () => {
    if (!profile) return;
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-challenge-modal', { 
      detail: { 
        uid: profile.uid, 
        name: profile.name, 
        picture: profile.picture 
      } 
    }));
  };

  const handleViewFullProfile = () => {
    if (!profile) return;
    setIsOpen(false);
    navigate(`/player/${makeSlug(profile.name, profile.uid)}`);
  };

  if (!isOpen) return null;

  const rank = profile ? getEloRank(profile.elo, settings['elo.ranks']) : null;

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      title=""
    >
      <div className="flex flex-col items-center -mt-4 animate-in fade-in zoom-in-95 duration-300">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
            <span className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">{t('common.loading')}...</span>
          </div>
        ) : error ? (
          <div className="py-10 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div className="text-sm font-bold text-slate-600 dark:text-white/40">{error}</div>
            <button onClick={() => setIsOpen(false)} className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-black uppercase tracking-widest">{t('common.close')}</button>
          </div>
        ) : profile && (
          <>
            {/* Header / Avatar */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-xq-gold to-blue-500 rounded-[2rem] blur-xl opacity-20" />
              {profile.picture ? (
                <img src={profile.picture} className="w-24 h-24 rounded-[32px] border-4 border-white dark:border-slate-800 shadow-2xl relative z-10 object-cover" alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-24 h-24 rounded-[32px] bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-slate-800 flex items-center justify-center text-4xl relative z-10">👤</div>
              )}
              {profile.status === 'online' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full z-20 shadow-lg" />
              )}
            </div>

            {/* Name & Rank */}
            <div className="text-center space-y-1 w-full px-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{profile.name}</h3>
              {rank && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 dark:bg-xq-gold/10 text-white dark:text-xq-gold text-[10px] font-black uppercase tracking-widest border border-xq-gold/20 shadow-lg">
                  <span>{rank.icon} {profile.elo}</span>
                  <span className="opacity-40">|</span>
                  <span>{t(rank.title)}</span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 w-full mt-8 gap-1 border-y border-black/5 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
               <div className="flex flex-col items-center py-4 border-r border-black/5 dark:border-white/5">
                  <span className="text-lg font-black text-rose-500">{profile.followersCount}</span>
                  <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">{t('profile.followers')}</span>
               </div>
               <div className="flex flex-col items-center py-4">
                  <span className="text-lg font-black text-blue-500">{profile.gamesPlayed}</span>
                  <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">{t('profile.games')}</span>
               </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 w-full gap-3 p-8">
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleMessage}
                    className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    💬 {t('profile.message')}
                  </button>
                  <button 
                    onClick={handleChallenge}
                    className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-xq-gold text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-xq-gold/80 transition-all active:scale-95 shadow-xl shadow-xq-gold/20"
                  >
                    ⚔️ {t('common.play')}
                  </button>
               </div>
               
               <button 
                 onClick={handleToggleFollow}
                 className={`h-12 flex items-center justify-center gap-2 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest active:scale-95 ${
                   profile.isFollowing 
                   ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                   : 'bg-slate-100 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                 }`}
               >
                 {profile.isFollowing ? `💔 ${t('profile.unfollow')}` : `🤝 ${t('profile.follow')}`}
               </button>

               <button 
                 onClick={handleViewFullProfile}
                 className="h-10 text-[10px] font-black text-slate-400 dark:text-white/30 hover:text-blue-400 uppercase tracking-[0.3em] transition-colors"
               >
                 {t('profile.viewFull')} →
               </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

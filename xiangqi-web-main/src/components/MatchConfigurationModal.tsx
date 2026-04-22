import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOnlinePlayers, type PlayerInfo } from '../hooks/useOnlinePlayers';
import { UserPresenceBundle } from './UserPresenceBundle';
import { Button } from '../ui/Button';
import { useToast } from './ui/Toast';
import { getSocket } from '../net/socket';
import { apiGet } from '../api';
import { logger } from '../utils/logger';

export interface MatchConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, we are challenging this specific user directly */
  targetUser?: PlayerInfo | null;
  /** If provided, we are setting up a match for this specific puzzle */
  setupId?: string | null;
  puzzleName?: string | null;
}

const getTimeModes = (t: any) => [
  { val: 'blitz', label: t('match.config.modes.blitz'), sub: '3p', icon: '⚡' },
  { val: 'rapid', label: t('match.config.modes.rapid'), sub: '10p', icon: '🏃' },
  { val: 'standard', label: t('match.config.modes.standard'), sub: '20p', icon: '⏱' },
  { val: 'slow', label: t('match.config.modes.slow'), sub: '45p', icon: '🎯' },
];

export const MatchConfigurationModal: React.FC<MatchConfigurationModalProps> = ({
  isOpen,
  onClose,
  targetUser = null,
  setupId = null,
  puzzleName = null,
}) => {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const nav = useNavigate();
  const { success, error: toastError } = useToast();
  const { onlinePlayers } = useOnlinePlayers();
  const TIME_MODES = useMemo(() => getTimeModes(t), [t]);

  // Settings state
  const [timeMode, setTimeMode] = useState<string>('standard');
  const [boardType, setBoardType] = useState<'standard' | 'puzzle'>(setupId ? 'puzzle' : 'standard');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Challenge specifics
  const [message, setMessage] = useState(t('match.config.defaultMessage'));
  const [betType, setBetType] = useState<'none' | 'gifts'>('none');
  const [betGiftType, setBetGiftType] = useState<'ring' | 'bear' | 'candy'>('ring');
  const [betGiftAmount] = useState(1);
  const [expanded, setExpanded] = useState(false);

  // Opponent search (if not pre-selected)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponentUid, setSelectedOpponentUid] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingUids, setFollowingUids] = useState<Set<string>>(new Set());

  // Puzzle Selection (if creating a new puzzle match)
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(setupId);
  const [selectedSetupName, setSelectedSetupName] = useState<string | null>(puzzleName);
  const [puzzleSearchQuery, setPuzzleSearchQuery] = useState('');
  const [puzzleSearchResults, setPuzzleSearchResults] = useState<any[]>([]);
  const [isSearchingPuzzles, setIsSearchingPuzzles] = useState(false);
  const [likedPuzzles, setLikedPuzzles] = useState<any[]>([]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset state on open/change
  useEffect(() => {
    if (isOpen) {
      setIsPrivate(false); 
      setBoardType(setupId ? 'puzzle' : 'standard');
      setSearchQuery('');
      setPuzzleSearchQuery('');
      setExpanded(false); // Default to collapsed
      setShowAdvanced(false); // Default to simple view
      
      setSelectedSetupId(setupId);
      setSelectedSetupName(puzzleName);

      // Fetch following list
      if (authState.user?.uid) {
        apiGet<{ ok: boolean, following: any[] }>(`/users/${authState.user.uid}/following`, authState.token)
          .then(res => {
            if (res?.ok) setFollowingUids(new Set(res.following.map(f => f.uid)));
          })
          .catch(err => logger.debug('Fetch following failed', err));
      }

      // Fetch liked puzzles
      if (authState.token && !setupId) {
        apiGet<{ ok: boolean, likes: string[] }>('/setups/likes/mine', authState.token)
          .then(res => {
            if (res?.ok && res.likes.length > 0) {
              return apiGet<{ ok: boolean, setups: any[] }>(`/setups/public?ids=${res.likes.join(',')}`, authState.token);
            }
          })
          .then(res => {
            if (res?.ok) setLikedPuzzles(res.setups);
          })
          .catch(err => logger.debug('Fetch liked puzzles failed', err));
      }
    }
  }, [isOpen, targetUser, setupId, authState.user?.uid, authState.token, puzzleName, t]); // Added t to deps

  // Debounced search
  useEffect(() => {
    if (!showAdvanced || !searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      apiGet<{ ok: boolean, players: PlayerInfo[] }>(`/players?search=${encodeURIComponent(searchQuery)}&limit=10`, authState.token)
        .then(res => {
          if (res?.ok) setSearchResults(res.players);
        })
        .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, authState.token, showAdvanced]);

  // Debounced puzzle search
  useEffect(() => {
    if (!showAdvanced || !puzzleSearchQuery.trim() || puzzleSearchQuery.length < 2) {
      setPuzzleSearchResults([]);
      return;
    }

    setIsSearchingPuzzles(true);
    const timer = setTimeout(() => {
      apiGet<{ ok: boolean, setups: any[] }>(`/setups/public?q=${encodeURIComponent(puzzleSearchQuery)}&limit=10`, authState.token)
        .then(res => {
          if (res?.ok) setPuzzleSearchResults(res.setups);
        })
        .finally(() => setIsSearchingPuzzles(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [puzzleSearchQuery, authState.token, showAdvanced]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    // Combine online players and search results
    const combined = [...onlinePlayers];
    searchResults.forEach(sr => {
      if (!combined.some(p => p.uid === sr.uid)) combined.push(sr);
    });

    return combined
      .filter(p => p.uid !== authState.user?.uid)
      .filter(p => !q || p.name?.toLowerCase().includes(q) || p.uid.toLowerCase().includes(q))
      .sort((a, b) => {
        // Priority: Online + Following > Online > Following > Others
        const aFollow = followingUids.has(a.uid) ? 1 : 0;
        const bFollow = followingUids.has(b.uid) ? 1 : 0;
        const aOnline = a.online ? 1 : 0;
        const bOnline = b.online ? 1 : 0;

        if (aOnline !== bOnline) return bOnline - aOnline;
        if (aFollow !== bFollow) return bFollow - aFollow;
        return 0;
      })
      .slice(0, 15);
  }, [onlinePlayers, searchResults, searchQuery, authState.user?.uid, followingUids]);

  const quickPickPlayers = useMemo(() => {
    return onlinePlayers
      .filter(p => p.uid !== authState.user?.uid)
      .sort((a, b) => {
        const aFollow = followingUids.has(a.uid) ? 1 : 0;
        const bFollow = followingUids.has(b.uid) ? 1 : 0;
        return bFollow - aFollow;
      })
      .slice(0, 10);
  }, [onlinePlayers, authState.user?.uid, followingUids]);

  const activeOpponent = targetUser || onlinePlayers.find(p => String(p.uid).toLowerCase() === String(selectedOpponentUid).toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guestAllowed = true; // For E2E we assume true or fetch from config
    // We should ideally fetch this from site settings, but for E2E we'll just check status.
    const isGuest = authState.status !== 'auth' || (authState.user?.provider === 'guest');
    
    if (isGuest && !guestAllowed) {
      toastError(t('match.config.toasts.loginRequired'));
      return;
    }

    setIsCreating(true);
    try {
      const socket = getSocket();
      const config = {
        timeMode,
        boardType,
        isPrivate,
        setupId: selectedSetupId,
        message: activeOpponent ? message : undefined,
        betType: activeOpponent ? betType : 'none',
        betGiftType: (activeOpponent && betType === 'gifts') ? betGiftType : undefined,
        betGiftAmount: (activeOpponent && betType === 'gifts') ? betGiftAmount : undefined,
      };

      if (activeOpponent) {
        // CHALLENGE FLOW
        socket.emit('challenge:send', {
          targetUid: activeOpponent.uid,
          targetName: activeOpponent.name,
          challengeConfig: config
        });
        success(t('match.config.toasts.challengeSent', { name: activeOpponent.name }));
        onClose();
      } else {
        // LOBBY FLOW (OPEN)
        socket.emit('room:create', { timeMode, setupId: selectedSetupId, isPrivate, boardType, isFixed: false }, (ack: any) => {
          if (ack.ok) {
            success(t('match.config.toasts.roomCreated'));
            nav(`/game/${ack.roomId}`);
            onClose();
          } else {
            if (ack.error === 'ALREADY_IN_GAME') {
              toastError(t('match.config.toasts.alreadyInGame'));
              if (ack.roomId) nav(`/game/${ack.roomId}`);
            } else {
              toastError(`${t('common.error')}: ${ack.error}`);
            }
          }
        });
      }
    } catch (err) {
      toastError(t('match.config.toasts.serverError'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  // Only block if loading
  if (authState.status === 'loading') {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm rounded-[32px] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden bg-white dark:bg-[#0f172a]"
        onClick={e => e.stopPropagation()}
      >
        {/* Aesthetic highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-xq-gold/50 to-transparent" />
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-xq-gold/60">
                {activeOpponent ? t('match.config.titleChallenge') : (setupId ? t('match.config.titlePuzzle') : t('match.config.titleNew'))}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {puzzleName || (activeOpponent ? activeOpponent.name : t('match.config.readyToPlay'))}
              </h2>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white transition-all flex items-center justify-center text-lg"
            >
              ✕
            </button>
          </div>

          {!showAdvanced ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
               {activeOpponent && (
                 <div className="p-4 rounded-2xl bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col items-center text-center gap-2">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1">{t('match.config.invitedOpponent')}</div>
                   <UserPresenceBundle player={activeOpponent} size="md" />
                 </div>
               )}
               <div className="p-4 rounded-2xl bg-xq-gold/5 border border-xq-gold/10 text-center space-y-2">
                 <p className="text-xs font-medium text-slate-600 dark:text-white/60">
                   {t('match.config.defaultConfigDesc')} <br/>
                   <strong className="text-xq-gold uppercase font-black tracking-tight">{t('match.config.defaultConfigDetails')}</strong>
                 </p>
                 <button 
                   type="button"
                   onClick={() => setShowAdvanced(true)}
                   className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors underline underline-offset-4 decoration-blue-400/30"
                 >
                   {t('match.config.advancedConfig')}
                 </button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Time Mode Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">{t('match.config.timeMode')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_MODES.map(m => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setTimeMode(m.val)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                        timeMode === m.val
                          ? 'bg-xq-gold/10 border-xq-gold/40 text-xq-gold shadow-lg shadow-xq-gold/5'
                          : 'bg-white/[0.03] border-black/5 dark:border-white/5 text-slate-600 dark:text-white/40 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-[11px] font-black uppercase">{m.label}</span>
                        <span className="text-[9px] font-bold opacity-40 mt-1">{m.sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponent Selection (Only if not fixed target) */}
              {!targetUser && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">
                    {t('match.config.findOpponent')} {selectedOpponentUid && ` - ${t('match.config.selected')}`}
                  </label>
                  
                  {!selectedOpponentUid ? (
                    <div className="space-y-4">
                      {/* Search bar */}
                      <div className="relative group">
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={t('match.config.searchPlaceholder')}
                          className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-xq-gold/50 transition-all placeholder:text-slate-400 dark:text-white/20"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-xq-gold transition-colors">
                          {isSearching ? <div className="w-4 h-4 border-2 border-xq-gold border-t-transparent rounded-full animate-spin" /> : '🔍'}
                        </div>
                      </div>

                      {/* Quick Pick (Horizontal online list) */}
                      {quickPickPlayers.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                             <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">{t('match.config.online')}</span>
                             <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
                          </div>
                          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar scrollbar-hide">
                            {quickPickPlayers.map(p => (
                              <button
                                key={p.uid}
                                type="button"
                                onClick={() => setSelectedOpponentUid(p.uid)}
                                className="flex flex-col items-center gap-1.5 shrink-0 group/p"
                              >
                                <div className="relative">
                                  <img 
                                    src={p.picture || `/api/avatars/${p.uid}.webp`} 
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 group-hover/p:border-xq-gold/50 transition-all"
                                    alt={p.name}
                                  />
                                </div>
                                <span className="text-[8px] font-bold text-slate-600 dark:text-white/40 group-hover/p:text-slate-900 dark:text-white truncate max-w-[40px] uppercase">
                                  {p.name || '...'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Search results List (if query exists) */}
                      {searchQuery && (
                        <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-200 dark:bg-black/20 border border-black/5 dark:border-white/5 custom-scrollbar">
                          {filteredPlayers.length === 0 ? (
                            <div className="p-4 text-center text-[10px] text-slate-400 dark:text-white/20 italic">{t('match.config.noResults')}</div>
                          ) : (
                            filteredPlayers.map(p => (
                              <button
                                key={p.uid}
                                type="button"
                                onClick={() => setSelectedOpponentUid(p.uid)}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:bg-white/5 border-b border-white/[0.02] last:border-0 transition-colors"
                              >
                                <UserPresenceBundle player={p} size="sm" />
                                <span className="text-[10px] font-black text-xq-gold/60 uppercase group-hover:text-xq-gold">{t('match.config.select')}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-xq-gold/5 border border-xq-gold/20">
                      <UserPresenceBundle player={activeOpponent!} size="sm" />
                      <button 
                        type="button"
                        onClick={() => setSelectedOpponentUid(null)}
                        className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase underline decoration-2 cursor-pointer"
                      >
                        {t('match.config.unselect')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Match Options */}
              <div className="space-y-4">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">{t('match.config.boardOptions')}</label>
                   <button
                     type="button"
                     onClick={() => setIsPrivate(!isPrivate)}
                     className={`w-full py-4 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-black uppercase tracking-widest transition-all ${
                       isPrivate
                         ? 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                         : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                     }`}
                   >
                     <div className="flex items-center gap-2">
                       <span>{isPrivate ? t('match.config.private') : t('match.config.public')}</span>
                     </div>
                   </button>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">{t('match.config.boardType')}</label>
                   <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBoardType('standard')}
                        disabled={!!setupId}
                        className={`py-3 rounded-2xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                          boardType === 'standard'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/5'
                            : 'bg-white/[0.03] border-black/5 dark:border-white/5 text-slate-400 dark:text-white/30'
                        }`}
                      >
                        {t('match.config.standard')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoardType('puzzle')}
                        disabled={!!setupId}
                        className={`py-3 rounded-2xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                          boardType === 'puzzle'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/5'
                            : 'bg-white/[0.03] border-black/5 dark:border-white/5 text-slate-400 dark:text-white/30'
                        }`}
                      >
                        {t('match.config.puzzle')}
                      </button>
                   </div>
                 </div>

                 {/* Puzzle Selection UI (Only if boardType is puzzle) */}
                 {boardType === 'puzzle' && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">
                        {t('match.config.puzzleSetup')} {selectedSetupId && ` - ${t('match.config.selected')}`}
                      </label>
                      
                      {selectedSetupId ? (
                         <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-purple-400 uppercase tracking-tight line-clamp-1">{selectedSetupName || t('match.config.selectedPuzzle')}</span>
                               <span className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase">ID: {selectedSetupId}</span>
                            </div>
                            {!setupId && (
                               <button 
                                 type="button"
                                 onClick={() => {
                                   setSelectedSetupId(null);
                                   setSelectedSetupName(null);
                                 }}
                                 className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase underline decoration-2 cursor-pointer"
                               >
                                 {t('match.config.change')}
                               </button>
                            )}
                         </div>
                      ) : (
                        <div className="space-y-3">
                          {likedPuzzles.length > 0 && (
                            <div className="space-y-2 pb-1">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase">{t('match.config.suggestions')}</span>
                                <span className="text-[9px] font-bold text-purple-400/40 uppercase">♥ {likedPuzzles.length}</span>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
                                {likedPuzzles.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSetupId(p.id);
                                      setSelectedSetupName(p.name);
                                    }}
                                    className="flex-shrink-0 w-32 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left group relative overflow-hidden"
                                  >
                                    <div className="text-[10px] font-black text-slate-800 dark:text-white/70 group-hover:text-purple-400 uppercase truncate mb-1 relative z-10">{p.name}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="relative group">
                            <input 
                              type="text"
                              value={puzzleSearchQuery}
                              onChange={e => setPuzzleSearchQuery(e.target.value)}
                              placeholder={t('match.config.searchPuzzlePlaceholder')}
                              className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-purple-500/10 rounded-2xl px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-400 dark:text-white/20"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-purple-400 transition-colors">
                              {isSearchingPuzzles ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : '🧩'}
                            </div>
                          </div>

                          {puzzleSearchResults.length > 0 && (
                            <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-200 dark:bg-black/20 border border-black/5 dark:border-white/5 custom-scrollbar">
                               {puzzleSearchResults.map(p => (
                                 <button
                                   key={p.id}
                                   type="button"
                                   onClick={() => {
                                     setSelectedSetupId(p.id);
                                     setSelectedSetupName(p.name);
                                   }}
                                   className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:bg-white/5 border-b border-white/[0.02] last:border-0 transition-colors text-left"
                                 >
                                    <div className="flex flex-col items-start gap-0.5">
                                       <span className="text-[11px] font-black text-slate-800 dark:text-white/80 uppercase tracking-tight">{p.name}</span>
                                       <span className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase">{t('match.config.level')} {p.level || '?'}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-purple-400/60 uppercase group-hover:text-purple-400">{t('match.config.select')}</span>
                                 </button>
                               ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Targeted Challenge Options (Expandable) */}
              {activeOpponent && (
                <div className="space-y-4">
                   <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 hover:text-slate-600 dark:text-white/40 transition-colors px-1"
                  >
                    {t('match.config.challengeOptions')}
                    <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {expanded && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase px-1">{t('match.config.message')}</span>
                        <input 
                          type="text"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder={t('match.config.defaultMessage')}
                          className="w-full h-10 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-xq-gold/50 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase px-1">{t('match.config.betGifts')}</span>
                          <button
                            type="button"
                            onClick={() => setBetType(v => v === 'none' ? 'gifts' : 'none')}
                            className={`w-full h-10 rounded-xl border text-[10px] font-black uppercase transition-all ${
                              betType === 'gifts' ? 'bg-pink-500/10 border-pink-400/40 text-pink-400 shadow-lg shadow-pink-500/5' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20 hover:bg-slate-200 dark:bg-white/10'
                            }`}
                          >
                             {betType === 'gifts' ? t('match.config.betActive') : t('match.config.betNone')}
                          </button>
                        </div>

                        {betType === 'gifts' && (
                          <div className="space-y-2 animate-in zoom-in-95 duration-200">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase px-1">{t('match.config.giftType')}</span>
                            <select 
                              value={betGiftType}
                              onChange={e => setBetGiftType(e.target.value as any)}
                              className="w-full h-10 bg-slate-100 dark:bg-black border border-pink-500/20 rounded-xl px-2 text-[10px] text-pink-600 dark:text-pink-200 outline-none focus:border-pink-500/50"
                            >
                              <option value="candy">{t('match.config.gifts.candy')}</option>
                              <option value="bear">{t('match.config.gifts.bear')}</option>
                              <option value="ring">{t('match.config.gifts.ring')}</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="w-full text-center text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest hover:text-slate-600 dark:text-white/40 transition-colors"
                >
                {t('match.config.backToSimple')}
              </button>
            </div>
          )}

          {/* Submission Panel */}
          <div className="pt-2 sticky bottom-0 bg-white dark:bg-[#0f172a] pb-2">
            {boardType === 'puzzle' && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                <p className="text-[9px] font-bold text-blue-400/60 uppercase tracking-widest">
                  {isPrivate ? t('match.config.goldWarning') : t('match.config.goldSuccess')}
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={isCreating || (boardType === 'puzzle' && !selectedSetupId)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-xq-gold to-yellow-400 text-slate-900 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-xq-gold/20 hover:shadow-xq-gold/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 border-none disabled:opacity-50"
            >
              {isCreating ? t('match.config.creating') : (
                <>
                  <span>{(activeOpponent || setupId) ? (activeOpponent ? t('match.config.sendChallenge') : t('match.config.openMatch')) : t('match.config.playNow')}</span>
                </>
              )}
            </Button>
            <div className="h-4" /> {/* Spacer */}
          </div>
        </form>
      </div>
    </div>
  );
};

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Chat } from './Chat';
import { getSocket } from '../net/socket';
import { useAuth } from '../auth/AuthContext';
import { apiGet } from '../api';
import { useToast } from './ui/Toast';
import { useOnlinePlayers, type PlayerInfo } from '../hooks/useOnlinePlayers';
import { useInbox } from '../hooks/useInbox';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { showBrowserNotification } from '../utils/browserNotify';
import { useSocial } from '../state/SocialContext';



export function GlobalChatWidget() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'room' | 'private'>('global');
  const [selectedPrivateUser, setSelectedPrivateUser] = useState<PlayerInfo | null>(null);
  const { onlinePlayers } = useOnlinePlayers();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { messages } = useInbox();
  const settings = useSiteSettings();
  const { followingUids, refreshSocial } = useSocial();
  
  // Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('chat_notifications');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(() => {
    const saved = localStorage.getItem('chat_autoscroll');
    return saved !== null ? saved === 'true' : true;
  });
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('chat_global_notifications');
    return saved !== null ? saved === 'true' : null; // null means "use default"
  });

  // Resolve effective global notification setting
  const effectiveGlobalNotifs = useMemo(() => {
    if (globalNotificationsEnabled !== null) return globalNotificationsEnabled;
    return settings['chat.globalNotificationsDefault'] ?? false;
  }, [globalNotificationsEnabled, settings]);

  useEffect(() => {
    localStorage.setItem('chat_notifications', String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('chat_autoscroll', String(autoScrollEnabled));
  }, [autoScrollEnabled]);

  useEffect(() => {
    if (globalNotificationsEnabled !== null) {
      localStorage.setItem('chat_global_notifications', String(globalNotificationsEnabled));
    }
  }, [globalNotificationsEnabled]);

  // Refs for background socket listener
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const urlRoomIdRef = useRef(urlRoomId);
  urlRoomIdRef.current = urlRoomId;
  const selectedUserRef = useRef(selectedPrivateUser);
  selectedUserRef.current = selectedPrivateUser;
  const myUidRef = useRef(authState.user?.uid);
  myUidRef.current = authState.user?.uid;

  const playNotificationSound = () => {
    if (!notificationsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Ignore autoplay errors
    }
  };


  // Automatically switch to 'room' tab if we enter a room and it's not local
  useEffect(() => {
    if (urlRoomId && urlRoomId !== 'local' && isOpen) {
      setActiveTab('room');
    }
  }, [urlRoomId, isOpen]);

  useEffect(() => {
    const socket = getSocket();
/* online players tracking moved to hook */

    const handleGlobalMessage = (msg: any) => {
      if (msg.senderUid === myUidRef.current) return;
      
      if (!msg.roomId && msg.fromUid && msg.toUid) {
        msg.roomId = `dm::${[msg.fromUid, msg.toUid].sort().join('::')}`;
      }
      let targetTabId = msg.roomId || 'global';
      
      let isActivelyViewing = false;
      if (isOpenRef.current) {
        if (activeTabRef.current === 'global' && targetTabId === 'global') isActivelyViewing = true;
        else if (targetTabId === urlRoomIdRef.current && activeTabRef.current === 'room') isActivelyViewing = true;
        else if (targetTabId.startsWith('dm::') && activeTabRef.current === 'private' && selectedUserRef.current) {
          const myUid = myUidRef.current;
          const otherUid = selectedUserRef.current.uid;
          const expectedId = `dm::${[myUid, otherUid].sort().join('::')}`;
          if (targetTabId === expectedId) isActivelyViewing = true;
        }
      }

      if (!isActivelyViewing) {
        setUnreadCounts(prev => ({
          ...prev,
          [targetTabId]: (prev[targetTabId] || 0) + 1
        }));
        if (!targetTabId.startsWith('dm::')) {
          playNotificationSound();
        } else {
          // Browser notification for DMs when tab is hidden
          const senderName = msg.senderName || msg.fromName || t('navbar.guestName');
          showBrowserNotification(`💬 ${senderName}`, {
            body: msg.content || msg.text || t('chat.new_message'),
          });
          playNotificationSound();
        }
      }
    };
    socket.on('chat:message', handleGlobalMessage);

    const handleNewFollower = (data: {uid: string; name: string}) => {
      toast.info(`🎉 ${data.name || t('navbar.guestName')} ${t('chat.followed_you')}`, {
        duration: 10000,
        actions: [{
          label: t('chat.view_profile'),
          variant: 'primary',
          onClick: () => navigate(`/player/${data.uid}`)
        }]
      });
      playNotificationSound();
    };
    socket.on('new_follower', handleNewFollower);

    const handleOpenChatReq = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-global-chat', handleOpenChatReq);

    const handleOpenPrivateChat = (e: any) => {
      const userData = e.detail as PlayerInfo;
      setIsOpen(true);
      setActiveTab('private');
      setSelectedPrivateUser(userData);
    };
    window.addEventListener('open-private-chat', handleOpenPrivateChat);

    const handleChallengeAccepted = ({ roomId }: { roomId: string }) => {
      toast.success(t('chat.challenge_accepted'), { 
        actions: [
          {
            label: t('chat.go_to_play'),
            variant: 'primary',
            onClick: () => navigate(`/game/${roomId}`),
          }
        ],
        duration: 20000,
      });
      playNotificationSound();
    };
    socket.on('challenge_accepted', handleChallengeAccepted);


    return () => {
      socket.off('chat:message', handleGlobalMessage);
      socket.off('new_follower', handleNewFollower);
      socket.off('challenge_accepted', handleChallengeAccepted);
      window.removeEventListener('open-global-chat', handleOpenChatReq);
      window.removeEventListener('open-private-chat', handleOpenPrivateChat);
    };
  }, [navigate, toast, authState.user?.uid, urlRoomId]);


  const chatRoomId = useMemo(() => {
    if (activeTab === 'room' && urlRoomId && urlRoomId !== 'local') return urlRoomId;
    if (activeTab === 'private' && selectedPrivateUser && authState.user?.uid) {
      const uids = [authState.user.uid, selectedPrivateUser.uid].sort();
      return `dm::${uids[0]}::${uids?.[1]}`;
    }
    return 'global';
  }, [activeTab, urlRoomId, selectedPrivateUser, authState.user?.uid]);

  // Fetch following list for presence notifications
  useEffect(() => {
    refreshSocial();
  }, [authState.status, authState.user?.uid, refreshSocial]);

  // Diff onlinePlayers to notify about followed users
  const prevOnline = useRef<Set<string>>(new Set());
  const prevRooms = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!onlinePlayers || followingUids.length === 0) return;
    const currentOnline = new Set(onlinePlayers.map(p => p.uid));
    const currentRooms = new Map(onlinePlayers.map(p => [p.uid, p.playingRoomId || '']));

    onlinePlayers.forEach(p => {
      if (!followingUids.includes(p.uid)) return;
      
      const wasOnline = prevOnline.current.has(p.uid);
      if (!wasOnline && currentOnline.has(p.uid)) {
        toast.info(`🔔 ${p.name} ${t('chat.is_online')}`, { duration: 4000 });
      }

      const oldRoom = prevRooms.current.get(p.uid);
      const newRoom = p.playingRoomId;
      if (newRoom && oldRoom !== newRoom) {
        toast.info(`⚔️ ${p.name} ${t('chat.entered_room')} ${newRoom}.`, { duration: 4000 });
      }
    });

    prevOnline.current = currentOnline;
    prevRooms.current = currentRooms;
  }, [onlinePlayers, followingUids, toast]);

  useEffect(() => {
    if (!isOpen) return;
    setUnreadCounts(prev => {
      const keyToClear = chatRoomId;
      if (keyToClear && prev[keyToClear] > 0) {
        if (keyToClear.startsWith('dm::')) {
          return prev;
        }
        return { ...prev, [keyToClear]: 0 };
      }
      return prev;
    });
  }, [isOpen, chatRoomId]);

  const showRoomTab = false;
  const { unreadCount: inboxUnread } = useInbox();
  
  const totalUnread = useMemo(() => {
    const socketUnread = Object.entries(unreadCounts)
      .filter(([key]) => {
        if (key === 'global') return effectiveGlobalNotifs;
        return true;
      })
      .reduce((a, b) => a + b[1], 0);
    return Math.max(socketUnread, inboxUnread);
  }, [unreadCounts, inboxUnread, effectiveGlobalNotifs]);

  const handleOpenWidget = () => {
    setIsOpen(true);
    const unreadKeys = Object.entries(unreadCounts).filter(([_, count]) => count > 0).map(([k]) => k);
    if (unreadKeys.length > 0) {
       const key = unreadKeys[0];
       if (key === 'global') setActiveTab('global');
       else if (key === urlRoomId) setActiveTab('room');
       else if (key.startsWith('dm::')) {
          const parts = key.split('::');
          const myUid = String(authState.user?.uid);
          const otherUid = parts[1] === myUid ? parts[2] : parts[1];
          if (otherUid) {
             const p = onlinePlayers.find(pl => String(pl.uid) === otherUid);
             if (p) {
                setSelectedPrivateUser(p);
                setActiveTab('private');
             }
          }
       }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpenWidget}
        aria-label={t('chat.open_chat')}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-500 shadow-xl rounded-full text-slate-900 dark:text-white transition-all hover:scale-105 active:scale-95 ${totalUnread > 0 ? 'animate-pulse ring-4 ring-blue-500/30' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 border-2 border-[#0B0F19] text-[10px] font-bold text-slate-900 dark:text-white rounded-full">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-2 sm:right-6 z-50 flex flex-col w-[calc(100vw-1rem)] sm:w-80 md:w-96 h-[520px] bg-white/95 dark:bg-[#0b0b0d]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="flex flex-col bg-slate-100 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 dark:border-white/5 text-xs font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest">
           <span>{t('chat.title')}</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setGlobalNotificationsEnabled(!effectiveGlobalNotifs)}
                title={effectiveGlobalNotifs ? t('chat.disable_global_notifs') : t('chat.enable_global_notifs')}
                className={`transition-colors relative ${effectiveGlobalNotifs ? 'text-xq-gold' : 'text-slate-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                {effectiveGlobalNotifs && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-100 dark:border-slate-900"></span>}
              </button>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                title={notificationsEnabled ? t('chat.disable_notifs') : t('chat.enable_notifs')}
                className={`transition-colors ${notificationsEnabled ? 'text-blue-500' : 'text-slate-400'}`}
              >
                {notificationsEnabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14.58"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
              <button 
                onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                title={autoScrollEnabled ? t('chat.disable_autoscroll') : t('chat.enable_autoscroll')}
                className={`transition-colors ${autoScrollEnabled ? 'text-blue-500' : 'text-slate-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                aria-label={t('chat.close_chat')}
                className="hover:text-slate-900 dark:text-white transition-colors"
              >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
        </div>
        <div className="flex">
          <button onClick={() => setActiveTab('global')} className={`flex-1 px-4 py-2.5 text-xs font-bold transition-all border-b-2 relative ${activeTab === 'global' ? 'text-blue-400 border-blue-500 bg-blue-500/5' : 'text-slate-600 dark:text-white/40 border-transparent hover:text-slate-600 dark:text-white/60'}`}>
            {t('chat.tabs.global')}
            {unreadCounts['global'] > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500"></span>}
          </button>
          {showRoomTab && (
            <button onClick={() => setActiveTab('room')} className={`flex-1 px-4 py-2.5 text-xs font-bold transition-all border-b-2 relative ${activeTab === 'room' ? 'text-xq-gold border-xq-gold bg-xq-gold/5' : 'text-slate-600 dark:text-white/40 border-transparent hover:text-slate-600 dark:text-white/60'}`}>
              {t('common.room')}
              {urlRoomId && unreadCounts[urlRoomId] > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500"></span>}
            </button>
          )}
          <button onClick={() => setActiveTab('private')} className={`flex-1 px-4 py-2.5 text-xs font-bold transition-all border-b-2 relative ${activeTab === 'private' ? 'text-purple-400 border-purple-500 bg-purple-500/5' : 'text-slate-600 dark:text-white/40 border-transparent hover:text-slate-600 dark:text-white/60'}`}>
            {selectedPrivateUser ? (selectedPrivateUser.name || '...') : t('chat.tabs.private')}
            {Object.keys(unreadCounts).some(k => k.startsWith('dm::') && unreadCounts[k] > 0) && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500"></span>}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-50 dark:bg-slate-900 border-b border-black/5 dark:border-white/5 custom-scrollbar">
        {onlinePlayers.filter(p => p.uid !== authState.user?.uid).length === 0 && <span className="text-[10px] text-slate-400 dark:text-white/20 ml-2 py-1 italic">{t('common.offline')}...</span>}
        {onlinePlayers.filter(p => p.uid !== authState.user?.uid).map(p => (
          <button
            key={p.uid}
            onClick={() => { setSelectedPrivateUser(p); setActiveTab('private'); }}
            className={`flex-shrink-0 flex items-center gap-1.5 p-1 rounded-lg border transition-all relative ${selectedPrivateUser?.uid === p.uid && activeTab === 'private' ? 'bg-purple-500/20 border-purple-500/30' : 'bg-slate-100 dark:bg-slate-800 border-black/5 dark:border-white/10'}`}
          >
            <div className="relative">
              {p.picture ? <img src={p.picture} className="w-6 h-6 rounded-full object-cover" alt={p.name} /> : <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold">{p.name?.[0] || '?'}</div>}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-black rounded-full"></span>
            </div>
            <span className="text-[10px] font-medium text-slate-800 dark:text-white/80 max-w-[50px] truncate">{p.name || '...'}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative bg-white/90 dark:bg-black/40">
        {activeTab === 'private' && !selectedPrivateUser ? (
          <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-[10px] font-black text-blue-400 uppercase tracking-widest flex justify-between">
              <span>{t('chat.onlinePlayersHeader')}</span>
              <span>{t('chat.history', { count: messages.length })}</span>
            </div>
            
            {/* Conversations / Inbox list */}
            {messages.length > 0 && (
              <div className="mb-4 space-y-1">
                 {messages.slice(0, 10).map(m => {
                    const isFromMe = m.fromUid === authState.user?.uid;
                    const otherUid = isFromMe ? m.toUid : m.fromUid;
                    const otherName = isFromMe ? t('chat.to_prefix') + (m.toUid) : (m.fromName || m.fromUid);
                    return (
                      <button 
                        key={m._id} 
                        onClick={() => {
                          // Find player info if online, or just set dummy info
                          const p = onlinePlayers.find(pl => String(pl.uid).toLowerCase() === String(otherUid).toLowerCase());
                          setSelectedPrivateUser(p || { uid: otherUid, name: otherName, picture: m.fromPicture || null, online: false });
                          setActiveTab('private');
                        }}
                        className="w-full p-3 border-b border-black/5 dark:border-white/5 hover:bg-slate-100 dark:bg-white/5 flex items-center gap-3 text-left transition-colors"
                      >
                         <div className="relative">
                            {m.fromPicture ? <img src={m.fromPicture} className="w-8 h-8 rounded-full" alt={otherName} /> : <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">{otherName?.[0] || '?'}</div>}
                            {m.status === 'unread' && !isFromMe && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0B0F19]"></span>}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold ${m.status === 'unread' && !isFromMe ? 'text-blue-400' : 'text-slate-900 dark:text-white'} truncate`}>{otherName}</div>
                            <div className="text-[10px] text-slate-400 dark:text-white/30 truncate">{m.content || m.text}</div>
                         </div>
                      </button>
                    );
                 })}
              </div>
            )}

            {onlinePlayers.filter(p => p.uid !== authState.user?.uid).map(p => (
              <button key={p.uid} onClick={() => { setSelectedPrivateUser(p); setActiveTab('private'); }} className="p-3 border-b border-black/5 dark:border-white/5 hover:bg-slate-100 dark:bg-white/5 flex items-center gap-3 text-left transition-colors">
                <div className="relative">
                  {p.picture ? <img src={p.picture} className="w-8 h-8 rounded-full" alt={p.name} /> : <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">{p.name?.[0] || '?'}</div>}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-green-500/60 font-medium">{t('chat.is_online_label')}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="bg-slate-100 dark:bg-white/5 border-b border-black/10 dark:border-white/10 px-4 py-2 flex items-center justify-between">
             <button onClick={() => setSelectedPrivateUser(null)} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                 {t('common.back')}
               </button>
               {selectedPrivateUser && <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{selectedPrivateUser.name}</div>}
            </div>
            <Chat 
              roomId={chatRoomId} 
              className="!border-0 !rounded-none !bg-transparent flex-1" 
              hideHeader={true} 
              autoScroll={autoScrollEnabled}
            />
          </div>
        )}
      </div>
      
      <div className="absolute top-[88px] right-2 pointer-events-none">
         <div className="px-2 py-0.5 rounded bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 backdrop-blur text-[9px] text-slate-400 dark:text-white/30 truncate max-w-[120px]">
            {activeTab === 'global' ? t('chat.labelGlobal') : activeTab === 'room' ? t('chat.labelRoom', { id: urlRoomId }) : t('chat.labelPrivate', { name: selectedPrivateUser?.name || t('chat.tabs.private') })}
         </div>
      </div>

    </div>
  );
}

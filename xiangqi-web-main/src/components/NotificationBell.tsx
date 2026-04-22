import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChallengeContext } from './ChallengeContext';
import { getSocket } from '../net/socket';
import { logger } from '../utils/logger';
import { useAuth } from '../auth/AuthContext';
import { subscribeToPush } from '../net/push';
import { useLocation, Link } from 'react-router-dom';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';
import { UserPresenceBundle } from './UserPresenceBundle';
import { getTimeControlLabel } from '../constants/tournamentConstants';

export function NotificationBell() {
  const { t } = useTranslation();
  const { pendingChallenges, removeChallenge, updateChallengeStatus, clearChallenges, systemNotifs, clearSystemNotifs } = useChallengeContext();
  const [isOpen, setIsOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { state: authState } = useAuth();
  const { onlinePlayers } = useOnlinePlayers();

  const currentUserPresence = onlinePlayers.find(p => String(p.uid) === String(authState.user?.uid));
  const isActuallyPlaying = currentUserPresence ? currentUserPresence.activityStatus === 'playing' : false;
  
  // Use presence-based playing status if we are on a game page
  const inGame = location.pathname.startsWith('/game/') && isActuallyPlaying;

  if (isOpen) {
    console.log(`[BELL] Render Info -> My UID: ${authState.user?.uid} | InGame: ${inGame} | ActivityStatus: ${currentUserPresence?.activityStatus}`);
  }

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const handleEnablePush = async () => {
    setPushError(null);
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === 'granted') {
        const result = await subscribeToPush();
        if (!result?.ok) {
          setPushError(t('notifications.push.saveError'));
          logger.error('Push subscribe failed', result);
        }
      } else if (permission === 'denied') {
        setPushError(t('notifications.push.deniedError'));
      }
    } catch (e) {
      setPushError(t('notifications.push.genericError'));
      logger.error('Push failed', e);
    } finally {
      setPushLoading(false);
    }
  };

  const handleReply = (challengeId: string, status: 'accept' | 'decline' | 'wait') => {
    const socket = getSocket();
    if (socket) {
      socket.emit('challenge:reply', { challengeId, status });
    }
    if (status === 'decline' || status === 'accept') {
      updateChallengeStatus(challengeId, status === 'accept' ? 'accepted' : 'declined');
    } else if (status === 'wait') {
      updateChallengeStatus(challengeId, 'wait');
    }
  };

  const handleCancel = (challengeId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('challenge:cancel', { challengeId });
    }
    updateChallengeStatus(challengeId, 'canceled');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = pendingChallenges.filter(c => c.status === 'pending').length + systemNotifs.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-900 dark:text-white transition-colors relative"
        title={t('notifications.title')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-slate-900 dark:text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 sm:mt-2 w-[92vw] sm:w-80 bg-[#0f172a] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col">
          {pushStatus !== 'granted' && (
            <div className="bg-blue-500/10 border-b border-blue-500/20 p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs text-blue-200">{t('notifications.push.prompt')}</span>
                <button 
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                  className="text-[10px] font-black uppercase tracking-wider bg-blue-500 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg hover:bg-blue-400 disabled:opacity-50 transition-colors whitespace-nowrap shadow-lg shadow-blue-500/20"
                >
                  {pushLoading ? '...' : t('notifications.push.enable')}
                </button>
              </div>
              {pushError && (
                <div className="text-[10px] text-red-400 font-bold">⚠️ {pushError}</div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center p-3 border-b border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20">
            <h4 className="text-sm font-black text-slate-900 dark:text-white px-1">{t('notifications.panelHeader')}</h4>
            {(unreadCount > 0) && (
              <button
                onClick={() => { clearChallenges(); clearSystemNotifs(); }}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1"
              >
                {t('notifications.clearAll')}
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto w-full">
            {pendingChallenges.length === 0 && systemNotifs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                {t('notifications.empty')}
              </div>
            ) : (
              <div className="flex flex-col">
                {/* System / Admin notifications */}
                {systemNotifs.map(n => (
                  <div key={n.id} className="p-3 border-b border-black/5 dark:border-white/5 flex flex-col gap-1 bg-blue-500/5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📢</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{n.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-white/50 leading-snug">{n.body}</div>
                      </div>
                      <button onClick={() => clearSystemNotifs()} className="text-slate-400 hover:text-red-400 transition-colors text-[10px] px-1">✕</button>
                    </div>
                    {n.url && (
                      <Link to={n.url} onClick={() => setIsOpen(false)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">
                        {t('notifications.viewNow')}
                      </Link>
                    )}
                  </div>
                ))}

                {[...pendingChallenges]
                  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                  .map(c => (
                  <div key={c.id} className="p-3 border-b border-black/5 dark:border-white/5 hover:bg-slate-100 dark:bg-white/5 transition-colors flex flex-col gap-2">
                    <div className="flex gap-3 items-start relative">
                        <UserPresenceBundle 
                          player={c.direction === 'incoming' 
                            ? { uid: c.senderUid, name: c.senderName, picture: c.senderPicture } 
                            : { uid: c.targetUid, name: c.targetName }
                          }
                          size="md"
                          showRank={true}
                          className="flex-1"
                        />
                        {(() => {
                           const isOnline = onlinePlayers.some(p => String(p.uid) === String(c.senderUid));
                           if (isOpen) console.log(`[BELL] Challenge from ${c.senderUid} | Online: ${isOnline}`);
                           return c.direction === 'incoming' && !isOnline && (
                             <span className="absolute top-0 right-0 text-[8px] font-black uppercase tracking-tighter text-red-400 bg-red-400/10 px-1 py-0.5 rounded border border-red-400/20">{t('common.offline')}</span>
                           );
                        })()}
                    </div>
                        <div className="text-xs text-slate-600 dark:text-white/60 flex items-center gap-2 mt-0.5">
                          <span className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-amber-300">
                            {getTimeControlLabel(c.config.timeMode)}
                          </span>
                          <span className="truncate">
                            {c.config.boardType === 'puzzle' ? t('notifications.challenges.puzzle') : t('notifications.challenges.standard')}
                          </span>
                        </div>
                        {c.config.message && (
                          <div className="mt-1.5 text-xs text-blue-200/90 italic border-l-2 border-blue-500/30 pl-2">
                            "{c.config.message}"
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.status === 'accepted' && (
                             <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
                               {t('notifications.challenges.accepted')}
                             </span>
                          )}
                          {c.status === 'declined' && (
                             <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                               {t('notifications.challenges.declined')}
                             </span>
                          )}
                          {c.status === 'canceled' && (
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded border border-black/5 dark:border-white/5">
                               {t('notifications.challenges.canceled')}
                             </span>
                          )}
                          {c.status === 'wait' && (
                             <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                               {c.direction === 'outgoing' ? t('notifications.challenges.waitOpponent') : t('notifications.challenges.waitYou')}
                             </span>
                          )}
                        </div>
                      <div className="flex gap-2 justify-end pl-12 mt-1">
                        {(c.status === 'pending' || c.status === 'wait') ? (
                          c.direction === 'incoming' ? (
                          <>
                            <button
                              onClick={() => handleReply(c.id, 'accept')}
                              disabled={inGame}
                              title={inGame ? t('notifications.challenges.inGameTooltip') : ""}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                                inGame
                                  ? 'bg-slate-500/20 text-slate-500 cursor-not-allowed opacity-50'
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              }`}
                            >
                              {t('notifications.challenges.acceptAction')}
                            </button>
                            <button
                              onClick={() => handleReply(c.id, 'wait')}
                              className="px-3 py-1 bg-black/20 dark:bg-white/20 text-slate-900 dark:text-white rounded-md text-xs font-bold hover:bg-black/30 dark:bg-white/30 transition-colors"
                            >
                              {t('notifications.challenges.waitAction')}
                            </button>
                            <button
                              onClick={() => handleReply(c.id, 'decline')}
                              className="px-3 py-1 bg-red-500/20 text-red-500 rounded-md text-xs font-bold hover:bg-red-500/30 transition-colors"
                            >
                              {t('common.reject')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleCancel(c.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded-md text-xs font-bold hover:bg-red-500/30 transition-colors"
                          >
                            {t('notifications.challenges.cancelAction')}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => removeChallenge(c.id)}
                          className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:text-slate-800 dark:text-white/70 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                          {t('notifications.challenges.deleteAction')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../net/socket';
import { useAuth } from '../auth/AuthContext';
import { useToast } from './ui/Toast';
import { MatchConfigurationModal } from './MatchConfigurationModal';
import { useChallengeContext, type PendingChallenge } from './ChallengeContext';
import { useOnlinePlayers, resolveStatusBadge } from '../hooks/useOnlinePlayers';
import type { PlayerInfo } from '../hooks/useOnlinePlayers';
import { showBrowserNotification } from '../utils/browserNotify';
import { logger } from '../utils/logger';
import { useTranslation } from 'react-i18next';

const ChallengeToastContent = ({ pc }: { pc: PendingChallenge }) => {
  const { t } = useTranslation();
  const { onlinePlayers } = useOnlinePlayers();
  const pInfo = onlinePlayers.find(p => String(p.uid).toLowerCase() === String(pc.senderUid).toLowerCase());
  const badge = pInfo ? resolveStatusBadge(pInfo) : { label: t('common.offline'), color: 'text-slate-500' };

  const typeLabel = pc.config.boardType === 'puzzle' ? t('match.config.puzzle') : t('match.config.standard');

  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-black/10 dark:border-white/10 overflow-hidden">
        {pc.senderPicture ? (
           <img src={pc.senderPicture} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
        ) : (
           <span className="text-sm font-bold text-slate-900 dark:text-white">{pc.senderName?.[0] || '?'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <strong className="text-sm font-bold truncate max-w-[120px]">{pc.senderName}</strong>
          <span className={`text-[10px] font-bold ${badge.color} bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-sm flex-shrink-0`}>
            {badge.label}
          </span>
        </div>
        <div className="text-xs text-slate-800 dark:text-white/80 mt-0.5">
          {t('match.config.inviteDesc', { type: typeLabel, time: pc.config.timeMode })}
        </div>
        {pc.config.message && (
          <div className="mt-1.5 text-xs text-blue-200/90 italic border-l-2 border-blue-500/30 pl-2">
            "{pc.config.message}"
          </div>
        )}
      </div>
    </div>
  );
};

interface AcceptedGame {
  roomId: string;
  challengeId: string;
}

export function ChallengeManager() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { pendingChallenges, addChallenge, updateChallengeStatus, resolveChallenge } = useChallengeContext();
  const navigate = useNavigate();
  const toast = useToast();
  const { onlinePlayers } = useOnlinePlayers();
  const onlinePlayersRef = useRef(onlinePlayers);
  useEffect(() => {
    onlinePlayersRef.current = onlinePlayers;
  }, [onlinePlayers]);

  // Send State
  const [challengeTarget, setChallengeTarget] = useState<PlayerInfo | null>(null);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const [activePuzzleName, setActivePuzzleName] = useState<string | null>(null);
  const [forceOpen, setForceOpen] = useState(false);

  // Accepted Game State
  const [acceptedGame, setAcceptedGame] = useState<AcceptedGame | null>(null);

  useEffect(() => {
    // Listen for custom event to open the sender modal
    const handleOpenSender = (e: any) => {
      const { uid, name, picture, customStatus, activityStatus, setupId, puzzleName, forceOpen: fo } = e.detail;
      
      setForceOpen(!!fo);
      setActiveSetupId(setupId || null);
      setActivePuzzleName(puzzleName || null);

      if (uid && uid !== authState.user?.uid) {
        setChallengeTarget({ 
           uid, 
           name, 
           picture, 
           customStatus: customStatus || 'online', 
           activityStatus: activityStatus || 'idle',
           online: true,
           elo: 1200,
           gamesPlayed: 0
        } as any);
      } else {
        setChallengeTarget(null);
        // If no UID is provided, we might just be opening "Create Table" or "Challenge Puzzle (Open)"
        // But we need a way to tell the modal to open even if there's no targetUser.
        // I'll add a dummy state or just use a boolean for "forceOpen".
      }
    };
    window.addEventListener('open-challenge-modal', handleOpenSender);

    return () => {
      window.removeEventListener('open-challenge-modal', handleOpenSender);
    };
  }, [authState.user?.uid]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !authState.user?.uid) return;

    // Incoming challenge
    const handleReceived = (challenge: any) => {
      const pc: PendingChallenge = { ...challenge, direction: 'incoming' };
      addChallenge(pc);

      const currentUserPresence = onlinePlayersRef.current.find((p: any) => String(p.uid) === String(authState.user?.uid));
      const isActuallyPlaying = currentUserPresence ? currentUserPresence.activityStatus === 'playing' : false;
      const inGame = window.location.pathname.startsWith('/game/') && isActuallyPlaying;
      
      const isSenderOnline = onlinePlayersRef.current.some((p: any) => String(p.uid).toLowerCase() === String(pc.senderUid).toLowerCase());

      console.log(`[TOAST] New Challenge Received!`, {
        pc_id: pc.id,
        senderUid: pc.senderUid,
        inGame,
        isActuallyPlaying,
        isSenderOnline,
        onlinePlayers_count: onlinePlayersRef.current.length
      });

      // Toast (in-app)
      toast.info(
        <ChallengeToastContent pc={pc} />,
        { 
          duration: 15000,
          actions: [
            {
              label: t('notifications.challenges.acceptAction'),
              variant: 'primary',
              disabled: inGame,
              onClick: () => handleReply(pc.id, 'accept')
            },
            {
              label: t('notifications.challenges.waitAction'),
              variant: 'secondary',
              onClick: () => handleReply(pc.id, 'wait')
            },
            {
              label: t('common.reject'),
              variant: 'danger',
              onClick: () => handleReply(pc.id, 'decline')
            }
          ]
        }
      );

      // Browser notification when tab is hidden
      showBrowserNotification(t('match.config.challengeInvite', { name: pc.senderName }), {
        body: t('match.config.inviteDesc', { 
           type: pc.config.boardType === 'puzzle' ? t('match.config.puzzle') : t('match.config.standard'), 
           time: pc.config.timeMode 
        }) + (pc.config.message ? ' — ' + pc.config.message : ''),
        url: '/',
      });

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {
        logger.error('Challenge audio notification failed', e);
      }
    };

    // Sender receives status updates (decline, wait)
    const handleStatus = ({ challengeId, status, targetName, challenge, isBusyTarget }: any) => {
      if (status === 'decline' || status === 'declined') {
        resolveChallenge(challengeId, 'declined');
        toast.error(t('match.config.status.declined', { name: targetName || 'Đối thủ' }));
      } else if (status === 'wait') {
        updateChallengeStatus(challengeId, 'wait');
        toast.info(t('match.config.status.wait', { name: targetName || 'Đối thủ' }));
      } else if (status === 'accept' || status === 'accepted') {
        resolveChallenge(challengeId, 'accepted');
      } else if (status === 'sent') {
        if (challenge) addChallenge({ ...challenge, direction: 'outgoing' });
        if (isBusyTarget) {
          toast.info(t('match.config.status.busy', { name: targetName || 'Đối thủ' }));
        } else {
          toast.success(t('match.config.status.sent', { name: targetName || 'đối thủ' }));
        }
      }
    };

    // Both receive accepted event
    const handleAccepted = ({ challengeId, roomId }: { challengeId: string, roomId: string }) => {
      resolveChallenge(challengeId, 'accepted');
      setAcceptedGame({ roomId, challengeId });
      toast.success(t('match.config.status.accepted'), { duration: 5000 });
    };

    // Canceled by sender
    const handleCanceled = ({ challengeId }: { challengeId: string }) => {
      resolveChallenge(challengeId, 'canceled');
      toast.info(t('match.config.status.canceled'));
    };

    const handleError = ({ message }: { message: string }) => {
      toast.error(message);
    };

    const handleSync = (challenges: any[]) => {
      challenges.forEach(challenge => {
        const direction = challenge.senderUid === authState.user?.uid ? 'outgoing' : 'incoming';
        addChallenge({ ...challenge, direction });
      });
    };

    const handleGiftReceived = ({ fromName, itemId, quantity }: any) => {
      const GIFT_ITEMS_MAP: Record<string, string> = {
        ring: t('match.config.gifts.ring'),
        bear: t('match.config.gifts.bear'),
        candy: t('match.config.gifts.candy'),
      };
      const itemName = GIFT_ITEMS_MAP[itemId] || itemId;
      toast.success(
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-sm font-bold">{t('match.config.gifts.received', { name: fromName })}</div>
            <div className="text-xs text-slate-800 dark:text-white/70">{t('match.config.toasts.giftReceivedDesc', { count: quantity, item: itemName })}</div>
          </div>
        </div>,
        { duration: 8000 }
      );
    };

    const handleCoinReceived = ({ fromName, amount }: any) => {
      toast.success(
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div>
            <div className="text-sm font-bold">{t('match.config.gifts.coins', { name: fromName })}</div>
            <div className="text-xs text-amber-400 font-black">{t('match.config.gifts.coinsDesc', { amount })}</div>
          </div>
        </div>,
        { duration: 8000 }
      );
    };

    socket.on('challenge:received', handleReceived);
    socket.on('challenge:status', handleStatus);
    socket.on('challenge:accepted', handleAccepted);
    socket.on('challenge:canceled', handleCanceled);
    socket.on('challenge:error', handleError);
    socket.on('challenge:sync', handleSync);
    socket.on('gift:received', handleGiftReceived);
    socket.on('coin:received', handleCoinReceived);

    return () => {
      socket.off('challenge:received', handleReceived);
      socket.off('challenge:status', handleStatus);
      socket.off('challenge:accepted', handleAccepted);
      socket.off('challenge:canceled', handleCanceled);
      socket.off('challenge:error', handleError);
      socket.off('challenge:sync', handleSync);
      socket.off('gift:received', handleGiftReceived);
      socket.off('coin:received', handleCoinReceived);
    };
  }, [authState.user?.uid, toast]);


  // Handle replying to incoming
  const handleReply = (challengeId: string, status: 'accept' | 'decline' | 'wait') => {
    const socket = getSocket();
    if (status === 'accept') {
       const pc = pendingChallenges.find(c => c.id === challengeId);
       if (pc && pc.direction === 'incoming') {
         const isSenderOnline = onlinePlayersRef.current.some((p: any) => String(p.uid).toLowerCase() === String(pc.senderUid).toLowerCase());
         if (!isSenderOnline) {
           toast.error(t('match.config.status.offline'));
           return;
         }
       }
    }
    socket.emit('challenge:reply', { challengeId, status });
  };

  // Render Accepted Modal
  const renderAcceptedModal = () => {
    if (!acceptedGame) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white dark:bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-sm rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] animate-in zoom-in-95 duration-200 border border-xq-gold/30"
             style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' }}>
          
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-6 bg-gradient-to-tr from-xq-gold via-yellow-300 to-xq-gold rounded-full flex items-center justify-center shadow-2xl shadow-xq-gold/40 animate-pulse">
              <span className="text-4xl">⚔️</span>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{t('match.config.ready.title')}</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-white/50 mb-8 px-4">
              {t('match.config.ready.desc')}
            </p>

            <button 
              onClick={() => {
                navigate(`/game/${acceptedGame.roomId}`);
                setAcceptedGame(null);
              }} 
              className="w-full py-4 rounded-2xl text-slate-900 font-black tracking-widest uppercase transition-all shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_4px_30px_rgba(212,175,55,0.6)] hover:-translate-y-1 text-lg mb-3"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5d060 50%, #d4af37 100%)' }}
            >
              {t('match.config.ready.action')}
            </button>
            <button
               onClick={() => setAcceptedGame(null)}
               className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 hover:text-slate-600 dark:text-white/60 transition-colors"
            >
               {t('match.config.ready.hide')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <MatchConfigurationModal 
        isOpen={!!challengeTarget || !!activeSetupId || forceOpen || !!(window as any).forceOpenMatchModal} 
        onClose={() => {
          setChallengeTarget(null);
          setActiveSetupId(null);
          setActivePuzzleName(null);
          setForceOpen(false);
          (window as any).forceOpenMatchModal = false;
        }} 
        targetUser={challengeTarget} 
        setupId={activeSetupId}
        puzzleName={activePuzzleName}
      />
      {renderAcceptedModal()}
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../auth/auth';
import { logger } from '../utils/logger';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from 'react-i18next';

export interface EnrichedMatch {
  _id: string;
  tournamentRound: number;
  status: string;
  state: {
    players: { red: { uid: string }; black: { uid: string } };
    isGameOver: boolean;
    winner: string | null;
    finished?: boolean;
    board?: any;
  };
  playerUids?: { red: string; black: string };
  redName?: string;
  blackName?: string;
  createdAt: number;
}

export function useTournamentDetail(id?: string) {
  const toast = useToast();
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<any | null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcing, setAnnouncing] = useState(false);
  const [shopGifts, setShopGifts] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/tournaments/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setTournament(data.tournament);
        setMatches(data.matches || []);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch(`${API_URL}/gifts/list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setShopGifts(data.gifts || {});
      })
      .catch(err => logger.error('Fetch gifts failed', err));
  }, []);

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true); setJoinMsg('');
    try {
      const res = await fetch(`${API_URL}/tournaments/${id}/join`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        if (data.pending) setJoinMsg(t('tournaments.detail.messages.joinPending'));
        else setJoinMsg(t('tournaments.detail.messages.joinSuccess'));
        load();
      } else {
        const msgs: Record<string, string> = {
          REGISTRATION_CLOSED: t('tournaments.detail.errors.joinClosed'),
          TOURNAMENT_FULL: t('tournaments.detail.errors.joinFull'),
          ELO_TOO_LOW: `🚫 ${data.detail}`,
          ELO_TOO_HIGH: `🚫 ${data.detail}`,
          NOT_IN_REGISTRATION: t('tournaments.detail.errors.joinNotRegistration'),
        };
        setJoinMsg(msgs[data.error] || `❌ ${data.error}`);
      }
    } catch (e) { setJoinMsg(t('tournaments.detail.errors.joinFailed')); }
    finally { setJoining(false); }
  };

  const handleStartRound = async () => {
    if (!id) return;
    const res = await fetch(`${API_URL}/admin/tournaments/${id}/start-round`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.ok) {
      const byeMsg = data.byePlayer ? t('tournaments.detail.messages.bye', { name: data.byePlayer }) : '';
      toast.success(t('tournaments.detail.messages.roundStarted', { round: data.roundStarted, count: data.pairsCount, bye: byeMsg }));
      load();
    } else {
      const msgs: Record<string, string> = {
        MAX_ROUNDS_REACHED: t('tournaments.detail.errors.maxRounds', { count: data.maxRounds }),
        NOT_ENOUGH_PLAYERS: t('tournaments.detail.errors.notEnoughPlayers'),
        TOURNAMENT_FINISHED: t('tournaments.detail.errors.alreadyFinished'),
      };
      toast.error('❌ ' + (msgs[data.error] || data.error));
    }
  };

  const handleFinish = async () => {
    if (!id) return;
    
    toast.warning(t('tournaments.detail.messages.confirmFinish'), {
      duration: 0,
      actions: [
        { label: t('common.cancel'), onClick: () => {}, variant: 'secondary' },
        { 
          label: t('tournaments.detail.messages.confirm'), 
          variant: 'danger',
          onClick: async () => {
            const res = await fetch(`${API_URL}/admin/tournaments/${id}/finish`, { method: 'POST', credentials: 'include' });
            const data = await res.json();
            if (data.ok) {
              toast.success(t('tournaments.detail.messages.tournamentFinished', { name: data.champion?.name ?? '---' }));
              load();
            } else {
              toast.error(t('tournaments.detail.errors.finishError'));
            }
          } 
        }
      ]
    });
  };

  const handleAnnounce = async (message: string) => {
    if (!id || !message.trim()) return;
    setAnnouncing(true);
    const res = await fetch(`${API_URL}/admin/tournaments/${id}/announce`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (data.ok) { setAnnouncement(''); load(); }
    setAnnouncing(false);
  };

  const handleApprove = async (uid: string) => {
    if (!id) return;
    await fetch(`${API_URL}/admin/tournaments/${id}/approve/${uid}`, { method: 'POST', credentials: 'include' });
    load();
  };

  const handleReject = async (uid: string) => {
    if (!id) return;
    await fetch(`${API_URL}/admin/tournaments/${id}/pending/${uid}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return {
    tournament,
    matches,
    loading,
    joining,
    joinMsg,
    announcement,
    setAnnouncement,
    announcing,
    shopGifts,
    handleJoin,
    handleStartRound,
    handleFinish,
    handleAnnounce,
    handleApprove,
    handleReject,
    load
  };
}

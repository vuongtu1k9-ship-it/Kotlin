import { useMemo, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';
import { useToast } from '../components/ui/Toast';
import { useLobbyData } from '../hooks/useLobbyData';
import { ActiveGameBanner } from '../components/lobby/ActiveGameBanner';
import { OnlinePlayersCard } from '../components/lobby/OnlinePlayersCard';
import { RoomListSection } from '../components/lobby/RoomListSection';
import { LobbySeoSection } from '../components/lobby/LobbySeoSection';
import { SocialFollowCard } from '../components/lobby/SocialFollowCard';
import { VideoHighlightCard } from '../components/VideoHighlightCard';

import { SEO } from '../components/SEO';

export function LobbyPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { onlinePlayers } = useOnlinePlayers();
  const { error: toastError } = useToast();
  const lastInteractionTime = useRef(0);

  const {
    rooms,
    filteredRooms,
    recentPuzzles,
    tab,
    setTab,
    activeRoomId,
    isInitialLoad,
    doJoin
  } = useLobbyData(authState);

  const visiblePlayers = useMemo(() => {
    return [...onlinePlayers].sort((a, b) => {
      if (a.customStatus === 'free' && b.customStatus !== 'free') return -1;
      if (a.customStatus !== 'free' && b.customStatus === 'free') return 1;
      return 0;
    });
  }, [onlinePlayers]);

  const handleCreateRoomClick = () => {
    window.dispatchEvent(new CustomEvent('open-challenge-modal', { detail: { forceOpen: true } }));
  };

  return (
    <div className="space-y-4">
      <SEO
        title={t('lobby.seo.meta.title')}
        description={t('lobby.seo.meta.description')}
      />
      <div className="px-4 py-2">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
           {t('lobby.headerTitlePrefix')} <span className="text-blue-600 dark:text-[var(--cobalt-indigo)]">{t('lobby.headerTitleHighlight')}</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.3em] mt-1">
          {t('lobby.headerSubtitle')}
        </p>
      </div>

      {activeRoomId && (
        <ActiveGameBanner activeRoomId={activeRoomId} onJoin={(id) => window.location.assign(`/game/${id}`)} />
      )}

      <div className="min-h-[240px]">
        <OnlinePlayersCard 
          visiblePlayers={visiblePlayers} 
          authState={authState} 
          toastError={toastError}
          lastInteractionTime={lastInteractionTime as any}
        />
      </div>


      <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
        <RoomListSection 
          rooms={rooms}
          filtered={filteredRooms}
          tab={tab}
          setTab={setTab}
          onJoin={doJoin}
          onCreateRoom={handleCreateRoomClick}
        />
      </div>

      <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}>
        <LobbySeoSection 
          recentPuzzles={recentPuzzles}
          isInitialLoad={isInitialLoad}
        />
      </div>

      <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
        <SocialFollowCard />
      </div>

      <div className="py-4">
        <VideoHighlightCard />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { EntityComments } from '../components/EntityComments';
import { SEO } from '../components/SEO';
import { TournamentHero } from '../components/tournament/TournamentHero';
import { TournamentTimeline } from '../components/tournament/TournamentTimeline';
import { TournamentStandings } from '../components/tournament/TournamentStandings';
import { TournamentPlayers } from '../components/tournament/TournamentPlayers';
import { TournamentPrizes } from '../components/tournament/TournamentPrizes';
import { TournamentAnnouncements } from '../components/tournament/TournamentAnnouncements';
import { useTournamentDetail, EnrichedMatch } from '../hooks/useTournamentDetail';
import { getSiteOrigin, getAbsoluteUrl } from '../utils/url';



export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'timeline' | 'standings' | 'players' | 'prizes' | 'announcements'>('timeline');

  const {
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
    handleReject
  } = useTournamentDetail(id);

  const isAdmin = authState.user?.sysRole === 'admin' || authState.user?.sysRole === 'moderator';

  if (loading) return <div className="text-center py-20 text-slate-600 dark:text-white/50 animate-pulse">{t('common.loading')}</div>;
  if (!tournament) return <div className="text-center py-20 text-red-400">{t('tournaments.detail.notFound')}</div>;

  const myAlreadyJoined = !!authState.user && tournament.players.includes(authState.user.uid);
  const myPending = !!authState.user && tournament.pendingPlayers?.includes(authState.user.uid);
  
  const parseDate = (d?: string | null) => {
    if (!d) return null;
    const p = new Date(d);
    if (!isNaN(p.getTime())) return p;
    const iso = d.replace(' ', 'T');
    const pIso = new Date(iso);
    return isNaN(pIso.getTime()) ? null : pIso;
  };
  const deadlineDt = parseDate(tournament.registrationDeadline);
  const deadlinePassed = !!deadlineDt && Date.now() > deadlineDt.getTime();
  const hasPrizes = tournament.prizes && tournament.prizes.length > 0;

  const roundGroups = matches.reduce<Record<number, EnrichedMatch[]>>((acc, m) => {
    const r = m.tournamentRound ?? 0;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  const tabClass = (t: string) =>
    `px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === t ? 'bg-indigo-600 dark:bg-xq-gold text-slate-900 dark:text-black shadow-lg shadow-indigo-600/20 dark:shadow-xq-gold/20' : 'text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`;

  const getTournamentJsonLd = () => {
    if (!tournament) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": tournament.name,
      "description": tournament.description,
      "startDate": tournament.startDate,
      "endDate": tournament.endDate,
      "eventStatus": tournament.status === 'registration' ? "https://schema.org/EventScheduled" : 
                    tournament.status === 'active' ? "https://schema.org/EventMovedOnline" : 
                    "https://schema.org/EventPostponed",
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "location": {
        "@type": "VirtualLocation",
        "url": getAbsoluteUrl(`/tournaments/${id}`)
      },
      "organizer": {
        "@type": "Organization",
        "name": `${t('navbar.brand')} ${t('navbar.online')}`,
        "url": getSiteOrigin()
      }
    };
  };

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10">
      <SEO 
        title={t('tournaments.detail.meta.title', { name: tournament.name })}
        description={t('tournaments.detail.meta.description', { name: tournament.name })}
        url={getAbsoluteUrl(`/tournaments/${id}`)}
        type="article"
        jsonLd={getTournamentJsonLd()}
      />

      {tournament.champion && (() => {
        const c = tournament.champion!;
        const champ = tournament.standings?.find((s: any) => s.uid === c.uid);
        const name = champ?.name || c.name || c.uid;
        const pic = champ?.picture || null;
        
        return (
          <div className="mb-10 p-10 rounded-[2.5rem] bg-gradient-to-br from-yellow-500/25 via-amber-600/10 to-transparent border border-yellow-500/30 text-center relative overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="absolute top-[-20px] right-[-20px] opacity-5 text-9xl rotate-12 select-none">🏆</div>
            <div className="absolute bottom-[-10px] left-[-10px] opacity-5 text-8xl -rotate-12 select-none">🏅</div>
            <div className="flex flex-col items-center relative z-10">
              <div className="relative mb-6">
                {pic ? <img src={pic} className="w-28 h-28 rounded-full border-4 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)] object-cover" /> : <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-4 border-yellow-500/30 flex items-center justify-center text-5xl shadow-inner">👑</div>}
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-black font-black">1</div>
              </div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500 uppercase tracking-tighter mb-3 drop-shadow-sm">{name}</div>
              <div className="flex items-center gap-3">
                <span className="bg-yellow-500 text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">{t('tournaments.detail.champion.title')}</span>
                <div className="h-4 w-px bg-black/20 dark:bg-white/20" />
                <div className="h-4 w-px bg-black/20 dark:bg-white/20" />
                <span className="text-yellow-200/80 font-bold text-lg">{tournament.champion.points} <span className="text-xs opacity-60 font-normal">{t('tournaments.detail.champion.points')}</span></span>
                {champ?.elo && <><div className="h-4 w-px bg-black/20 dark:bg-white/20" /><span className="text-slate-600 dark:text-white/60 text-sm">{t('tournaments.detail.champion.elo')}: <span className="text-slate-900 dark:text-white font-bold">{champ.elo}</span></span></>}
              </div>
            </div>
          </div>
        );
      })()}

      <TournamentHero
        tournament={tournament}
        isAdmin={isAdmin}
        authState={authState}
        myAlreadyJoined={myAlreadyJoined}
        myPending={myPending}
        deadlinePassed={deadlinePassed}
        onJoin={handleJoin}
        joining={joining}
      />

      <div className="flex flex-wrap gap-3 mb-8">
        {!isAdmin && authState.user && tournament.status === 'registration' && !myAlreadyJoined && !myPending && !deadlinePassed && (
          <button onClick={handleJoin} disabled={joining} className="bg-gradient-to-r from-xq-gold to-yellow-500 text-black px-6 py-2.5 rounded-xl font-black text-sm hover:opacity-90 disabled:opacity-50">{joining ? '...' : t('tournaments.detail.actions.join')}</button>
        )}
        {myAlreadyJoined && <span className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-bold border border-green-500/30">{t('tournaments.detail.actions.joined')}</span>}
        {myPending && <span className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-bold border border-orange-500/30">{t('tournaments.detail.actions.pending')}</span>}
        {joinMsg && <span className="text-sm px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/80">{joinMsg}</span>}
        {isAdmin && (
          <>
            {tournament.status !== 'finished' && <button onClick={handleStartRound} className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-bold text-sm">{t('tournaments.detail.actions.createRound', { round: (tournament.currentRound || 0) + 1 })}</button>}
            {tournament.status !== 'finished' && <button onClick={handleFinish} className="bg-red-700 hover:bg-red-600 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-bold text-sm">{t('tournaments.detail.actions.finishTournament')}</button>}
          </>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl mb-6 overflow-x-auto flex-nowrap">
        <button className={tabClass('timeline')} onClick={() => setActiveTab('timeline')}>{t('tournaments.detail.tabs.timeline')}</button>
        <button className={tabClass('standings')} onClick={() => setActiveTab('standings')}>{t('tournaments.detail.tabs.standings')}</button>
        <button className={tabClass('players')} onClick={() => setActiveTab('players')}>{t('tournaments.detail.tabs.players')}</button>
        {hasPrizes && <button className={tabClass('prizes')} onClick={() => setActiveTab('prizes')}>{t('tournaments.detail.tabs.prizes')}</button>}
        <button className={tabClass('announcements')} onClick={() => setActiveTab('announcements')}>{t('tournaments.detail.tabs.announcements')} {(tournament.announcements?.length ?? 0) > 0 && <span className="ml-1 text-xq-gold">{tournament.announcements!.length}</span>}</button>
      </div>

      {activeTab === 'timeline' && <TournamentTimeline roundGroups={roundGroups} isAdmin={isAdmin} authState={authState} tournament={tournament} />}
      {activeTab === 'standings' && <TournamentStandings standings={tournament.standings} />}
      {activeTab === 'players' && <TournamentPlayers tournament={tournament} isAdmin={isAdmin} onApprove={handleApprove} onReject={handleReject} />}
      {activeTab === 'prizes' && hasPrizes && <TournamentPrizes tournament={tournament} shopGifts={shopGifts} />}
      {activeTab === 'announcements' && <TournamentAnnouncements tournament={tournament} isAdmin={isAdmin} announcement={announcement} setAnnouncement={setAnnouncement} announcing={announcing} onAnnounce={(e) => { e.preventDefault(); handleAnnounce(announcement); }} />}

      {id && <EntityComments entityType="tournament" entityId={String(id)} />}
    </div>
  );
}

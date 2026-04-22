import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { apiGet, apiPost } from '../api';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { getEloRank } from '../utils/eloRanks';
import { getAbsoluteUrl, getSiteOrigin } from '../utils/url';
import { MiniBoard } from '../components/MiniBoard';
import { extractIdFromSlug, makeSlug } from '../utils/slug';
import { SEO } from '../components/SEO';
import { useToast } from '../components/ui/Toast';
import { logger } from '../utils/logger';

type MyStats = {
  ok: true;
  user: { uid: string; name?: string; picture?: string | null };
  elo: number;
  gamesPlayed: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  inventory?: Record<string, number>;
};

type GameRow = {
  gameId: string;
  roomId?: string;
  timeMode?: string;
  status: string;
  finished: boolean;
  winner: 'red' | 'black' | null;
  players?: { redName?: string; blackName?: string; red?: { name?: string }; black?: { name?: string } };
  thumbBoard?: any;
  board?: any;
  thumbPosition?: string[];
  position?: string[];
};

type TournamentResult = {
  id: string;
  name: string;
  rank: number | null;
  points: number;
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  const { slug, uid: pathUidLegacy } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resolvedUid = extractIdFromSlug(slug) || pathUidLegacy || searchParams.get('uid');
  const profileId = resolvedUid ?? null;
  const isMe = profileId && currentUser?.uid && profileId === currentUser.uid;

  const [stats, setStats] = useState<MyStats | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [followersList, setFollowersList] = useState<any[]>([]);

  // Inventory & Puzzles State
  const [shopGifts, setShopGifts] = useState<Record<string, { id: string; name: string; icon: string }>>({});
  const [myPuzzles, setMyPuzzles] = useState<any[]>([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState<any[]>([]);
  const [tourResults, setTourResults] = useState<TournamentResult[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { error: toastError } = useToast();
  const settings = useSiteSettings();
  const [isFollowing, setIsFollowing] = useState(false);

  const correctSlug = useMemo(() => stats?.user ? makeSlug(stats.user.name || '', stats.user.uid) : '', [stats?.user]);
  const canonicalUrl = useMemo(() => correctSlug ? getAbsoluteUrl(`/player/${correctSlug}`) : undefined, [correctSlug]);

  // SEO Redirect
  useEffect(() => {
    if (stats?.user && slug && correctSlug) {
      if (slug !== correctSlug) {
        navigate(`/player/${correctSlug}`, { replace: true });
      }
    }
  }, [stats?.user, slug, correctSlug, navigate]);

  // Fetch Data
  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    
    Promise.allSettled([
      apiGet(`/users/${encodeURIComponent(profileId)}/summary`, authState.token),
      apiGet(`/users/${encodeURIComponent(profileId)}/games?limit=32`, authState.token),
      apiGet(`/users/${encodeURIComponent(profileId)}/following`, authState.token),
      apiGet(`/users/${encodeURIComponent(profileId)}/followers`, authState.token),
      apiGet(`/tournaments/users/${encodeURIComponent(profileId)}/tournaments`, authState.token),
      apiGet('/gifts/list', authState.token),
      apiGet(`/setups/public?creatorUid=${profileId}&limit=12`, authState.token),
      apiGet(`/users/${profileId}/solves`, authState.token)
    ]).then(([sum, gms, fing, fers, tours, gifts, puz, solved]) => {
      if (sum.status === 'fulfilled' && sum.value.ok) {
        setStats(sum.value as MyStats);
        setIsFollowing(sum.value.isFollowing || false);
      }
      if (gms.status === 'fulfilled' && gms.value.ok) setGames(gms.value.games || []);
      if (fing.status === 'fulfilled' && fing.value.ok) setFollowingList(fing.value.following || []);
      if (fers.status === 'fulfilled' && fers.value.ok) setFollowersList(fers.value.followers || []);
      if (tours.status === 'fulfilled' && tours.value.ok) setTourResults(tours.value.tournaments || []);
      if (gifts.status === 'fulfilled' && gifts.value.ok) setShopGifts(gifts.value.gifts || {});
      if (puz.status === 'fulfilled' && puz.value.ok) setMyPuzzles(puz.value.setups || []);
      if (solved.status === 'fulfilled' && solved.value.ok) setSolvedPuzzles(solved.value.solves || []);
      setLoading(false);
    });
  }, [profileId, authState.token]);

  const handleToggleFollow = async () => {
    if (!profileId || isMe || !currentUser) return;
    try {
      const res = await apiPost(`/users/follow/${encodeURIComponent(profileId)}`, {}, authState.token);
      if (res.ok) {
        setIsFollowing(res.isFollowing);
        setStats(prev => prev ? { 
          ...prev, 
          isFollowing: res.isFollowing, 
          followersCount: (prev.followersCount || 0) + (res.isFollowing ? 1 : -1) 
        } : null);
      }
    } catch (e) {
      logger.debug('Toggle follow failed', e);
    }
  };

  const displayUser = stats?.user || null;

  const resultLabel = (g: GameRow) => {
    if (!g.finished) return { text: t('profile.game.active'), color: 'text-emerald-400' };
    if (!g.winner) return { text: t('common.draw'), color: 'text-slate-600 dark:text-white/50' };
    return g.winner === 'red' ? { text: t('profile.game.redWin'), color: 'text-red-400' } : { text: t('profile.game.blackWin'), color: 'text-slate-800 dark:text-white/70' };
  };

  const medalIcon = (rank: number | null) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🎖️';
  };

  const profileJsonLd = useMemo(() => {
    if (!displayUser) return undefined;
    const rank = stats?.elo ? getEloRank(stats.elo, settings['elo.ranks']) : null;
    return {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": displayUser.name,
        "identifier": displayUser.uid,
        "description": t('profile.meta.schemaDesc', { rank: rank?.title || '', elo: stats?.elo || 1200 }),
        "image": displayUser.picture || undefined,
        "url": canonicalUrl || window.location.href,
        "interactionStatistic": [
          {
            "@type": "InteractionCounter",
            "interactionType": "https://schema.org/FollowAction",
            "userInteractionCount": stats?.followersCount || 0
          }
        ]
      }
    };
  }, [displayUser, stats, settings, canonicalUrl, t]);

  const breadcrumbJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": t('navbar.home'),
        "item": getSiteOrigin()
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t('navbar.players'),
        "item": getAbsoluteUrl('/players')
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": displayUser?.name || profileId,
        "item": canonicalUrl || window.location.href
      }
    ]
  }), [t, displayUser, profileId, canonicalUrl]);

  if (!profileId) return <div className="p-20 text-center text-slate-400 dark:text-white/20 uppercase font-black tracking-widest">{t('profile.notFound')}</div>;

  const rankInfo = stats?.elo ? getEloRank(stats.elo, settings['elo.ranks']) : null;

  return (
    <div className={`mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10 animate-in fade-in duration-700 ${loading ? 'opacity-50' : ''}`}>
      <SEO 
        title={t('profile.meta.title', { name: displayUser?.name || '...' })}
        description={t('profile.meta.description', { name: displayUser?.name || '' })}
        canonical={canonicalUrl}
        jsonLd={[profileJsonLd, breadcrumbJsonLd]}
      />

      {/* 🚀 PUBLIC HEADER */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-3xl p-8 md:p-12 shadow-2xl">
         <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
         <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-xq-gold/5 rounded-full blur-[120px]" />

         <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-xq-gold to-blue-500 rounded-full blur-2xl opacity-20" />
               {displayUser?.picture ? (
                 <img src={displayUser.picture} className="h-32 w-32 rounded-[42px] border-4 border-black/5 dark:border-white/5 relative z-10 object-cover shadow-2xl" alt="avatar" />
               ) : (
                 <div className="h-32 w-32 rounded-[42px] bg-slate-100 dark:bg-white/5 border-4 border-black/5 dark:border-white/5 flex items-center justify-center text-5xl relative z-10">👤</div>
               )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
               <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-widest leading-none">
                    {displayUser?.name || t('tournaments.loading')}
                  </h1>
                  {stats?.elo && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 dark:bg-xq-gold text-white dark:text-black text-[12px] font-black uppercase tracking-widest shadow-xl">
                       <span>{getEloRank(stats.elo, settings['elo.ranks']).icon} {stats.elo}</span>
                       <span className="opacity-40">|</span>
                       <span>{t(getEloRank(stats.elo, settings['elo.ranks']).title)}</span>
                    </div>
                  )}
               </div>
               
               <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-xs font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest">
                  <div><span className="text-rose-400 text-lg">❤️</span> {stats?.followersCount || 0} {t('profile.followers')}</div>
                  <div><span className="text-blue-400 text-lg">⚔️</span> {stats?.gamesPlayed || 0} {t('profile.games')}</div>
               </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 min-w-[200px]">
               {isMe ? (
                  <Link to="/settings" className="px-8 py-3 rounded-2xl bg-blue-600 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">🏠 {t('profile.manage')}</Link>
               ) : (
                  currentUser && (
                    <div className="flex flex-wrap justify-center md:justify-end gap-2">
                      <button 
                        onClick={() => {
                          if (!authState.user || authState.user.provider === 'guest') {
                            toastError(t('profile.gifts.loginPrivate'));
                            return;
                          }
                          window.dispatchEvent(new CustomEvent('open-private-chat', { detail: stats?.user }));
                        }}
                        className="h-11 px-6 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-black rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                      >
                        💬 {t('profile.message')}
                      </button>
                      <button onClick={handleToggleFollow} className="h-11 px-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:bg-white/10 active:scale-95 transition-all">
                         {isFollowing ? t('profile.unfollow') : `🤝 ${t('profile.follow')}`}
                      </button>
                      <button 
                        onClick={() => {
                          if (!authState.user || authState.user.provider === 'guest') {
                            toastError(t('profile.gifts.loginChallenge'));
                            return;
                          }
                          window.dispatchEvent(new CustomEvent('open-challenge-modal', { detail: { uid: displayUser?.uid, name: displayUser?.name, picture: displayUser?.picture } }));
                        }} 
                        className="h-11 px-6 bg-indigo-600 dark:bg-xq-gold text-white dark:text-black font-black rounded-2xl hover:bg-indigo-700 dark:hover:bg-xq-gold/80 transition-all text-xs uppercase tracking-widest"
                      >
                        ⚔️ {t('profile.challenge')}
                      </button>
                    </div>
                  )
               )}
            </div>
         </div>

         <div className="mt-8 p-6 rounded-[12px] bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 shadow-sm dark:shadow-none relative z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-xq-gold mb-3">{t('profile.bioTitle')}</h3>
            <div className="text-sm text-slate-600 dark:text-white/60 leading-relaxed max-w-4xl">
               <Trans 
                 i18nKey="profile.originalBioTemplate"
                 values={{ 
                   name: displayUser?.name, 
                   rank: rankInfo?.title, 
                   elo: stats?.elo, 
                   count: stats?.gamesPlayed, 
                   followers: stats?.followersCount 
                 }}
                 components={[<strong key="0" />, <strong key="1" />, <strong key="2" />, <strong key="3" />]}
               >
                 <strong>{displayUser?.name}</strong> là một kỳ thủ tích cực trong cộng đồng Cờ tướng Online. 
                 Với trình độ <strong>{rankInfo?.title}</strong> ({stats?.elo} Elo), {displayUser?.name} đã tham gia tổng cộng <strong>{stats?.gamesPlayed}</strong> trận đấu kịch tính. 
                 Hiện tại, kỳ thủ này đang sở hữu <strong>{stats?.followersCount}</strong> người theo dõi và là một phần quan trọng của hệ thống xếp hạng quốc gia trên nền tảng.
               </Trans>
            </div>
         </div>
      </div>

      {/* 🫂 SOCIAL SECTION */}
      <div className="rounded-[2.5rem] border border-black/5 dark:border-white/5 bg-slate-100 dark:bg-black/20 dark:bg-black/20 p-8 shadow-sm dark:shadow-inner relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none">👥</div>
         <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-full md:w-64 space-y-4">
               <div className="flex gap-2 p-1.5 bg-white/90 dark:bg-black/40 rounded-2xl overflow-hidden">
                  <button onClick={() => setActiveTab('followers')} className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'followers' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:text-white/50'}`}>{t('profile.social.followers')}</button>
                  <button onClick={() => setActiveTab('following')} className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'following' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:text-white/50'}`}>{t('profile.social.following')}</button>
               </div>
            </div>
            <div className="flex-1 flex flex-wrap gap-4 px-2">
               {(activeTab === 'following' ? followingList : followersList).slice(0, 24).map(f => (
                 <Link key={f.uid} to={`/player/${makeSlug(f.name || '', f.uid)}`} className="relative group transition-transform hover:scale-110">
                    {f.picture ? (
                      <img src={f.picture} className="w-12 h-12 rounded-[18px] object-cover border-2 border-black/5 dark:border-white/5" alt={f.name} />
                    ) : (
                      <div className="w-12 h-12 rounded-[18px] bg-slate-100 dark:bg-white/5 border-2 border-black/5 dark:border-white/5 flex items-center justify-center font-black text-sm text-slate-400 dark:text-white/20">{(f.name || '?')[0]}</div>
                    )}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/95 text-xs font-black text-slate-900 dark:text-white px-2 py-1 rounded-md border border-black/10 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{f.name}</div>
                 </Link>
               ))}
               {(activeTab === 'following' ? followingList : followersList).length === 0 && <div className="w-full py-10 text-center text-xs font-black uppercase text-slate-400 dark:text-white/10 italic">{t('profile.social.empty')}</div>}
            </div>
         </div>
      </div>

      {/* 🛡️ GIFT SENDER */}
      {!isMe && currentUser && (
         <div className="rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/50 dark:bg-xq-gold/5 p-12 shadow-2xl space-y-8 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-indigo-600 dark:text-xq-gold uppercase tracking-widest">🎁 {t('profile.gifts.title')}</h2>
            <GiftSender targetUid={profileId!} onSent={() => {
                void apiGet(`/users/${encodeURIComponent(profileId!)}/summary`, authState.token).then((j: any) => { if (j?.ok) setStats(j as MyStats); }).catch(e => logger.debug('Fetch summary after gift failed', e));
            }} />
         </div>
      )}

      {/* 🪙 PUBLIC ASSETS (Gold, Medals, Items) */}
      <div className="rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/[0.03] p-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-xq-gold/5 via-blue-500/5 to-xq-gold/5 opacity-40 blur-3xl pointer-events-none" />
         
         <div className="flex flex-col xl:flex-row gap-12 relative z-10 w-full overflow-x-auto no-scrollbar">
            {/* Medals */}
            <div className="flex flex-col items-start gap-3 min-w-[250px] shrink-0">
               <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400/60">{t('profile.sections.medals')}</div>
               <div className="flex flex-wrap gap-3">
                  {tourResults.slice(0, 6).map(res => (
                     <div key={res.id} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-2xl shadow-lg" title={res.name}>
                        {medalIcon(res.rank)}
                     </div>
                  ))}
                  {tourResults.length === 0 && <div className="text-xs font-bold text-slate-400 dark:text-white/10 uppercase italic pt-2">{t('profile.sections.noMedals')}</div>}
               </div>
            </div>

            {/* Inventory Showcase */}
            <div className="flex flex-col items-start gap-3 flex-1 min-w-[300px] xl:border-l xl:border-black/5 dark:border-white/5 xl:pl-8">
               <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-400/60">{t('profile.sections.inventory')}</div>
               <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar pb-1">
                  {Object.values(shopGifts).map(item => {
                     const count = stats?.inventory?.[item.id] || 0;
                     if (count === 0) return null;
                     return (
                        <div key={item.id} className="relative shrink-0">
                           <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-3xl shadow-lg">{item.icon}</div>
                           <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-lg bg-blue-600 text-xs font-black text-slate-900 dark:text-white shadow-xl z-20 border border-black/10 dark:border-white/10">x{count}</span>
                        </div>
                     );
                  })}
                  {(!stats?.inventory || Object.keys(stats.inventory).length <= 1) && <div className="text-xs font-bold text-slate-400 dark:text-white/10 uppercase italic pt-2">{t('profile.sections.noItems')}</div>}
               </div>
            </div>
         </div>
      </div>

      {/* 🧩 CREATED PUZZLES */}
      <div className="space-y-8">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-4 px-4"><span className="text-xq-gold">🧩</span> {t('profile.sections.puzzles')}</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {myPuzzles.map(p => (
              <Link key={p.id} to={`/puzzles/${makeSlug(p.name, p.uid || p.id)}`} className="group relative flex flex-col gap-4 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-5 shadow-sm transition-all hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-none hover:-translate-y-2 overflow-hidden">
                 <div className="aspect-[9/10] w-full overflow-hidden rounded-[12px] bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 group-hover:border-xq-gold/30 transition-colors"><MiniBoard board={p.thumbBoard || p.board} position={p.position} /></div>
                 <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-xq-gold transition-colors uppercase truncate">{p.name || t('puzzles.view.seoContent.defaultName')}</div>
                    <div className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-tighter">{t('setup.form.levelValue', { level: p.level || 1 })}</div>
                 </div>
              </Link>
            ))}
            {myPuzzles.length === 0 && <div className="col-span-full py-16 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2.5rem] text-xs font-black text-slate-400 dark:text-white/10 uppercase tracking-[0.3em] italic">{t('profile.sections.noPuzzles')}</div>}
         </div>
      </div>

      {/* ✅ SOLVED PUZZLES */}
      <div className="space-y-8">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-4 px-4"><span className="text-emerald-400">✅</span> {t('profile.sections.solved')}</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {solvedPuzzles.map(p => (
              <Link key={p.uid} to={`/puzzles/${makeSlug(p.puzzleName, p.uid)}`} className="group relative flex flex-col gap-4 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-5 shadow-sm transition-all hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-none hover:-translate-y-2 overflow-hidden">
                 <div className="aspect-[9/10] w-full overflow-hidden rounded-[12px] bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 group-hover:border-emerald-400/30 transition-colors">
                    <MiniBoard board={p.thumbBoard} />
                 </div>
                 <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors uppercase truncate">{p.puzzleName || t('profile.game.' + (p.winner || 'draw'))}</div>
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-tighter">
                       <span className="text-slate-400 dark:text-white/20">{t('setup.form.levelValue', { level: p.level || 1 })}</span>
                       <span className="text-emerald-400/60">{t('profile.game.moves', { count: p.moveCount })}</span>
                    </div>
                 </div>
              </Link>
            ))}
            {solvedPuzzles.length === 0 && <div className="col-span-full py-16 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2.5rem] text-xs font-black text-slate-400 dark:text-white/10 uppercase tracking-[0.3em] italic">{t('profile.sections.noSolved')}</div>}
         </div>
      </div>

      {/* ⚔️ RECENT GAMES */}
      <div className="space-y-8">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-4 px-4"><span className="text-blue-400">⚔️</span> {t('profile.sections.history')}</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {games.map((g) => {
               const res = resultLabel(g);
               const pRed = g.players?.redName || '...?';
               const pBlack = g.players?.blackName || '...?';
               return (
                 <div key={g.gameId} className="group relative flex flex-col gap-4 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-5 shadow-sm transition-all hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-none hover:-translate-y-2 overflow-hidden">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                       <span className="text-blue-400/60">{g.timeMode}</span>
                       <span className={res.color}>{res.text}</span>
                    </div>
                    <div className="aspect-[9/10] bg-white/90 dark:bg-black/40 rounded-[12px] border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl"><MiniBoard board={g.thumbBoard || g.board} position={g.thumbPosition || g.position} /></div>
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-800 dark:text-white/80">
                       <span className="truncate flex-1">{pRed}</span>
                       <span className="px-2 text-slate-400 dark:text-white/10 italic">vs</span>
                       <span className="truncate flex-1 text-right">{pBlack}</span>
                    </div>
                    <Link to={`/game/${g.gameId}`} className="h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 group-hover:bg-blue-600 transition-all text-xs font-black uppercase text-slate-600 dark:text-white/40 group-hover:text-slate-900 dark:text-white">{t('profile.sections.viewGame')}</Link>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}

function GiftSender({ targetUid, onSent }: { targetUid: string; onSent?: () => void }) {
  const { t } = useTranslation();
  const { state: authState, refresh } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [gifts, setGifts] = useState<Record<string, { id: string, name: string, icon: string }>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiGet<{ ok: boolean, gifts: any }>('/gifts/list', authState.token).then(res => {
      if (res?.ok) setGifts(res.gifts || {});
      setLoading(false);
    });
  }, [authState.token]);

  const inventory = (authState.user?.inventory || {}) as Record<string, number>;
  const availableGifts = Object.values(gifts).filter(item => (inventory[item.id] || 0) > 0);

  const handleSend = async () => {
    if (!selected || sending) return;
    setSending(true);
    try {
      const res = await apiPost<{ ok: boolean }>('/gifts/send', { targetUid, itemId: selected, quantity: 1 }, authState.token);
      if (res?.ok) {
        refresh();
        setSelected(null);
        if (onSent) onSent();
      }
    } catch (e) {
      logger.debug('Send gift failed', e);
    } finally { setSending(false); }
  };

  if (loading) return <div className="text-xs font-black text-slate-400 dark:text-white/10 uppercase animate-pulse">{t('profile.gifts.loading')}</div>;

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {availableGifts.map(item => (
            <button key={item.id} onClick={() => setSelected(item.id)} className={`group relative flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all ${selected === item.id ? 'bg-xq-gold/20 border-xq-gold shadow-xl shadow-xq-gold/20' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-black/20 dark:border-white/20'}`}>
               <span className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
               <span className={`text-xs font-black uppercase ${selected === item.id ? 'text-xq-gold' : 'text-slate-600 dark:text-white/40'}`}>{item.name}</span>
               <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-white/95 dark:bg-black/60 text-xs font-black text-slate-600 dark:text-white/50">x{inventory[item.id]}</span>
            </button>
          ))}
          {availableGifts.length === 0 && <div className="col-span-full py-10 text-center text-xs font-black uppercase text-slate-400 dark:text-white/10 italic">{t('profile.gifts.empty')}</div>}
       </div>
       {selected && <button onClick={handleSend} disabled={sending} className="h-14 px-12 rounded-2xl bg-xq-gold text-slate-900 dark:text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-xq-gold/40">{sending ? t('profile.gifts.sending') : t('profile.gifts.confirm')}</button>}
    </div>
  );
}

export default ProfilePage;

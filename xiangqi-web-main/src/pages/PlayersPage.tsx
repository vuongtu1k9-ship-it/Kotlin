import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/SEO';
import { getAbsoluteUrl, getSiteOrigin } from '../utils/url';
import { onPresenceUpdate, requestPresenceList } from '../net/presence';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';

type PlayerRow = {
  uid: string;
  slug?: string;
  name?: string;
  picture?: string | null;
  elo: number;
  gamesPlayed: number;
  online?: boolean;
  playingRoomId?: string | null;
  activityStatus?: 'idle' | 'waiting' | 'playing';
  customStatus?: 'online' | 'busy' | 'offline';
};

import { API_URL } from '../auth/auth';
import { resolveStatusBadge } from '../hooks/useOnlinePlayers';
import { UserPresenceBundle } from '../components/UserPresenceBundle';
import { makeSlug } from '../utils/slug';

export function PlayersPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { state: authState } = useAuth();
  const { error: toastError } = useToast();

  const activeRoomId = useMemo(() => {
    try {
      return localStorage.getItem('xq:activeRoomId') || '';
    } catch (e) {
      return '';
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      const url = `${API_URL}/players?limit=200&page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      const r = await fetch(url, { credentials: 'include' });
      const j = await r.json();
      if (!j?.ok) {
        setErr(j?.error || 'LOAD_FAILED');
        return;
      }
      setRows((j.players || []) as PlayerRow[]);
      setTotalPages(j.pages || 1);
      setTotalCount(j.total || 0);
    } catch (e) {
      setErr('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const off = onPresenceUpdate((p) => {
      setRows((prev) => prev.map((r) => (r.uid === p.uid ? {
        ...r,
        online: p.online,
        playingRoomId: p.playingRoomId,
        activityStatus: (p as any).activityStatus,
        customStatus: (p as any).customStatus,
      } : r)));
    });

    void requestPresenceList().then((ack) => {
      if (!ack || !(ack as any).ok) return;
      const list = (ack as any).presence as any[];
      setRows((prev) =>
        prev.map((r) => {
          const hit = list.find((x) => x.uid === r.uid);
          return hit ? {
            ...r,
            online: !!hit.online,
            playingRoomId: hit.playingRoomId || null,
            activityStatus: hit.activityStatus || 'idle',
            customStatus: hit.customStatus || 'online',
          } : { ...r, online: false };
        })
      );
    });

    return () => {
      off();
    };
  }, []);

  const leaderboardJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": t('leaderboard.meta.listTitle'),
    "description": t('leaderboard.meta.listDesc'),
    "itemListElement": rows.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Person",
        "name": p.name || p.uid,
        "identifier": p.uid,
        "url": getAbsoluteUrl(`/player/${makeSlug(p.name || '', p.uid)}`)
      }
    }))
  }), [rows, t]);

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10">
      <SEO 
        title={t('leaderboard.meta.title')} 
        description={t('leaderboard.meta.description')}
        jsonLd={[
          leaderboardJsonLd,
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": t('leaderboard.meta.home'),
                "item": getSiteOrigin()
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t('ranks.master'),
                "item": getAbsoluteUrl('/players')
              }
            ]
          }
        ]}
      />
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
             <span className="text-xq-gold drop-shadow-lg">🏆</span> {t('leaderboard.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-white/50 mt-1">{t('leaderboard.subtitle', { count: totalCount })}</p>
        </div>

        <div className="mt-4 md:mt-0 p-8 rounded-[2.5rem] bg-white/[0.03] border border-black/10 dark:border-white/10 backdrop-blur-md shadow-2xl">
           <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                 <span className="text-xq-gold">📜</span> {t('leaderboard.hierarchy.title')}
              </h2>
              <p className="text-xs text-slate-600 dark:text-white/40 leading-relaxed font-medium uppercase tracking-[0.1em] mb-8 italic">
                 {t('leaderboard.hierarchy.desc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-colors">
                    <div className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {t('leaderboard.hierarchy.rank1.title')}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed font-bold uppercase tracking-wide">Elo 1000 - 1299</p>
                    <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed italic">{t('leaderboard.hierarchy.rank1.desc')}</p>
                 </div>
                 <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-colors">
                    <div className="text-xs font-black text-blue-400 uppercase tracking-wide flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> {t('leaderboard.hierarchy.rank2.title')}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed font-bold uppercase tracking-wide">Elo 1300 - 1699</p>
                    <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed italic">{t('leaderboard.hierarchy.rank2.desc')}</p>
                 </div>
                 <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-xq-gold/30 transition-colors">
                    <div className="text-xs font-black text-xq-gold uppercase tracking-wide flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-xq-gold animate-pulse" /> {t('leaderboard.hierarchy.rank3.title')}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed font-bold uppercase tracking-wide">Elo 1700 - 1899</p>
                    <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed italic">{t('leaderboard.hierarchy.rank3.desc')}</p>
                 </div>
                 <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-colors">
                    <div className="text-xs font-black text-rose-500 uppercase tracking-wide flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> {t('leaderboard.hierarchy.rank4.title')}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed font-bold uppercase tracking-wide">Elo 1900+</p>
                    <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed italic">{t('leaderboard.hierarchy.rank4.desc')}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="relative group w-full md:w-80">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 dark:text-white/20 group-focus-within:text-xq-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
           </div>
           <input 
              type="text"
              placeholder={t('leaderboard.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 focus:border-xq-gold/30 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-white/10 outline-none transition-all shadow-xl backdrop-blur-3xl"
           />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20 backdrop-blur-3xl shadow-2xl">
        {err && (
          <div className="p-8 text-center text-sm font-bold text-rose-400 uppercase tracking-wide">
            ⚠️ {err}
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="p-20 flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-xq-gold/20 border-t-xq-gold rounded-full animate-spin" />
             <div className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-wide">{t('leaderboard.statuses.searching')}</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[60px_1fr_100px_100px_100px_120px_120px] items-center bg-slate-100 dark:bg-white/5 border-b border-black/10 dark:border-white/10 px-6 py-4 text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.1em]">
                  <div className="text-center">{t('leaderboard.table.rank')}</div>
                  <div>{t('leaderboard.table.player')}</div>
                  <div className="text-center text-xq-gold">{t('leaderboard.table.elo')}</div>
                  <div className="text-center">{t('leaderboard.table.games')}</div>
                  <div className="text-center">{t('leaderboard.table.status')}</div>
                  <div className="text-center">{t('leaderboard.table.playing')}</div>
                  <div className="text-right pr-4">{t('leaderboard.table.actions')}</div>
                </div>

                <div className="divide-y divide-white/5">
                  {rows.map((p, idx) => {
                    const rank = (page - 1) * 200 + idx + 1;
                    return (
                      <div
                        key={p.uid}
                        className="grid grid-cols-[60px_1fr_100px_100px_100px_120px_120px] items-center px-6 py-4 hover:bg-white/[0.03] transition-all group"
                      >
                        <div className="text-center font-black text-slate-400 dark:text-white/10 group-hover:text-slate-400 dark:text-white/30 transition-colors">
                           {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                        </div>
                        <div className="flex items-center gap-3">
                          <Link to={`/player/${makeSlug(p.name || '', p.uid)}`} className="flex items-center gap-3 group/user">
                            <UserPresenceBundle 
                              player={{ ...p, name: p.name || p.uid, picture: p.picture || null } as any} 
                              size="md" 
                              showRank={false}
                            />
                          </Link>
                        </div>
                        <div className="text-center">
                           <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-xq-gold/10 dark:text-xq-gold font-black text-sm border border-indigo-600/20 dark:border-xq-gold/20 shadow-[0_0_15px_rgba(67,56,202,0.1)] dark:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                             {p.elo}
                           </span>
                        </div>
                        <div className="text-center text-sm font-bold text-slate-600 dark:text-white/60">{p.gamesPlayed}</div>
                        <div className="text-center">
                          {p.online ? (
                             <span className={`text-xs font-black uppercase tracking-tight ${resolveStatusBadge(p as any).color}`}>
                               {resolveStatusBadge(p as any).label}
                             </span>
                          ) : (
                            <span className="text-xs font-black text-slate-400 dark:text-white/10 uppercase tracking-wide italic">{t('common.offline')}</span>
                          )}
                        </div>
                        <div className="text-center">
                          {p.playingRoomId ? (
                             <Link to={`/game/${p.playingRoomId}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-wide border border-blue-500/20 hover:bg-blue-500 hover:text-slate-900 dark:text-white transition-all shadow-lg">
                                {t('leaderboard.actions.view')}
                             </Link>
                          ) : (
                            <span className="text-slate-400 dark:text-white/10 text-xs">—</span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2 pr-2">
                           {p.uid !== activeRoomId && (
                             <>
                               <button
                                 onClick={() => {
                                   if (!authState.user || authState.user.provider === 'guest') {
                                     toastError(t('profile.gifts.loginPrivate'));
                                     return;
                                   }
                                   window.dispatchEvent(new CustomEvent('open-private-chat', { detail: p }));
                                 }}
                                 className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white transition-all shadow-xl group/btn"
                                 title={t('leaderboard.actions.message')}
                               >
                                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                               </button>
                               <button
                                  onClick={() => {
                                    if (!authState.user || authState.user.provider === 'guest') {
                                      toastError(t('profile.gifts.loginChallenge'));
                                      return;
                                    }
                                    window.dispatchEvent(new CustomEvent('open-challenge-modal', { detail: { uid: p.uid, name: p.name || p.uid, picture: p.picture, customStatus: p.customStatus, activityStatus: p.activityStatus } }));
                                  }}
                                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-xq-gold/10 hover:bg-xq-gold text-xq-gold hover:text-black transition-all shadow-xl group/btn border border-xq-gold/20"
                                  title={t('common.challenge')}
                               >
                                 <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {rows.length === 0 && !loading && (
                   <div className="py-32 text-center space-y-4">
                      <div className="text-6xl grayscale opacity-20">🔍</div>
                      <div className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-wide">{t('leaderboard.empty')}</div>
                   </div>
                )}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-8 py-6 bg-white/[0.02] border-t border-black/5 dark:border-white/5">
                 <div className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-wide leading-none">
                    {t('leaderboard.pagination.page', { current: page, total: totalPages })} • <span className="text-slate-600 dark:text-white/40">{t('leaderboard.pagination.total', { count: totalCount })}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                       disabled={page <= 1 || loading}
                       onClick={() => setPage(p => p - 1)}
                       className="h-10 px-6 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-xs font-black text-slate-600 dark:text-white/60 hover:text-slate-900 dark:text-white uppercase tracking-wide disabled:opacity-10 transition-all border border-black/10 dark:border-white/10"
                    >
                       {t('leaderboard.pagination.prev')}
                    </button>
                    <button 
                       disabled={page >= totalPages || loading}
                       onClick={() => setPage(p => p + 1)}
                       className="h-10 px-6 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-xs font-black text-slate-600 dark:text-white/60 hover:text-slate-900 dark:text-white uppercase tracking-wide disabled:opacity-10 transition-all border border-black/10 dark:border-white/10"
                    >
                       {t('leaderboard.pagination.next')}
                    </button>
                 </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-8 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-black/5 dark:border-white/5 text-center">
         <p className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wide max-w-lg mx-auto leading-relaxed">
            {t('leaderboard.footer')}
         </p>
      </div>
    </div>
  );
}

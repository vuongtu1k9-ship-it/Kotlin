import { useEffect, useState, Suspense, lazy } from 'react';
import { useTranslation, Trans } from 'react-i18next';
const MiniBoard = lazy(() => import('../components/MiniBoard').then(m => ({ default: m.MiniBoard })));
import { Link } from 'react-router-dom';
import { logger } from '../utils/logger';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../ui/Input';
import { makeSlug } from '../utils/slug';
import { getSiteOrigin, getAbsoluteUrl } from '../utils/url';
import { SEO } from '../components/SEO';
import { LazyMount } from '../components/ui/LazyMount';
import React from 'react';

type PublicSetup = {
  id: string;
  uid?: string;
  name: string;
  description: string | null;
  level: number | null;
  fen?: string | null;
  thumbBoard?: any;
  createdAt: number;
  pieceCount?: number;
  likeCount?: number;
  solveCount?: number;
  viewCount?: number;
  attemptCount?: number;
  createdByName?: string;
  createdByUid?: string;
};

export function PuzzlesPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const [list, setList] = useState<PublicSetup[]>([]);
  const { error: toastError } = useToast();
  const [status, setStatus] = useState('');
  
  // Filters
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState('newest'); // 'newest', 'popular'
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'day', 'week', 'month'
  const [materialFilter, setMaterialFilter] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMyLikes = async () => {
    if (authState.status !== 'auth' || !authState.user) return;
    try {
      const r = await apiGet<{ ok: boolean; likes?: string[] }>('/setups/likes/mine', authState.token);
      if (r?.ok && r.likes) setMyLikes(new Set(r.likes));
    } catch (e) { logger.error(e); }
  };

  useEffect(() => {
    void fetchMyLikes();
  }, [authState.status]);

  const toggleLike = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (authState.status !== 'auth' || !authState.user) {
      alert(t('puzzles.loginToSave'));
      return;
    }
    
    // Optimistic UI update
    const isLiked = myLikes.has(id);
    setMyLikes(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(id) : next.add(id);
      return next;
    });
    setList(prev => prev.map(p => 
      p.id === id ? { ...p, likeCount: Math.max(0, (p.likeCount || 0) + (isLiked ? -1 : 1)) } : p
    ));

    try {
      const res = await apiPost<{ ok: boolean; liked?: boolean; likeCount?: number }>(`/setups/like/${id}`, {}, authState.token);
      if (!res?.ok) throw new Error('Failed');
      // Update with server truth
      setList(prev => prev.map(p => 
        p.id === id ? { ...p, likeCount: res.likeCount || 0 } : p
      ));
    } catch (e) {
      // Rollback
      setMyLikes(prev => {
        const next = new Set(prev);
        isLiked ? next.add(id) : next.delete(id);
        return next;
      });
      setList(prev => prev.map(p => 
        p.id === id ? { ...p, likeCount: Math.max(0, (p.likeCount || 0) + (isLiked ? 1 : -1)) } : p
      ));
    }
  };

  const loadData = async (pageNum: number, isReset: boolean) => {
    if (isReset) setStatus(t('common.loading'));
    try {
      const params = new URLSearchParams();
      params.set('limit', '12');
      params.set('page', String(pageNum));
      if (q.trim()) params.set('q', q.trim());
      if (level.trim()) params.set('level', level.trim());
      if (sort !== 'newest') params.set('sort', sort);
      if (timeRange !== 'all') params.set('timeRange', timeRange);
      
      // Source is always 'all' now
      params.set('source', 'all');

      const matParts: string[] = [];
      Object.entries(materialFilter).forEach(([k, v]) => {
        if (v > 0) matParts.push(`${k}:${v}`);
      });
      if (matParts.length > 0) params.set('material', matParts.join(','));

      const endpoint = showLikedOnly ? '/setups/likes/mine' : `/setups/public?${params.toString()}`;
      
      const r = await apiGet<{ ok: boolean; setups?: PublicSetup[]; error?: string; likes?: string[] }>(endpoint, authState.token);
      
      if (!r?.ok) {
        if (isReset) setStatus(`${t('common.error')}: ${r?.error || 'LOAD_FAILED'}`);
        return;
      }

      let newSetups: PublicSetup[] = [];

      if (showLikedOnly) {
        if (r?.likes?.length) {
          const ids = r.likes.join(',');
          const res2 = await apiGet<{ ok: boolean; setups?: PublicSetup[] }>(`/setups/public?ids=${ids}&source=all`, authState.token);
          newSetups = res2?.ok && Array.isArray(res2.setups) ? res2.setups : [];
        }
        setHasMore(false);
      } else {
        newSetups = Array.isArray(r.setups) ? r.setups : [];
        setHasMore(newSetups.length === 12);
      }

      setList(prev => isReset ? newSetups : [...prev, ...newSetups]);
      if (isReset) setStatus('');
    } catch (e) {
      if (isReset) setStatus(`${t('common.error')}: NETWORK_ERROR`);
    }
  };

  const refresh = () => {
    setPage(1);
    setHasMore(true);
    void loadData(1, true);
  };

  useEffect(() => {
    refresh();
  }, [showLikedOnly, sort, timeRange, level, JSON.stringify(materialFilter)]); 

  const isLoading = status === t('common.loading');

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="mb-2">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 leading-none">
              <Trans i18nKey="puzzles.title">
                <span className="text-blue-600 dark:text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.2)]">cờ thế</span>
              </Trans>
            </h1>
            <p className="text-xs font-black text-slate-400 dark:text-white/30 ml-1">{t('puzzles.subtitle')}</p>
          </div>
          <div className="flex gap-2 bg-white/90 dark:bg-black/40 p-1 rounded-xl border border-black/5 dark:border-white/5">
                <button
                  onClick={() => setShowLikedOnly(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!showLikedOnly ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-white/40 hover:text-slate-800 dark:text-white/80'}`}
                >
                  <span className="opacity-50 mr-1.5">🌍</span> {t('puzzles.explore')}
                </button>
                <button
                  onClick={() => setShowLikedOnly(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${showLikedOnly ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-600 dark:text-white/40 hover:text-slate-800 dark:text-white/80'}`}
                >
                  <span>❤️</span> {t('puzzles.saved')}
                </button>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {!showLikedOnly && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 backdrop-blur-md space-y-6 shadow-md dark:shadow-2xl">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input 
                  value={q} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} 
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && refresh()}
                  placeholder={`🔍 ${t('puzzles.searchPlaceholder')}`}
                  className="bg-white dark:bg-black/40 border-slate-200 dark:border-white/5 h-11 text-sm font-medium"
                />
              </div>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                aria-label={t('puzzles.level')}
                className="bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-4 h-11 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer w-32"
              >
                <option value="">🎯 {t('puzzles.level')}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                  <option key={l} value={l}>{t('puzzles.levelValue', { level: l })}</option>
                ))}
              </select>
              
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                aria-label={t('puzzles.sort.label')}
                className="bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-4 h-11 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="newest">🕒 {t('puzzles.sort.newest')}</option>
                <option value="popular">🔥 {t('puzzles.sort.popular')}</option>
                <option value="solved">🧩 {t('puzzles.sort.solved')}</option>
              </select>

              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                aria-label={t('puzzles.time.label')}
                className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 h-11 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="all">📅 {t('puzzles.time.all')}</option>
                <option value="day">☀️ {t('puzzles.time.day')}</option>
                <option value="week">📅 {t('puzzles.time.week')}</option>
                <option value="month">🌙 {t('puzzles.time.month')}</option>
              </select>

              <button
                type="button"
                className="flex h-11 items-center justify-center rounded-xl bg-[var(--cobalt-indigo)] px-8 text-sm font-extrabold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20"
                onClick={refresh}
              >
                {t('common.search')}
              </button>
            </div>

            <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5"></div>

            <div className="flex flex-wrap items-center gap-x-12 gap-y-6">

              {/* Material Filter Row - Puzzles (Initial) */}
              <div className="flex-1 flex flex-wrap items-center gap-x-10 gap-y-4 pt-1">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-black">
                  <div className="flex items-center gap-3 pr-2">
                    <span className="text-[10px] text-rose-600 dark:text-rose-500/60 w-8 shrink-0 font-black">{t('puzzles.red')}</span>
                    <div className="flex gap-1.5">
                      {['chariot', 'cannon', 'horse', 'elephant', 'advisor', 'soldier'].map(type => (
                        <MaterialCounter 
                          key={`red-${type}`} 
                          side="red" 
                          type={type} 
                          value={materialFilter[`red-${type}`] || 0}
                          onChange={(v) => setMaterialFilter(prev => ({ ...prev, [`red-${type}`]: v }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-blue-600 dark:text-blue-500/60 w-8 shrink-0 font-black">{t('puzzles.black')}</span>
                    <div className="flex gap-1.5">
                      {['chariot', 'cannon', 'horse', 'elephant', 'advisor', 'soldier'].map(type => (
                        <MaterialCounter 
                          key={`black-${type}`} 
                          side="black" 
                          type={type} 
                          value={materialFilter[`black-${type}`] || 0}
                          onChange={(v) => setMaterialFilter(prev => ({ ...prev, [`black-${type}`]: v }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skeletons are shown inside the grid below to avoid layout jumps */}

      <h2 className="sr-only">{t('puzzles.listTitle')}</h2>
      {!isLoading && list.length === 0 && (
         <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] rounded-[40px] border border-black/5 dark:border-white/5 mx-auto max-w-2xl">
            <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-6 border border-black/5 dark:border-white/5">
              <span className="text-4xl opacity-40 grayscale">🧩</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
              {t('puzzles.empty.title')}
            </div>
            <p className="text-sm text-slate-400 dark:text-white/30 font-medium mt-3 text-center max-w-xs px-6 leading-relaxed">
              {t('puzzles.empty.desc')}
            </p>
            <button 
              onClick={() => {
                setMaterialFilter({});
                setQ('');
                setLevel('');
              }}
              className="mt-8 px-8 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 transition-all border border-black/5 dark:border-white/5 active:scale-95"
            >
              {t('puzzles.empty.reset')}
            </button>
         </div>
      )}

      {/* Grid of Cards */}
      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-all duration-500 min-h-[600px]`}>
        {isLoading && list.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 shadow-sm animate-pulse">
                <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="aspect-[9/10] w-full rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-white/10" />
                </div>
            </div>
          ))
        ) : (
          list.map((s) => (
            <Link
              key={s.id}
              to={`/puzzles/${makeSlug(s.name, s.uid || s.id)}`}
              className="group relative flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 transition-all duration-300 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden"
            >
              {/* Like Button Absolute */}
              <button 
                onClick={(e) => toggleLike(s.id, e)}
                className={`absolute z-20 top-6 right-6 flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md transition-all ${myLikes.has(s.id) ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400 scale-110 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-white/90 dark:bg-black/40 border border-black/10 dark:border-white/10 text-slate-400 dark:text-white/30 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:bg-white/10 hover:text-rose-300 scale-95 hover:scale-100'}`}
              >
                {myLikes.has(s.id) ? '❤️' : '🤍'}
              </button>

              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />

              <div className="flex items-start justify-between pr-8">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-slate-800 dark:text-white/90 group-hover:text-blue-400 transition-colors tracking-tight">{s.name}</h3>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 dark:text-white/30">
                      {s.level != null ? <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{t('puzzles.levelValue', { level: s.level })}</span> : t('puzzles.unclassified')}
                    </div>
                    {s.createdByName && (
                      <span className="text-[9px] font-bold text-blue-400/60 truncate max-w-[100px]">
                        {t('puzzles.byUser', { name: s.createdByName })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative aspect-[9/10] w-full overflow-hidden rounded-[12px] bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 group-hover:border-blue-400/30 dark:border-white/20 transition-colors shadow-inner">
                <LazyMount fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse rounded-[12px]" />}>
                  <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                    <MiniBoard board={s.thumbBoard} />
                  </Suspense>
                </LazyMount>
              </div>

              <div className="mt-auto space-y-3">
                {s.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-white/50 italic px-1">
                    "{s.description}"
                  </p>
                )}
                
                <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3 mt-1">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-black text-slate-700 dark:text-white/80 leading-none">{s.viewCount || 0}</span>
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Xem</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-black text-slate-700 dark:text-white/80 leading-none">{s.attemptCount || 0}</span>
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Thử</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 leading-none">{s.solveCount || 0}</span>
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Giải</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-black text-rose-500 leading-none">{s.likeCount || 0}</span>
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Thích</span>
                    </div>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!authState.user || authState.user.provider === 'guest') {
                          toastError(t('puzzles.loginToChallenge'));
                          return;
                        }
                        window.dispatchEvent(new CustomEvent('open-challenge-modal', { 
                          detail: { 
                            setupId: s.id, 
                            puzzleName: s.name 
                          } 
                        }));
                      }}
                      className="flex h-7 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-slate-900 dark:text-white shadow-lg shadow-blue-500/20"
                      title={t('common.challenge')}
                    >
                      {t('common.challenge')}
                    </button>
                    <div className="flex h-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 px-4 text-[10px] font-black text-slate-600 dark:text-white/60 group-hover:bg-blue-600 group-hover:text-slate-900 dark:text-white transition-all">
                      {t('puzzles.actions.solve')}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {list.length > 0 && hasMore && !status && !showLikedOnly && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              void loadData(nextPage, false);
            }}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-10 py-4 h-auto text-xs font-black text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all active:scale-95 shadow-xl"
          >
            {t('puzzles.actions.loadMore')}
          </button>
        </div>
      )}
      {/* 📘 SEO ENRICHMENT CONTENT */}
      <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}>
         <div className="max-w-4xl">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
               <Trans i18nKey="puzzles.seoContent.whyTitle">
                 <span className="text-blue-500"></span> <span className="text-blue-600"></span>
               </Trans>
            </h2>
            <div className="space-y-8 text-sm text-slate-600 dark:text-white/40 leading-relaxed font-medium text-[13px]">
               <p>
                  <Trans i18nKey="puzzles.seoContent.intro">
                    <strong className="text-slate-600 dark:text-white/60"></strong>
                    <strong className="text-slate-600 dark:text-white/60"></strong>
                  </Trans>
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                     <h3 className="text-blue-400 font-black text-lg">{t('puzzles.seoContent.guide.title')}</h3>
                     <p>
                       <Trans i18nKey="puzzles.seoContent.guide.intro">
                         <strong className="text-slate-600 dark:text-white/60"></strong>
                       </Trans>
                     </p>
                     <ul className="space-y-3 list-disc pl-5">
                        <li>
                          <Trans i18nKey="puzzles.seoContent.guide.item1">
                            <strong className="text-slate-600 dark:text-white/60"></strong>
                          </Trans>
                        </li>
                        <li>
                          <Trans i18nKey="puzzles.seoContent.guide.item2">
                            <strong className="text-slate-600 dark:text-white/60"></strong>
                          </Trans>
                        </li>
                        <li>
                          <Trans i18nKey="puzzles.seoContent.guide.item3">
                            <strong className="text-slate-600 dark:text-white/60"></strong>
                          </Trans>
                        </li>
                     </ul>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-blue-400 font-black text-lg">{t('puzzles.seoContent.ai.title')}</h3>
                     <p>
                       <Trans i18nKey="puzzles.seoContent.ai.intro">
                         <strong className="text-slate-600 dark:text-white/60"></strong>
                       </Trans>
                     </p>
                     <ul className="space-y-3 list-disc pl-5">
                        <li>{t('puzzles.seoContent.ai.item1')}</li>
                        <li>{t('puzzles.seoContent.ai.item2')}</li>
                        <li>{t('puzzles.seoContent.ai.item3')}</li>
                     </ul>
                  </div>
               </div>

               <div className="p-8 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <h3 className="text-rose-500 font-black mb-4 flex items-center gap-2">🔥 {t('puzzles.seoContent.benefits.title')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[10px]">
                     <div className="space-y-2">
                        <span className="font-black text-slate-800 dark:text-white/60">{t('puzzles.seoContent.benefits.satt.title')}</span>
                        <p>{t('puzzles.seoContent.benefits.satt.desc')}</p>
                     </div>
                     <div className="space-y-2">
                        <span className="font-black text-slate-800 dark:text-white/60">{t('puzzles.seoContent.benefits.tanquoc.title')}</span>
                        <p>{t('puzzles.seoContent.benefits.tanquoc.desc')}</p>
                     </div>
                     <div className="space-y-2">
                        <span className="font-black text-slate-800 dark:text-white/60">{t('puzzles.seoContent.benefits.tuduy.title')}</span>
                        <p>{t('puzzles.seoContent.benefits.tuduy.desc')}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
            {['cotuong', 'giaicothe', 'giaithecotuong', 'cotheonline'].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest border border-black/5 dark:border-white/5">#{tag}</span>
            ))}
         </div>
      </div>

      <SEO 
        title={t('puzzles.meta.title')}
        description={t('puzzles.meta.description')}
        url={getAbsoluteUrl('/puzzles')}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": t('puzzles.meta.itemListDesc'),
            "description": t('puzzles.meta.itemListSchemaDesc'),
            "itemListElement": list.slice(0, 10).map((s, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "url": getAbsoluteUrl(`/puzzles/${makeSlug(s.name, s.uid || s.id)}`),
              "name": s.name
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": t('puzzles.meta.home'),
                "item": getSiteOrigin()
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t('puzzles.meta.puzzles'),
                "item": getAbsoluteUrl('/puzzles')
              }
            ]
          }
        ]}
      />
    </div>
  );
}

function MaterialCounter({ side, type, value, onChange }: { side: 'red' | 'black'; type: string; value: number; onChange: (v: number) => void }) {
  const PIECE_ICONS: Record<string, string> = {
    chariot: '車',
    cannon: '炮',
    horse: '馬',
    elephant: side === 'red' ? '相' : '象',
    advisor: side === 'red' ? '仕' : '士',
    soldier: side === 'red' ? '兵' : '卒',
  };

  const max = type === 'chariot' || type === 'cannon' || type === 'horse' || type === 'elephant' || type === 'advisor' ? 2 : 5;

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div 
        onClick={() => onChange(value >= max ? 0 : value + 1)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all border shadow-lg ${
          value > 0 
            ? side === 'red' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-rose-500/10' : 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-blue-500/10'
            : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/20 hover:border-black/20 dark:border-white/20 hover:bg-slate-200 dark:bg-white/10'
        }`}
      >
        {PIECE_ICONS[type]}
      </div>
      {value > 0 && <span className={`text-[10px] font-black ${side === 'red' ? 'text-rose-400/60' : 'text-blue-400/60'}`}>{value}</span>}
    </div>
  );
}

export default PuzzlesPage;

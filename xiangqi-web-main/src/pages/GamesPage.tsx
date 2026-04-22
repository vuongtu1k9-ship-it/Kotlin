import { useState, useEffect, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';

import { apiGet } from '../api';
const MiniBoard = lazy(() => import('../components/MiniBoard').then(m => ({ default: m.MiniBoard })));
import { makeSlug } from '../utils/slug';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { SEO } from '../components/SEO';
import { Button } from '../ui/Button';

type Tab = 'live' | 'open' | 'finished' | 'all';

export function GamesPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const [list, setList] = useState<any[]>([]);

  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Advanced Filters
  const [timeMode, setTimeMode] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [sort, setSort] = useState('newest');
  const [materialFilter, setMaterialFilter] = useState<Record<string, number>>({});

  const fetchGames = async (_pageNum: number, isReset: boolean) => {
    setLoading(true);
    try {
      const limit = 24;
      const status = tab === 'all' ? 'all' : tab;

      const params = new URLSearchParams();
      params.set('status', status);
      params.set('limit', String(limit));

      if (timeMode !== 'all') params.set('timeMode', timeMode);
      if (timeRange !== 'all') params.set('timeRange', timeRange);
      if (sort !== 'newest') params.set('sort', sort);

      const matParts: string[] = [];
      Object.entries(materialFilter).forEach(([k, v]) => {
        if (v > 0) matParts.push(`${k}:${v}`);
      });
      if (matParts.length > 0) params.set('material', matParts.join(','));

      const cursor = !isReset && list.length ? list[list.length - 1].createdAt : undefined;
      if (cursor) params.set('cursor', String(cursor));

      const r = await apiGet<{ ok: boolean; games?: any[] }>(`/games?${params.toString()}`, authState.token);
      if (r?.ok && Array.isArray(r.games)) {
        setList(prev => isReset ? r.games! : [...prev, ...r.games!]);
        setHasMore(r.games.length === limit);
      } else {
        console.error('[GamesPage] API Error:', r);
      }
    } catch (e) {
      console.error('[GamesPage] Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void fetchGames(1, true);
  }, [tab, authState.status, timeMode, timeRange, sort, JSON.stringify(materialFilter)]);


  const loadMore = () => {
    const nextP = page + 1;
    setPage(nextP);
    void fetchGames(nextP, false);
  };

  return (
    <div className="space-y-6 pb-12">
      <SEO
        title={t('games.meta.title')}
        description={t('games.meta.description')}
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white mb-2 font-heading drop-shadow-sm">
          <Trans i18nKey="games.title">
            Đánh <span className="text-[var(--cobalt-indigo)]">Cờ Tướng Online</span> - Kỳ Đài Giao Lưu
          </Trans>
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-white/70 font-bold leading-relaxed">{t('games.subtitle')}</p>
      </div>

      <Card className="border-none bg-transparent p-0 shadow-none space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'live', label: t('games.tabs.live') },
              { key: 'open', label: t('games.tabs.open') },
              { key: 'finished', label: t('games.tabs.finished') },
              { key: 'all', label: t('games.tabs.all') },
            ]}
          />

          <div className="flex flex-wrap gap-3">
            <select
              value={timeMode}
              onChange={e => setTimeMode(e.target.value)}
              aria-label={t('games.filters.timeMode.all')}
              className="bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-4 h-11 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="all">{t('games.filters.timeMode.all')}</option>
              <option value="blitz">{t('games.filters.timeMode.blitz')}</option>
              <option value="rapid">{t('games.filters.timeMode.rapid')}</option>
              <option value="standard">{t('games.filters.timeMode.standard')}</option>
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label={t('games.filters.sort.newest')}
              className="bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-4 h-11 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="newest">{t('games.filters.sort.newest')}</option>
              <option value="popular">{t('games.filters.sort.popular')}</option>
              <option value="spectators">{t('games.filters.sort.spectators')}</option>
            </select>

            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              aria-label={t('games.filters.timeRange.all')}
              className="bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-xl px-4 h-11 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="all">{t('games.filters.timeRange.all')}</option>
              <option value="day">{t('games.filters.timeRange.day')}</option>
              <option value="week">{t('games.filters.timeRange.week')}</option>
              <option value="month">{t('games.filters.timeRange.month')}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4">
          <h2 className="sr-only">{t('games.filters.advanced')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex items-center gap-6 h-14">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/80 w-8 shrink-0">{t('games.filters.red')}</span>
              <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2.5 py-1">
                {['chariot', 'cannon', 'horse', 'elephant', 'advisor', 'soldier'].map(type => (
                  <MaterialCounter
                    key={type}
                    side="red"
                    type={type}
                    value={materialFilter[`red:${type}`] || 0}
                    onChange={(v) => {
                      const newFilters = { ...materialFilter };
                      if (v === 0) delete newFilters[`red:${type}`];
                      else newFilters[`red:${type}`] = v;
                      setMaterialFilter(newFilters);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 h-14">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 w-8 shrink-0">{t('games.filters.black')}</span>
              <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2.5 py-1">
                {['chariot', 'cannon', 'horse', 'elephant', 'advisor', 'soldier'].map(type => (
                  <MaterialCounter
                    key={type}
                    side="black"
                    type={type}
                    value={materialFilter[`black:${type}`] || 0}
                    onChange={(v) => {
                      const newFilters = { ...materialFilter };
                      if (v === 0) delete newFilters[`black:${type}`];
                      else newFilters[`black:${type}`] = v;
                      setMaterialFilter(newFilters);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5 my-2"></div>

        {loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]"></div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">{t('games.empty.searching')}</div>
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-white/[0.02] rounded-[40px] border border-slate-200 dark:border-white/5 mx-auto w-full shadow-md">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5 grayscale">
              <span className="text-4xl opacity-40">⚔️</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('games.empty.noGames')}</div>
            <p className="text-sm text-slate-400 dark:text-white/30 font-black uppercase tracking-widest mt-3 text-center max-w-xs px-6 leading-relaxed">{t('games.empty.noResults')}</p>
            <button
              onClick={() => {
                setMaterialFilter({});
                setTimeMode('all');
                setTimeRange('all');
                setSort('newest');
              }}
              className="mt-8 px-8 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 transition-all border border-black/5 dark:border-white/5 active:scale-95"
            >
              {t('games.empty.clear')}
            </button>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-h-[600px] ${loading && list.length === 0 ? 'opacity-100' : 'opacity-100'}`}>
          {loading && list.length === 0 ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[505px] rounded-[32px] bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200 dark:border-white/5" />
            ))
          ) : (
            list.map((r: any) => {
              const redName = r.players?.redName || r.playerNames?.red || t('games.card.waiting');
              const blackName = r.players?.blackName || r.playerNames?.black || t('games.card.waiting');
              const slugName = r.puzzleName || `${redName}-vs-${blackName}`;
              const gameSlug = makeSlug(slugName, r.roomId);

              return (
                <div
                  key={r.roomId}
                  className="group relative flex flex-col gap-5 rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-md transition-all duration-500 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-blue-500/10 hover:-translate-y-1.5 overflow-hidden"
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />

                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400/80">
                          {r.puzzleName || r.boardType === 'puzzle' ? t('games.card.puzzle') : t('common.room')}
                        </span>
                        <Link to={`/game/${gameSlug}`} aria-label={`${t('common.room')} ${r.roomId}`}>
                          <code className="text-[10px] font-bold text-slate-400 dark:text-white/60 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full hover:bg-blue-500/10 hover:text-blue-500 transition-colors cursor-pointer">{r.roomId}</code>
                        </Link>
                      </div>
                      {r.puzzleName && (
                        <Link to={`/game/${gameSlug}`} className="text-sm font-bold text-slate-800 dark:text-white/90 truncate mt-1 group-hover:text-xq-gold transition-colors uppercase tracking-tight">
                          {r.puzzleName}
                        </Link>
                      )}
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 text-[9px] font-black text-slate-600 dark:text-white/60 uppercase tracking-widest">
                      {r.timeMode || 'Standard'}
                    </div>
                  </div>

                  <Link
                    to={`/game/${gameSlug}`}
                    className="relative aspect-[9/10] w-full overflow-hidden rounded-[12px] bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 group-hover:border-blue-400/30 dark:border-white/20 transition-all duration-500 shadow-inner block"
                  >
                    <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                      <MiniBoard board={r.thumbBoard} position={r.thumbPosition} />
                    </Suspense>
                  </Link>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <PlayerBadge name={redName} color="red" />
                        <div className="text-[10px] font-black text-slate-400 dark:text-white/60 italic tracking-tighter">VS</div>
                        <PlayerBadge name={blackName} color="black" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-white/60">
                        <span className="flex items-center gap-1.5 min-w-[40px]"><span className="text-blue-400">👁</span> {r.spectators || 0}</span>
                        <span className="flex items-center gap-1.5 min-w-[40px]"><span className="text-rose-400">⚔️</span> {r.moveCount || 0}</span>
                        <span className="flex items-center gap-1.5 min-w-[40px]"><span className="text-rose-500">❤️</span> {r.likeCount || 0}</span>
                      </div>

                      {!r.finished ? (
                        <Link to={`/game/${gameSlug}`} className="shrink-0">
                          <button className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                            {r.started ? t('games.card.watch') : t('games.card.participate')}
                          </button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>


        {hasMore && (
          <div className="flex justify-center mt-16">
            <Button
              variant="subtle"
              onClick={loadMore}
              disabled={loading}
              className="px-12 py-7 h-auto rounded-2xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] hover:bg-white/90 dark:hover:bg-white/[0.05] text-slate-900 dark:text-white transition-all group shadow-sm dark:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-black/20 dark:border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/40">{t('games.empty.searching')}</span>
                </div>
              ) : (
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-white/40 group-hover:text-slate-900 dark:text-white transition-colors">{t('games.card.loadMore')}</span>
              )}
            </Button>
          </div>
        )}
      </Card>
      {/* 📘 SEO ENRICHMENT CONTENT: KỲ ĐÀI GIAO LƯU */}
      <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}>
        <div className="max-w-4xl">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            <Trans i18nKey="games.seoContent.title">
               Hệ thống kỳ đài <span className="text-blue-600">cờ tướng online</span> lớn nhất
            </Trans>
          </h2>
          <div className="space-y-8 text-sm text-slate-600 dark:text-white/40 leading-relaxed font-medium text-[13px]">
            <p>
              <Trans i18nKey="games.seoContent.intro">
                Chào mừng bạn đến với chuyên mục <strong className="text-slate-600 dark:text-white/60">Kỳ Đài Giao Lưu</strong> tại cotuong.xyz. Đây là nơi tập trung hàng ngàn ván <strong className="text-slate-600 dark:text-white/60">đánh cờ tướng online</strong> kịch tính giữa các kỳ thủ từ khắp mọi nơi. Bạn có thể <strong className="text-slate-600 dark:text-white/60">xem cờ tướng trực tuyến</strong> và học hỏi các <strong className="text-slate-600 dark:text-white/60">bố cục cờ tướng</strong> hiện đại nhất trên <strong className="text-slate-600 dark:text-white/60">bàn cờ tướng</strong> tiêu chuẩn quốc tế.
              </Trans>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="text-blue-400 font-black text-lg">{t('games.seoContent.item1.title')}</h3>
                <p>
                  <Trans i18nKey="games.seoContent.item1.desc">
                    Mọi ván đấu sau khi kết thúc đều được lưu trữ dưới dạng <strong className="text-slate-600 dark:text-white/60">biên bản cờ tướng</strong> chi tiết. Bạn có thể xem lại từng nước đi, phân tích sai lầm và tìm ra các điểm sáng trong tư duy của các cao thủ khi <strong className="text-slate-600 dark:text-white/60">chơi cờ tướng online</strong> tại đây.
                  </Trans>
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-blue-400 font-black text-lg">{t('games.seoContent.item2.title')}</h3>
                <p>
                  <Trans i18nKey="games.seoContent.item2.desc">
                    Hãy tham gia thảo luận, bình luận và thả tim cho những ván đấu hay. <strong className="text-slate-600 dark:text-white/60">Cờ tướng online</strong> không chỉ là thắng thua, mà còn là nơi giao lưu, chia sẻ kinh nghiệm và niềm đam mê với nghệ thuật 64 ô cờ. Đây là môi trường lý tưởng để <strong className="text-slate-600 dark:text-white/60">đánh cờ tướng</strong> và nâng cao kỳ nghệ mỗi ngày.
                  </Trans>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
          {(t('games.seoContent.hashtags', { returnObjects: true }) as string[]).map(tag => (
            <span key={tag} className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest border border-black/5 dark:border-white/5">{tag.startsWith('#') ? tag : `#${tag}`}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerBadge({ name, color }: { name: string; color: 'red' | 'black' }) {
  const { t } = useTranslation();
  const isAnon = name === t('games.card.waiting');
  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <div className={`h-2.5 w-2.5 rounded-full border border-black/40 shrink-0 ${isAnon
        ? 'bg-slate-100 dark:bg-white/5'
        : color === 'red'
          ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
          : 'bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
        }`} />
      <span className={`text-xs font-black truncate uppercase tracking-tight ${isAnon ? 'text-slate-400 dark:text-white/60 italic' : 'text-slate-800 dark:text-white/90'}`}>
        {name}
      </span>
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
    <div className="flex flex-col items-center gap-1.5 group">
      <div
        onClick={() => onChange(value >= max ? 0 : value + 1)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all border shadow-lg ${value > 0
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { logger } from '../utils/logger';
import { API_URL } from '../auth/auth';
import { stripHtml } from '../utils/html';
import { TIME_CONTROL_CONFIG } from '../constants/tournamentConstants';
import { SEO } from '../components/SEO';
import { getAbsoluteUrl, getSiteOrigin } from '../utils/url';
import { getSocket } from '../net/socket';
import { formatDate } from '../utils/locale';

export interface TournamentPrize {
  rank: number;
  title: string;
  description?: string;
  coins?: number;
  items?: Array<{ id: string; quantity: number }>;
}

export interface Tournament {
  _id: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline?: string | null;
  maxPlayers?: number | null;
  minElo?: number | null;
  maxElo?: number | null;
  prizes?: TournamentPrize[];
  timeControl?: 'blitz' | 'rapid' | 'standard' | 'slow';
  format?: 'swiss' | 'roundrobin';
  maxRounds?: number | null;
  requireApproval?: boolean;
  status: 'registration' | 'active' | 'finished' | 'deadline_closed';
  createdBy: string;
  players: string[];
  pendingPlayers?: string[];
  currentRound: number;
  standings: Array<{
    uid: string; name?: string; picture?: string; elo?: number;
    points: number; played: number; wins: number; draws: number; losses: number; byes?: number;
  }>;
  announcements?: { id: number; message: string; author: string; createdAt: number }[];
  champion?: { uid: string; name: string; points: number } | null;
  createdAt: number;
  updatedAt: number;
}

function getStatusLabels(t: any) {
  return {
    registration:    { label: t('tournaments.status.registration'),    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    active:          { label: t('tournaments.status.active'),          cls: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' },
    deadline_closed: { label: t('tournaments.status.deadline_closed'), cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    finished:        { label: t('tournaments.status.finished'),        cls: 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/50 border-black/10 dark:border-white/10' },
  };
}

export function TournamentsPage() {
  const { t, i18n } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const STATUS_LABELS: Record<string, { label: string; cls: string }> = getStatusLabels(t);

  const TC_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(TIME_CONTROL_CONFIG).map(([key, val]) => [key, `${val.icon} ${val.label}`])
  );
  const FMT_LABELS: Record<string, string> = { 
    swiss: t('tournaments.formats.swiss'), 
    roundrobin: t('tournaments.formats.roundrobin') 
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tournaments`);
      const data = await res.json();
      if (data.ok) setTournaments(data.tournaments || []);
    } catch (e) {
      logger.error('Failed to load tournaments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
    const socket = getSocket();
    const handleUpdate = () => {
      loadTournaments();
    };
    socket.on('tournaments:update', handleUpdate);
    return () => {
      socket.off('tournaments:update', handleUpdate);
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10">
      <SEO 
        title={t('tournaments.meta.title')}
        description={t('tournaments.meta.description')}
        url={getAbsoluteUrl('/tournaments')}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": t('tournaments.listTitle'),
            "description": t('tournaments.listDesc'),
            "itemListElement": tournaments.slice(0, 10).map((tour, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "Event",
                "name": tour.name,
                "description": tour.description,
                "startDate": tour.startDate,
                "endDate": tour.endDate,
                "eventStatus": tour.status === 'active' ? "https://schema.org/EventScheduled" : "https://schema.org/EventRescheduled",
                "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
                "location": {
                  "@type": "VirtualLocation",
                  "url": getAbsoluteUrl(`/tournaments/${tour._id}`)
                }
              }
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": t('tournaments.meta.home'),
                "item": getSiteOrigin()
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t('tournaments.meta.tournaments'),
                "item": getAbsoluteUrl('/tournaments')
              }
            ]
          }
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            {t('tournaments.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-white/50 mt-1">{t('tournaments.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-600 dark:text-white/50 animate-pulse font-medium">{t('tournaments.loading')}</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 bg-slate-100 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-white/30 text-4xl">🏆</div>
          <p className="text-slate-600 dark:text-white/50 font-medium">{t('tournaments.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {tournaments.map(tour => {
            const st = STATUS_LABELS[tour.status] ?? STATUS_LABELS.finished;
            const parseDate = (d?: string | null) => {
              if (!d) return null;
              const p = new Date(d);
              if (!isNaN(p.getTime())) return p;
              const iso = d.replace(' ', 'T');
              const pIso = new Date(iso);
              return isNaN(pIso.getTime()) ? null : pIso;
            };
            const deadline = parseDate(tour.registrationDeadline);
            return (
              <Link
                key={tour._id}
                to={`/tournaments/${tour._id}`}
                className="group block bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:border-xq-gold/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1"
              >
                <div className="h-1.5 bg-gradient-to-r from-xq-gold/60 to-xq-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="p-5">
                  {tour.champion && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                      <span className="text-yellow-400 text-xs font-bold">🏆 {t('tournaments.champion', { name: tour.champion.name })}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border ${st.cls}`}>{st.label}</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-white/40">👥 {tour.players.length}{tour.maxPlayers ? `/${tour.maxPlayers}` : ''}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-xq-gold transition-colors">{tour.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-white/60 line-clamp-2 mb-3 h-10 leading-relaxed italic">
                    {tour.description ? stripHtml(tour.description) : t('tournaments.noDescription')}
                  </p>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold mb-3">
                    {tour.timeControl && <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/50">{TC_LABELS[tour.timeControl]}</span>}
                    {tour.format && <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/50">{FMT_LABELS[tour.format]}</span>}
                    {tour.maxRounds && <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/50">{t('tournaments.rounds', { count: tour.maxRounds })}</span>}
                    {tour.minElo && <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">{t('tournaments.minElo', { elo: tour.minElo })}</span>}
                    {tour.requireApproval && <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300">{t('tournaments.requireApproval')}</span>}
                    {tour.prizes && tour.prizes.length > 0 && <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">🎁 {t('tournaments.hasPrizes')}</span>}
                  </div>

                  {deadline && !isNaN(deadline.getTime()) && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-white/40 mt-3 text-xs">
                      <span className="text-orange-400">⏰</span>
                      <span>{t('tournaments.deadline')} {formatDate(deadline, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {!deadline && <div className="text-xs text-slate-400 dark:text-white/30 font-mono">{t('tournaments.createdAt')} {formatDate(tour.createdAt)}</div>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-20 border-t border-black/5 dark:border-white/5 pt-16 pb-12 px-4 max-w-6xl mx-auto">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                  <Trans i18nKey="tournaments.seoContent.arena.title">
                    Đấu trường <span className="text-red-500">Tranh Hùng</span>
                  </Trans>
               </h2>
               <p className="mt-6 text-sm text-slate-600 dark:text-white/40 leading-relaxed font-medium uppercase tracking-widest text-[11px]">
                  {t('tournaments.seoContent.arena.desc')}
               </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xs">01</div>
                  <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight">{t('tournaments.seoContent.features.formats.title')}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-white/40 leading-relaxed font-medium uppercase tracking-widest">
                     {t('tournaments.seoContent.features.formats.desc')}
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xs">02</div>
                  <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight">{t('tournaments.seoContent.features.prizes.title')}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-white/40 leading-relaxed font-medium uppercase tracking-widest">
                     {t('tournaments.seoContent.features.prizes.desc')}
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xs">03</div>
                  <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight">{t('tournaments.seoContent.features.experience.title')}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-white/40 leading-relaxed font-medium uppercase tracking-widest">
                     {t('tournaments.seoContent.features.experience.desc')}
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xs">04</div>
                  <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight">{t('tournaments.seoContent.features.honor.title')}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-white/40 leading-relaxed font-medium uppercase tracking-widest">
                     {t('tournaments.seoContent.features.honor.desc')}
                  </p>
               </div>
            </div>
         </div>
         
         <div className="mt-16 flex flex-wrap justify-center gap-4 border-t border-black/5 dark:border-white/5 pt-8">
            {['giaidocotuong', 'tranhhung', 'kyphungdichthu', 'cotuongonline'].map(tag => (
              <span key={tag} className="text-[9px] font-black text-slate-400 dark:text-white/10 uppercase tracking-[0.4em]">#{tag}</span>
            ))}
         </div>
      </div>
    </div>
  );
}

export default TournamentsPage;

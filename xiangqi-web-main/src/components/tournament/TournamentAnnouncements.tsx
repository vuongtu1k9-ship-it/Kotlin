import React from 'react';
import { useTranslation } from 'react-i18next';

interface TournamentAnnouncementsProps {
  tournament: any;
  isAdmin: boolean;
  announcement: string;
  setAnnouncement: (s: string) => void;
  announcing: boolean;
  onAnnounce: (e: React.FormEvent) => void;
}

export const TournamentAnnouncements: React.FC<TournamentAnnouncementsProps> = ({
  tournament,
  isAdmin,
  announcement,
  setAnnouncement,
  announcing,
  onAnnounce
}) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-4">
      {isAdmin && (
        <form onSubmit={onAnnounce} className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4">
          <div className="flex gap-3">
            <input
              value={announcement} onChange={e => setAnnouncement(e.target.value)}
              placeholder={t('tournaments.announcements.placeholder')} required
              className="flex-1 bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-white/30"
            />
            <button type="submit" disabled={announcing} className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
              {announcing ? '...' : t('tournaments.announcements.postAction')}
            </button>
          </div>
        </form>
      )}
      {!tournament.announcements || tournament.announcements.length === 0 ? (
        <div className="text-center py-16 text-slate-600 dark:text-white/40 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">{t('tournaments.announcements.empty')}</div>
      ) : (
        [...tournament.announcements].reverse().map((a: any) => (
          <div key={a.id} className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">{a.author}</span>
              <span className="text-slate-400 dark:text-white/30 text-xs">{new Date(a.createdAt).toLocaleString(i18n.language)}</span>
            </div>
            <p className="text-slate-800 dark:text-white/80 text-sm leading-relaxed">{a.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

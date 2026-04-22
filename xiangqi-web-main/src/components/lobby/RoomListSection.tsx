import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { LazyMount } from '../ui/LazyMount';
import { makeSlug } from '../../utils/slug';
import { Tab } from '../../hooks/useLobbyData';

const MiniBoard = lazy(() => import('../MiniBoard').then(m => ({ default: m.MiniBoard })));

interface RoomListSectionProps {
  rooms: any[];
  filtered: any[];
  tab: Tab;
  setTab: (t: Tab) => void;
  onJoin: (r: any) => void;
  onCreateRoom: () => void;
}

export const RoomListSection: React.FC<RoomListSectionProps> = ({
  rooms,
  filtered,
  tab,
  setTab,
  onJoin,
  onCreateRoom
}) => {
  const { t } = useTranslation();

  return (
    <Card
      className="min-h-[600px]"
      title={
        <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
          <div className="h-4 w-1 bg-[var(--cobalt-indigo)] rounded-full" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest font-heading">
            {t('lobby.roomList')}
          </h2>
        </div>
      }
      subtitle={t('lobby.roomListSubtitle')}
      headerRight={
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateRoom}
              className="flex-1 sm:flex-none h-9 px-4 text-[11px] font-extrabold uppercase tracking-widest bg-[var(--cobalt-indigo)] hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              + {t('lobby.createRoom')}
            </Button>
          </div>
          <Link to="/game" className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--cobalt-indigo)] hover:text-indigo-800 sm:ml-2">
            {t('common.viewAll')}
          </Link>
        </div>
      }
    >
      <Tabs
        value={tab}
        onChange={(val) => setTab(val as Tab)}
        tabs={[
          { key: 'live', label: t('lobby.tabs.live') },
          { key: 'open', label: t('lobby.tabs.open') },
          { key: 'finished', label: t('lobby.tabs.finished') },
          { key: 'all', label: t('lobby.tabs.all') },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.length === 0 && rooms.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[320px] rounded-3xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200 dark:border-white/5" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-600 dark:text-white/40 italic bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
            {t('lobby.noRoomsFiltered')}
          </div>
        ) : (
          filtered.map((r: any) => (
            <div
              key={r.roomId}
              className="group relative flex flex-col gap-4 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 shadow-sm transition-all duration-300 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />

              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400/80">
                      {r.puzzleName || r.boardType === 'puzzle' ? t('navbar.puzzles') : t('common.room')}
                    </span>
                    <code className="text-xs font-bold text-slate-800 dark:text-white/90">{r.roomId}</code>
                  </div>

                  {r.puzzleName && (
                    <div className="text-[11px] font-bold text-slate-800 dark:text-white/90 truncate mt-1 group-hover:text-xq-gold transition-colors">
                      {r.puzzleName}
                    </div>
                  )}

                  {(!r.started && !r.finished) && (
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-xq-gold/10 text-xq-gold text-[8px] font-black uppercase tracking-tighter w-fit">
                      {t('room.ready')}
                    </div>
                  )}
                  {r.finished && (
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-white/40 mt-1">
                      {t('room.finished')}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-white/40">{r.timeMode || 'standard'}</span>
                </div>
              </div>

              <Link
                to={`/game/${makeSlug(r.puzzleName || `${r.players?.red ? r.players.redName : (r.playerNames?.red || 'player')}-vs-${r.players?.black ? r.players.blackName : (r.playerNames?.black || 'player')}`, r.roomId)}`}
                aria-label="Xem chi tiết ván đấu"
                className="relative aspect-[9/10] w-full overflow-hidden rounded-[12px] bg-white/90 dark:bg-black/40 border border-black/5 dark:border-white/5 group-hover:border-black/20 dark:border-white/20 transition-colors"
              >
                <LazyMount fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse rounded-[12px]" />}>
                  <Suspense fallback={<div className="aspect-[9/10] bg-slate-100 dark:bg-white/5 animate-pulse" />}>
                    <MiniBoard board={r.thumbBoard} position={r.thumbPosition} />
                  </Suspense>
                </LazyMount>
              </Link>

              <div className="flex items-center justify-between mt-auto gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className={`h-3.5 w-3.5 rounded-full border border-black/40 ${r.players?.red ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-slate-200 dark:bg-white/10'} ${r.winner === 'red' ? 'ring-2 ring-xq-gold' : ''}`} />
                      <span className={`text-[11px] font-bold truncate ${(r.players?.red || r.playerNames?.red) ? 'text-slate-800 dark:text-white/80' : 'text-slate-400 dark:text-white/20 italic'} ${r.winner === 'red' ? 'text-xq-gold' : ''}`}>
                        {r.players?.red ? r.players.redName : (r.playerNames?.red || t('room.waitingPlayer'))}
                      </span>
                      {r.winner === 'red' && <span className="text-[10px] animate-pulse">👑</span>}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-white/10 italic shrink-0">VS</div>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                      {r.winner === 'black' && <span className="text-[10px] animate-pulse">👑</span>}
                      <span className={`text-[11px] font-bold truncate ${(r.players?.black || r.playerNames?.black) ? 'text-slate-800 dark:text-white/80' : 'text-slate-400 dark:text-white/20 italic'} ${r.winner === 'black' ? 'text-xq-gold' : ''}`}>
                        {r.players?.black ? r.players.blackName : (r.playerNames?.black || t('room.waitingPlayer'))}
                      </span>
                      <div className={`h-3.5 w-3.5 rounded-full border border-black/40 ${r.players?.black ? 'bg-slate-200 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-slate-200 dark:bg-white/10'} ${r.winner === 'black' ? 'ring-2 ring-xq-gold' : ''}`} />
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-white/30 flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                      <span>👁 {Array.isArray(r.spectators) ? r.spectators.length : (r.spectators || 0)}</span>
                      <span className="text-slate-400 dark:text-white/10">•</span>
                      <span>⚔️ {r.moveCount || 0}</span>
                    </div>
                    {r.finished && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--cobalt-indigo)] bg-indigo-500/10 px-2 py-0.5 rounded">
                        {r.winReason || t('common.finished')}
                      </span>
                    )}
                  </div>
                </div>

                {!r.finished && !r.started && (
                  <div className="flex shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onJoin(r)}
                      className="px-4 py-1.5 h-auto text-[11px] font-black uppercase tracking-widest"
                    >
                      {t('room.join')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

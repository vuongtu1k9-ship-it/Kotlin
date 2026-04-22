import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface MoveListProps {
  history: any[];
  historyViewIndex?: number | null;
  setHistoryViewIndex?: (fn: (i: number | null) => number | null) => void;
  exitHistoryView?: () => void;
  /** When set, renders the progress slider at the top */
  replayTotal?: number;
  onSeek?: (index: number | null) => void;
  className?: string;
}

export const MoveList: React.FC<MoveListProps> = React.memo(({
  history = [],
  historyViewIndex,
  setHistoryViewIndex,
  exitHistoryView,
  replayTotal,
  onSeek,
  className = ""
}) => {
  const { t } = useTranslation();
  const [autoplay, setAutoplay] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const hasControls = !!setHistoryViewIndex && history.length > 0;
  const curIndex = historyViewIndex === null || historyViewIndex === undefined ? history.length : historyViewIndex;

  // Piece name display
  const pieceName = (type: string) => {
    return t(`common.pieces.${type}`);
  };

  const formatMove = (m: any) => {
    if (!m) return '';
    const piece = m.piece ? pieceName(m.piece.type) : '';
    const cap = m.capturedPiece ? ` ×${pieceName(m.capturedPiece.type)}` : '';
    return `${piece} ${m.from.row},${m.from.col}→${m.to.row},${m.to.col}${cap}`;
  };

  const nav = useCallback((fn: (i: number | null) => number | null) => {
    setAutoplay(false);
    setHistoryViewIndex?.(fn);
  }, [setHistoryViewIndex]);

  // Stable setter ref to avoid re-triggering autoplay interval on every board update
  const setterRef = useRef(setHistoryViewIndex);
  useEffect(() => { setterRef.current = setHistoryViewIndex; }, [setHistoryViewIndex]);

  // Autoplay: advance 1 move every 1.2s
  useEffect(() => {
    if (!autoplay || !hasControls) return;

    let timerId: any = null;
    const tickAutoplay = () => {
      setterRef.current?.((i) => {
        const cur = i === null ? history.length : i;
        if (cur >= history.length) {
          setAutoplay(false);
          return null;
        }
        timerId = setTimeout(tickAutoplay, 1500);
        return cur + 1;
      });
    };

    timerId = setTimeout(tickAutoplay, 1500);
    return () => { if (timerId) clearTimeout(timerId); };
  }, [autoplay, history.length, hasControls]);



  const btnClass = 'inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-10 transition-all border border-white/5 active:scale-90';

  return (
    <div className={`flex flex-col ${className} bg-[#0D1117]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden`}>
      {/* Replay Controls (Player/Seeker) */}
      <div className="flex flex-col border-b border-white/5">
        {replayTotal !== undefined && onSeek && (
          <div className="px-4 py-4 bg-white/[0.02]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t('game.moveList.progress')}</span>
              <span className="text-[10px] font-black text-xq-gold font-mono bg-xq-gold/10 px-2 py-0.5 rounded-md border border-xq-gold/20">{curIndex} / {replayTotal}</span>
            </div>
            <input
              type="range" min={0} max={replayTotal} value={curIndex}
              aria-label={t('game.moveList.progress')}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                onSeek(v >= replayTotal ? null : v);
              }}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-xq-gold hover:accent-white transition-all"
            />
          </div>
        )}

        {hasControls && (
          <div className="flex items-center justify-between px-4 py-3 bg-black/20">
            <div className="flex items-center gap-1.5">
              <button className={btnClass} title={t('game.moveList.first')} onClick={() => nav(() => 0)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /></svg>
              </button>
              <button className={btnClass} title={t('game.moveList.prev')} onClick={() => nav((i) => Math.max(0, (i === null ? history.length : i) - 1))}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            </div>

            <button
              className={`h-10 px-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all
                ${autoplay ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-xq-gold text-black hover:bg-white'}`}
              onClick={() => {
                if (!autoplay && (historyViewIndex === null || historyViewIndex === undefined)) setHistoryViewIndex?.(() => 0);
                setAutoplay(v => !v);
              }}
            >
              {autoplay ? (
                <><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> {t('game.moveList.pause')}</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m7 3 14 9-14 9V3z" /></svg> {t('game.moveList.play')}</>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button className={btnClass} title={t('game.moveList.next')} onClick={() => nav((i) => (i === null ? null : (i + 1 >= history.length ? null : i + 1)))}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <button className={btnClass} title={t('game.moveList.last')} onClick={() => { setAutoplay(false); exitHistoryView?.(); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17 5-5-5-5M6 17l5-5-5-5" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto min-h-[120px] max-h-[300px] xl:max-h-[460px] custom-scrollbar pr-1 bg-black/10"
      >
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-20">
            <div className="text-4xl mb-3">♟️</div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('game.moveList.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-white/5">
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
              <React.Fragment key={i}>
                {[0, 1].map((j) => {
                  const idx = i * 2 + j;
                  const move = history[idx];
                  if (!move) return <div key={idx} className="bg-transparent" />;

                  const isBlack = idx % 2 === 1;
                  const isCurrent = historyViewIndex === (idx + 1) || (historyViewIndex === null && idx === history.length - 1);

                  return (
                    <button
                      key={idx}
                      data-active={isCurrent || undefined}
                      onClick={() => setHistoryViewIndex?.(() => idx + 1)}
                      className={`
                        flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-l-2
                        ${isCurrent
                          ? 'bg-xq-gold/20 text-xq-gold border-xq-gold shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]'
                          : 'bg-white/[0.01] text-white/60 border-transparent hover:bg-white/[0.05] hover:text-white/80'}
                      `}
                    >
                      <span className="w-4 text-[10px] opacity-60 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isBlack ? 'bg-slate-800 border border-white/20' : 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]'}`} />
                      <span className="truncate uppercase tracking-tight text-[11px] font-mono">{formatMove(move)}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* History Status / Info Footer */}
      {typeof historyViewIndex === 'number' && (
        <div className="px-4 py-3 bg-xq-gold/10 border-t border-xq-gold/20 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-xq-gold animate-pulse" />
            <span className="text-[10px] font-black text-xq-gold uppercase tracking-[0.2em]">{historyViewIndex === 0 ? t('game.moveList.initial') : t('game.moveList.viewMove', { index: historyViewIndex })}</span>
          </div>
          <button
            onClick={exitHistoryView}
            className="px-3 py-1.5 bg-xq-gold text-black text-[10px] font-black uppercase rounded-lg hover:bg-white transition-all active:scale-95"
          >
            {t('game.moveList.returnToLive')}
          </button>
        </div>
      )}
    </div>
  );
});

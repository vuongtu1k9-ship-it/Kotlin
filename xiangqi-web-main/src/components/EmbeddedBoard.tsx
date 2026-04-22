import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Board } from './Board';
import { fenToBoard } from '../utils/fen';
import { logger } from '../utils/logger';

interface EmbeddedBoardProps {
  fen: string;
  moves?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

const parseUCI = (uci: string) => {
  if (!uci) return null;
  const match = uci.trim().match(/^([a-i])(\d+)([a-i])(\d+)$/);
  if (!match) return null;
  const [, f1, r1, f2, r2] = match;
  return {
    from: { row: 9 - parseInt(r1, 10), col: f1.charCodeAt(0) - 'a'.charCodeAt(0) },
    to: { row: 9 - parseInt(r2, 10), col: f2.charCodeAt(0) - 'a'.charCodeAt(0) }
  };
};

export const EmbeddedBoard: React.FC<EmbeddedBoardProps> = ({ fen, moves = '', title, size = 'md' }) => {
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<any>(null);

  const boardData = useMemo(() => {
    try {
      if (!fen) throw new Error('FEN is empty');
      return fenToBoard(fen);
    } catch (e) {
      logger.error('EmbeddedBoard FEN parse failed', e);
      return null;
    }
  }, [fen]);

  const moveList = useMemo(() => {
    if (!moves) return [];
    return moves.split(/\s+/).filter(Boolean).map(parseUCI).filter(Boolean);
  }, [moves]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= moveList.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, moveList.length]);
  
  const widthClass = size === 'sm' ? 'max-w-[280px]' : size === 'lg' ? 'max-w-[600px]' : 'max-w-[420px]';

  if (!boardData) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-500 text-xs rounded-xl italic">
        ⚠️ Không thể tải bàn cờ (Mã FEN không hợp lệ).
      </div>
    );
  }

  return (
    <div className={`embedded-board-container ${widthClass} w-full mx-auto my-6 rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-black/60 shadow-2xl`}>
      {title && (
        <div className="px-4 py-2 bg-slate-200 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-xq-gold tracking-widest leading-none">{title}</span>
        </div>
      )}
      
      <div className="p-4">
        <Board
          key={`${fen}-${moves}-${replayIndex === 0 && !isPlaying ? 'init' : 'active'}`}
          initialBoard={boardData.board}
          initialPlayer={boardData.sideToMove}
          replay={(replayIndex > 0 || isPlaying) ? {
            history: moveList as any,
            index: replayIndex
          } : undefined}
          onReplayIndexChange={(idx) => {
            setReplayIndex(idx || 0);
            if (idx === 0) setIsPlaying(false);
          }}
          hideSidebar
          hideLobby
          moveListBelow={false}
        />
        
        {moveList.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-1 bg-white/[0.03] p-2 rounded-2xl border border-black/5">
            <button
              onClick={() => { setReplayIndex(0); setIsPlaying(false); }}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
              title="Về đầu"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => { setReplayIndex(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
              title="Lùi"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-full transition-all ${isPlaying ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}
              title={isPlaying ? 'Tạm dừng' : 'Phát lại'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            
            <button
              onClick={() => { setReplayIndex(prev => Math.min(moveList.length, prev + 1)); setIsPlaying(false); }}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
              title="Tiếp"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="mx-2 px-3 py-1 bg-slate-200 dark:bg-white/5 rounded-lg text-[10px] font-black text-slate-500 dark:text-white/40 tabular-nums uppercase tracking-widest">
              {replayIndex} / {moveList.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

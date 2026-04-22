import React, { useMemo } from 'react';
import { Piece as PieceView } from './Piece';
import { legacyPositionToBoard } from '../utils/boardUtils';
import { fenToBoard } from '../utils/fen';
import { logger } from '../utils/logger';
import { LazyMount } from './ui/LazyMount';

type Props = {
  position?: string[] | null;
  board?: any;
  fen?: string | null;
  size?: number;
  eager?: boolean;
};

const DEFAULT_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

export const MiniBoard: React.FC<Props> = React.memo(({ position, board, fen, eager = false }) => {
  const b = useMemo(() => {
    let src = board ?? position;
    if (typeof src === 'string' && src.startsWith('[')) {
      try { src = JSON.parse(src); } catch (e) { logger.debug('MiniBoard JSON.parse failed', e); }
    }
    if (Array.isArray(src) && src.length === 10 && Array.isArray(src[0])) return src as any;
    if (Array.isArray(src) && src.length && typeof src[0] === 'string') return legacyPositionToBoard(src as any);
    
    const activeFen = fen || DEFAULT_FEN;
    try { 
      const result = fenToBoard(activeFen);
      return result.board; 
    } catch (e) { 
      logger.debug('MiniBoard fenToBoard failed', e); 
      // Fallback to default if custom FEN failed
      if (activeFen !== DEFAULT_FEN) {
        try { return fenToBoard(DEFAULT_FEN).board; } catch (e2) {}
      }
    }
    return null;
  }, [board, position, fen]);

  if (!Array.isArray(b) || b.length !== 10) {
    return <div className="rounded-lg border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-black/10 text-xs text-slate-600 dark:text-white/40 px-2 py-1">(no board)</div>;
  }

  const CELL = 100;
  const MARGIN = 50;
  const WIDTH = 900;
  const HEIGHT = 1000;

  const xc = (c: number) => MARGIN + c * CELL;
  const yc = (r: number) => MARGIN + r * CELL;

  const content = (
    <>
      <svg width="100%" height="100%" className="absolute inset-0 xq-miniboard-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {(() => {
          const stroke = 'currentColor';
          const sw = 1.6;
          const xStart = xc(0);
          const xEnd = xc(8);
          const yStart = yc(0);
          const yEnd = yc(9);

          const marks = [[2,1],[2,7],[7,1],[7,7],[3,0],[3,2],[3,4],[3,6],[3,8],[6,0],[6,2],[6,4],[6,6],[6,8]];

          return (
            <>
              {Array.from({ length: 10 }).map((_, r) => (
                <line key={`h-${r}`} x1={xStart} y1={yc(r)} x2={xEnd} y2={yc(r)} stroke={stroke} strokeWidth={sw} />
              ))}
              {Array.from({ length: 9 }).map((_, c) => {
                const x = xc(c);
                if (c === 0 || c === 8) {
                  return <line key={`v-${c}`} x1={x} y1={yStart} x2={x} y2={yEnd} stroke={stroke} strokeWidth={sw} />;
                }
                return (
                  <g key={`v-${c}`}>
                    <line x1={x} y1={yStart} x2={x} y2={yc(4)} stroke={stroke} strokeWidth={sw} />
                    <line x1={x} y1={yc(5)} x2={x} y2={yEnd} stroke={stroke} strokeWidth={sw} />
                  </g>
                );
              })}
              <line x1={xc(3)} y1={yc(0)} x2={xc(5)} y2={yc(2)} stroke={stroke} strokeWidth={sw} />
              <line x1={xc(5)} y1={yc(0)} x2={xc(3)} y2={yc(2)} stroke={stroke} strokeWidth={sw} />
              <line x1={xc(3)} y1={yc(7)} x2={xc(5)} y2={yc(9)} stroke={stroke} strokeWidth={sw} />
              <line x1={xc(5)} y1={yc(7)} x2={xc(3)} y2={yc(9)} stroke={stroke} strokeWidth={sw} />

              {/* traditional marks */}
              {marks.map(([r, c]) => {
                const x = xc(c);
                const y = yc(r);
                const s = CELL * 0.12;
                const p = CELL * 0.05;
                const paths = [];
                if (c > 0) paths.push(`M ${x - p - s} ${y - p} L ${x - p} ${y - p} L ${x - p} ${y - p - s}`);
                if (c < 8) paths.push(`M ${x + p + s} ${y - p} L ${x + p} ${y - p} L ${x + p} ${y - p - s}`);
                if (c > 0) paths.push(`M ${x - p - s} ${y + p} L ${x - p} ${y + p} L ${x - p} ${y + p + s}`);
                if (c < 8) paths.push(`M ${x + p + s} ${y + p} L ${x + p} ${y + p} L ${x + p} ${y + p + s}`);
                return (
                  <g key={`mark-${r}-${c}`} stroke={stroke} strokeWidth={1.2} fill="none" opacity={0.6}>
                    {paths.map((p, i) => <path key={i} d={p} />)}
                  </g>
                );
              })}
            </>
          );
        })()}
      </svg>

      {b.map((row: any, r: number) => {
        if (!Array.isArray(row)) return null;
        return row.map((p: any, c: number) => {
          if (!p || !p.type || !p.side) return null;
          return (
            <div
              key={`${p.id || `${r}-${c}`}`}
              className="absolute flex items-center justify-center"
              style={{ 
                left: `${((xc(c) - CELL / 2) / WIDTH) * 100}%`, 
                top: `${((yc(r) - CELL / 2) / HEIGHT) * 100}%`, 
                width: `${(CELL / WIDTH) * 100}%`, 
                height: `${(CELL / HEIGHT) * 100}%` 
              }}
            >
              <div className="w-[90%] h-[90%]">
                <PieceView type={p.type} side={p.side} lazy={true} />
              </div>
            </div>
          );
        });
      })}
    </>
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl border border-amber-900/10 dark:border-white/5 bg-[#EAC996] dark:bg-black/15 xq-miniboard shadow-sm text-amber-900/[0.45] dark:text-white/[0.30]"
      style={{ 
        aspectRatio: '9/10',
        ['--cell' as any]: `100%`,
        ['--piece' as any]: `100%`,
      }}
    >
      {eager ? content : <LazyMount rootMargin="800px" className="h-full w-full">{content}</LazyMount>}
    </div>
  );
});

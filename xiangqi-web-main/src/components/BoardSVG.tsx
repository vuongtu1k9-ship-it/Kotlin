import React from 'react';

const BOARD_ROWS = 10;
const BOARD_COLS = 9;
const CELL = 60;

interface BoardSVGProps {
  highlightZones?: ('palace' | 'river')[];
}

export const BoardSVG: React.FC<BoardSVGProps> = React.memo(({ highlightZones = [] }) => {
  const x0 = CELL / 2;
  const x1 = BOARD_COLS * CELL - CELL / 2;
  const y0 = CELL / 2;
  const y1 = BOARD_ROWS * CELL - CELL / 2;
  const stroke = 'var(--board-line)';
  const sw = 1.8;
  const xc = (c: number) => c * CELL + CELL / 2;
  const yc = (r: number) => r * CELL + CELL / 2;
  const yRiverTop = yc(4);
  const yRiverBot = yc(5);

  const showPalace = highlightZones.includes('palace');
  const showRiver = highlightZones.includes('river');

  const CrossMark = ({ r, c }: { r: number, c: number }) => {
    const x = xc(c);
    const y = yc(r);
    const size = CELL * 0.12;
    const padding = CELL * 0.05;
    const paths = [];

    // Top-left
    if (c > 0) paths.push(`M ${x - padding - size} ${y - padding} L ${x - padding} ${y - padding} L ${x - padding} ${y - padding - size}`);
    // Top-right
    if (c < BOARD_COLS - 1) paths.push(`M ${x + padding + size} ${y - padding} L ${x + padding} ${y - padding} L ${x + padding} ${y - padding - size}`);
    // Bottom-left
    if (c > 0) paths.push(`M ${x - padding - size} ${y + padding} L ${x - padding} ${y + padding} L ${x - padding} ${y + padding + size}`);
    // Bottom-right
    if (c < BOARD_COLS - 1) paths.push(`M ${x + padding + size} ${y + padding} L ${x + padding} ${y + padding} L ${x + padding} ${y + padding + size}`);

    return (
      <g stroke={stroke} strokeWidth={1.2} fill="none" opacity={0.6}>
        {paths.map((p, i) => <path key={i} d={p} />)}
      </g>
    );
  };

  const marks = [[2,1],[2,7],[7,1],[7,7],[3,0],[3,2],[3,4],[3,6],[3,8],[6,0],[6,2],[6,4],[6,6],[6,8]];

  return (
    <svg
      className="xq-board-svg"
      viewBox={`0 0 ${BOARD_COLS * CELL} ${BOARD_ROWS * CELL}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Zone Highlights */}
      {showRiver && (
        <rect 
          x={xc(0)} y={yc(4)} 
          width={xc(8) - xc(0)} height={yc(5) - yc(4)} 
          fill="rgba(59, 130, 246, 0.15)" 
          className="animate-pulse"
        />
      )}
      
      {showPalace && (
        <>
          {/* Red Palace */}
          <rect 
            x={xc(3)} y={yc(7)} 
            width={xc(5) - xc(3)} height={yc(9) - yc(7)} 
            fill="rgba(239, 68, 68, 0.15)" 
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
          {/* Black Palace */}
          <rect 
            x={xc(3)} y={yc(0)} 
            width={xc(5) - xc(3)} height={yc(2) - yc(0)} 
            fill="rgba(239, 68, 68, 0.15)" 
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        </>
      )}

      {/* outer border */}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="transparent" stroke={stroke} strokeWidth={2.5} />

      {/* horizontal lines (10 ranks) */}
      {Array.from({ length: BOARD_ROWS }).map((_, r) => (
        <line key={`h-${r}`} x1={x0} y1={yc(r)} x2={x1} y2={yc(r)} stroke={stroke} strokeWidth={sw} />
      ))}

      {/* vertical lines (9 files) */}
      {Array.from({ length: BOARD_COLS }).map((_, c) => {
        const x = xc(c);
        const isEdge = c === 0 || c === BOARD_COLS - 1;
        if (isEdge) return <line key={`v-${c}`} x1={x} y1={y0} x2={x} y2={y1} stroke={stroke} strokeWidth={sw} />;
        return (
          <g key={`v-${c}`}>
            <line x1={x} y1={y0} x2={x} y2={yRiverTop} stroke={stroke} strokeWidth={sw} />
            <line x1={x} y1={yRiverBot} x2={x} y2={y1} stroke={stroke} strokeWidth={sw} />
          </g>
        );
      })}

      {/* palace diagonals */}
      <g stroke={stroke} strokeWidth={sw} opacity={0.8}>
        <line x1={xc(3)} y1={yc(0)} x2={xc(5)} y2={yc(2)} />
        <line x1={xc(5)} y1={yc(0)} x2={xc(3)} y2={yc(2)} />
        <line x1={xc(3)} y1={yc(7)} x2={xc(5)} y2={yc(9)} />
        <line x1={xc(5)} y1={yc(7)} x2={xc(3)} y2={yc(9)} />
      </g>

      {/* traditional marks */}
      {marks.map(([r, c]) => (
        <CrossMark key={`mark-${r}-${c}`} r={r} c={c} />
      ))}

      {/* river text */}
      <text 
        x={(x0 + x1) / 2} 
        y={(yRiverTop + yRiverBot) / 2} 
        fill="var(--board-river-text)" 
        fontFamily="'Outfit', sans-serif" 
        fontSize={CELL * 0.4} 
        fontWeight="900" 
        letterSpacing={CELL * 0.2} 
        dominantBaseline="middle" 
        textAnchor="middle"
        className="opacity-20 uppercase"
      >
        cotuong.xyz
      </text>
    </svg>
  );
});

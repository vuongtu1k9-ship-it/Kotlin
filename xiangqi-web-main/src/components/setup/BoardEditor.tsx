import React from 'react';
import { Cell } from '../Cell';
import { Piece as PieceView } from '../Piece';
import type { Piece } from '../../types';

interface BoardEditorProps {
  board: (Piece | null)[][];
  isValidPlacement: (row: number, col: number) => boolean;
  onPlaceAt: (row: number, col: number) => void;
  boardRef?: React.RefObject<HTMLDivElement>;
}

const BOARD_ROWS = 10;
const BOARD_COLS = 9;
const CELL = 60;

export const BoardEditor: React.FC<BoardEditorProps> = ({ board, isValidPlacement, onPlaceAt, boardRef }) => {
  return (
    <div ref={boardRef} className="xq-board-wrap">
      <svg className="xq-board-svg" viewBox={`0 0 ${BOARD_COLS * CELL} ${BOARD_ROWS * CELL}`} preserveAspectRatio="none">
        <rect x={30} y={30} width={480} height={540} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
        {Array.from({ length: 10 }).map((_, r) => (
          <line key={r} x1={30} y1={r * 60 + 30} x2={510} y2={r * 60 + 30} stroke="rgba(255,255,255,0.05)" />
        ))}
        {Array.from({ length: 9 }).map((_, c) => (
          <React.Fragment key={c}>
            <line x1={c * 60 + 30} y1={30} x2={c * 60 + 30} y2={270} stroke="rgba(255,255,255,0.05)" />
            <line x1={c * 60 + 30} y1={330} x2={c * 60 + 30} y2={570} stroke="rgba(255,255,255,0.05)" />
          </React.Fragment>
        ))}
        <path d="M 210 30 L 330 150 M 330 30 L 210 150 M 210 450 L 330 570 M 330 450 L 210 570" stroke="rgba(255,255,255,0.05)" strokeWidth={1} fill="none" />
        
        {/* traditional marks */}
        {[[2,1],[2,7],[7,1],[7,7],[3,0],[3,2],[3,4],[3,6],[3,8],[6,0],[6,2],[6,4],[6,6],[6,8]].map(([r,c]) => {
          const x = c * 60 + 30, y = r * 60 + 30, s = 8, p = 3;
          let d = "";
          if (c > 0) d += `M ${x-p-s} ${y-p} L ${x-p} ${y-p} L ${x-p} ${y-p-s} M ${x-p-s} ${y+p} L ${x-p} ${y+p} L ${x-p} ${y+p+s} `;
          if (c < 8) d += `M ${x+p+s} ${y-p} L ${x+p} ${y-p} L ${x+p} ${y-p-s} M ${x+p+s} ${y+p} L ${x+p} ${y+p} L ${x+p} ${y+p+s} `;
          return <path key={`${r}-${c}`} d={d} stroke="rgba(255,255,255,0.08)" strokeWidth={1} fill="none" />;
        })}

        <text
          x={270}
          y={300}
          fill="rgba(255,255,255,0.1)"
          fontFamily="'Outfit', sans-serif"
          fontSize={24}
          fontWeight="900"
          letterSpacing={3}
          dominantBaseline="middle"
          textAnchor="middle"
          className="uppercase"
          style={{ pointerEvents: 'none' }}
        >
          cotuong.xyz
        </text>
      </svg>
      <div className="xq-board-grid">
        {board.map((rowArr, r) => rowArr.map((p, c) => (
          <Cell
            key={`${r}-${c}`}
            row={r}
            col={c}
            isSelected={false}
            isValidMove={isValidPlacement(r, c)}
            onClick={() => onPlaceAt(r, c)}
          >
            {p && <PieceView type={p.type} side={p.side} />}
          </Cell>
        )))}
      </div>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Cell } from '../Cell';
import PieceView from '../Piece';
import { type Piece, type Position } from '../../types';

interface BoardGridProps {
  board: (Piece | null)[][];
  isFlipped: boolean;
  selectedCell: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position; capturedPiece?: Piece } | null;
  canInteract: boolean;
  pieceStyle?: string;
  onCellClick: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number, e: React.MouseEvent) => void;
  onCellLeave?: () => void;
}

export const BoardGrid: React.FC<BoardGridProps> = React.memo(({
  board,
  isFlipped,
  selectedCell,
  validMoves,
  lastMove,
  pieceStyle,
  onCellClick,
  onCellHover,
  onCellLeave
}) => {
  const { t } = useTranslation();
  
  const mapDisplayToBoard = (pos: { row: number; col: number }) => {
    if (!isFlipped) return pos;
    return { row: 10 - 1 - pos.row, col: 9 - 1 - pos.col };
  };

  return (
    <div className="xq-board-grid">
      {Array.from({ length: 10 }).map((_, r) => Array.from({ length: 9 }).map((_, c) => {
        const boardPos = mapDisplayToBoard({ row: r, col: c });
        const piece = board[boardPos.row]?.[boardPos.col];
        const coord = `${String.fromCharCode(65 + c)}${10 - r}`;
        const cellLabel = piece ? t('common.cellAriaLabelOccupied', { coord }) : t('common.cellAriaLabel', { coord });
        
        const isLastMoveTo = lastMove?.to.row === boardPos.row && lastMove?.to.col === boardPos.col;
        let animateFrom = null;
        if (isLastMoveTo && lastMove) {
          const fromDisplay = mapDisplayToBoard(lastMove.from);
          animateFrom = { dx: fromDisplay.col - c, dy: fromDisplay.row - r };
        }

        return (
          <Cell 
            key={`${r}-${c}`} 
            row={r} 
            col={c} 
            label={cellLabel}
            isSelected={selectedCell?.row === boardPos.row && selectedCell?.col === boardPos.col}
            isValidMove={validMoves.some(m => m.row === boardPos.row && m.col === boardPos.col)}
            isLastMoveFrom={lastMove?.from.row === boardPos.row && lastMove?.from.col === boardPos.col}
            isLastMoveTo={isLastMoveTo}
            onClick={() => onCellClick(r, c)}
            onMouseEnter={(e) => onCellHover?.(r, c, e)}
            onMouseLeave={onCellLeave}
          >
            {isLastMoveTo && lastMove?.capturedPiece && (
              <PieceView
                key={`ghost-${boardPos.row}-${boardPos.col}-${lastMove.from.row}-${lastMove.from.col}`}
                type={lastMove.capturedPiece.type}
                side={lastMove.capturedPiece.side}
                label={`${t(`game.sides.${lastMove.capturedPiece.side}`)} ${t(`common.pieces.${lastMove.capturedPiece.type}`)}`}
                style={pieceStyle}
                className="xq-piece-ghost"
              />
            )}
            {piece && (
              <PieceView
                key={piece.id || `piece-${boardPos.row}-${boardPos.col}`}
                type={piece.type}
                side={piece.side}
                label={`${t(`game.sides.${piece.side}`)} ${t(`common.pieces.${piece.type}`)}`}
                style={pieceStyle}
                animateFrom={animateFrom}
                onMouseEnter={(e) => onCellHover?.(r, c, e)}
                onMouseLeave={onCellLeave}
              />
            )}
          </Cell>
        );
      }))}
    </div>
  );
});

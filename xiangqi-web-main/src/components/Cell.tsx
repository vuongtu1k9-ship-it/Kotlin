import React from 'react';
import './Cell.css';

interface CellProps {
  row: number;
  col: number;
  label: string;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMoveFrom?: boolean;
  isLastMoveTo?: boolean;
  className?: string;
  /** legacy props from earlier square-cell implementation (kept for compatibility) */
  isRiver?: boolean;
  isPalace?: boolean;
  onClick: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  children?: React.ReactNode;
}

export const Cell: React.FC<CellProps> = React.memo(({
  row,
  col,
  label,
  isSelected,
  isValidMove,
  isLastMoveFrom,
  isLastMoveTo,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  const classes = [
    'xq-cell',
    isSelected && 'selected',
    isLastMoveFrom && 'last-move-from',
    isLastMoveTo && 'last-move-to',
    isValidMove && 'valid-setup-pos',
    (isValidMove && children) && 'capture',
    className,
  ].filter(Boolean).join(' ');

  const coord = `${String.fromCharCode(65 + col)}${10 - row}`;

  return (
    <div
      className={classes}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={label}
      aria-label={label}
    >
      {isValidMove && !children && <div className="xq-move-dot" />}
      {children}
    </div>
  );
});

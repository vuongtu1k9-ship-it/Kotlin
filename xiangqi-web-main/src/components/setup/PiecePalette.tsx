import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieceSide, PieceType } from '../../types';
import { ExportButtons } from '../ExportButtons';
import { FenImporter } from './FenImporter';
import { boardToFen } from '../../utils/fen';

export type PalettePick = { side: PieceSide; type: PieceType } | { kind: 'erase' };

interface PiecePaletteProps {
  pick: PalettePick;
  onSelect: (pick: PalettePick) => void;
  onClearBoard: () => void;
  onImportFen: () => void;
  fenValue: string;
  onFenChange: (v: string) => void;
  board: any[][];
  playSide: PieceSide;
  boardRef: React.RefObject<HTMLDivElement>;
}

const pieceOrder: PieceType[] = ['general', 'advisor', 'elephant', 'chariot', 'cannon', 'horse', 'soldier'];

export const PiecePalette: React.FC<PiecePaletteProps> = ({ 
  pick, onSelect, onClearBoard, onImportFen, fenValue, onFenChange, board, playSide, boardRef 
}) => {
  const { t } = useTranslation();
  const selectedLabel = 'kind' in pick 
    ? t('setup.palette.erase') 
    : `${pick.side === 'red' ? t('setup.palette.redPrefix') : t('setup.palette.blackPrefix')} • ${t(`common.pieces.${pick.type}`).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <div className="p-3 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/90 dark:bg-black/40 flex items-center justify-center border border-black/10 dark:border-white/10 shadow-inner">
          {'kind' in pick ? <span className="text-lg">🧽</span> : <img src={`/pieces/${pick.side}-${pick.type}.svg`} alt="pick" className="h-7 w-7" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">{t('setup.palette.selecting')}</span>
          <span className="text-[10px] font-black text-xq-gold">{selectedLabel}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {pieceOrder.map(t => (
            <button key={`b-${t}`} onClick={() => onSelect({ side: 'black', type: t })} className={`h-10 rounded-lg border transition-all flex items-center justify-center ${!('kind' in pick) && pick.side === 'black' && pick.type === t ? 'bg-black/20 dark:bg-white/20 border-white/50' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10'}`}>
              <img src={`/pieces/black-${t}.svg`} className="h-7 w-7" alt="black" />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {pieceOrder.map(t => (
            <button key={`r-${t}`} onClick={() => onSelect({ side: 'red', type: t })} className={`h-10 rounded-lg border transition-all flex items-center justify-center ${!('kind' in pick) && pick.side === 'red' && pick.type === t ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10'}`}>
              <img src={`/pieces/red-${t}.svg`} className="h-7 w-7" alt="red" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onSelect({ kind: 'erase' })} className={`h-10 rounded-xl border text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${'kind' in pick ? 'bg-black/20 dark:bg-white/20 border-white/40 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:bg-white/10'}`}>
          <span>🧽</span> {t('setup.palette.erase')}
        </button>
        <button onClick={onClearBoard} className="h-10 rounded-xl border border-red-500/20 bg-red-500/5 text-[9px] font-black uppercase text-red-500/60 hover:bg-red-500/10 transition-all">
          🧹 {t('setup.palette.clear')}
        </button>
      </div>
      <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
        <ExportButtons 
          board={board} 
          currentPlayer={playSide} 
          boardRef={boardRef as any} 
          className="grid grid-cols-2 gap-3" 
          initialFen={boardToFen(board, playSide)}
        />
        <FenImporter 
          fenValue={fenValue} 
          onFenChange={onFenChange} 
          onImport={onImportFen} 
          label="" 
        />
      </div>
    </div>
  );
};

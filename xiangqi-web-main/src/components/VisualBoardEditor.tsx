import React, { useState, useRef } from 'react';
import { X, Save, Eraser, Play, MousePointer2 } from 'lucide-react';
import { PiecePalette, PalettePick } from './setup/PiecePalette';
import { BoardEditor } from './setup/BoardEditor';
import { Board } from './Board';
import { createEmptyBoard, createInitialBoard } from '../state/initialBoard';
import { boardToFen, fenToBoard } from '../utils/fen';
import { Piece, PieceSide } from '../types';
import { useToast } from './ui/Toast';

interface VisualBoardEditorProps {
  initialFen?: string;
  initialMoves?: string;
  onSave: (data: { fen: string; moves: string }) => void;
  onClose: () => void;
}

export const VisualBoardEditor: React.FC<VisualBoardEditorProps> = ({ 
  initialFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
  initialMoves = '',
  onSave, 
  onClose 
}) => {
  const toast = useToast();
  const [mode, setMode] = useState<'setup' | 'moves'>('setup');
  // Use fenToBoard to get both board and sideToMove
  const [board, setBoard] = useState<(Piece | null)[][]>(() => fenToBoard(initialFen).board);
  const [sideToMove, setSideToMove] = useState<PieceSide>(() => fenToBoard(initialFen).sideToMove);
  
  const [pick, setPick] = useState<PalettePick>({ side: 'red', type: 'general' });
  const [recordedMoves, setRecordedMoves] = useState<string>(initialMoves);
  const boardRef = useRef<HTMLDivElement>(null);

  const [importFenValue, setImportFenValue] = useState('');

  const handleImportFen = () => {
    if (!importFenValue.trim()) return;
    try {
      const res = fenToBoard(importFenValue.trim());
      setBoard(res.board);
      setSideToMove(res.sideToMove);
      setImportFenValue('');
    } catch (e) {
      toast.error('Mã FEN không hợp lệ!');
    }
  };

  // Placement mode handlers
  const handlePlaceAt = (r: number, c: number) => {
    if (mode !== 'setup') return;
    const newBoard = board.map(row => [...row]);
    if ('kind' in pick && pick.kind === 'erase') {
      newBoard[r][c] = null;
    } else if (!('kind' in pick)) {
      newBoard[r][c] = { 
        type: pick.type, 
        side: pick.side,
        id: `piece-${Date.now()}-${r}-${c}`,
        position: { row: r, col: c }
      };
    }
    setBoard(newBoard);
  };

  const currentFen = boardToFen(board, sideToMove);

  const handleStateChange = (state: any) => {
    if (mode !== 'moves') return;
    if (!state.moveHistory) return;
    
    const moves = state.moveHistory.map((m: any) => {
      const f = m.from;
      const t = m.to;
      return `${String.fromCharCode(97 + f.col)}${9 - f.row}${String.fromCharCode(97 + t.col)}${9 - t.row}`;
    }).join(' ');
    setRecordedMoves(moves);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-xq-gold/20 flex items-center justify-center text-2xl text-xq-gold">🧩</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                Thiết kế bàn cờ bài học
              </h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">
                {mode === 'setup' ? 'Bước 1: Sắp xếp quân cờ' : 'Bước 2: Ghi lại trình tự nước đi'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-10 items-start">
          
          <div className="w-full lg:w-[480px] shrink-0">
            <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-inner">
              {mode === 'setup' ? (
                <BoardEditor 
                  board={board} 
                  isValidPlacement={() => true} 
                  onPlaceAt={handlePlaceAt} 
                  boardRef={boardRef}
                />
              ) : (
                <Board 
                  initialBoard={board} 
                  hideLobby 
                  hideSidebar={true}
                  moveListBelow={false}
                  side={sideToMove} 
                  onStateChange={handleStateChange}
                  key={currentFen} // Reset board state when switching to moves
                />
              )}
            </div>
            
            <div className="mt-6 p-5 bg-slate-50 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 font-mono text-[11px] break-all">
              <span className="text-xq-gold block mb-2 uppercase font-black tracking-widest">Mã FEN (Vị trí):</span>
              <code className="text-slate-600 dark:text-white/60">{currentFen}</code>
            </div>
          </div>

          <div className="flex-1 space-y-8 w-full">
            {/* Mode Switchers */}
            <div className="grid grid-cols-2 gap-3 bg-slate-100 dark:bg-black/20 p-1.5 rounded-2xl border border-black/5 dark:border-white/5">
              <button 
                onClick={() => setMode('setup')}
                className={`py-3.5 rounded-xl flex items-center justify-center gap-3 font-black text-xs uppercase transition-all ${mode === 'setup' ? 'bg-white dark:bg-xq-gold text-slate-900 dark:text-black shadow-xl' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <MousePointer2 className="w-4 h-4" /> 1. Sắp xếp vị trí
              </button>
              <button 
                onClick={() => { setMode('moves'); setRecordedMoves(''); }}
                className={`py-3.5 rounded-xl flex items-center justify-center gap-3 font-black text-xs uppercase transition-all ${mode === 'moves' ? 'bg-white dark:bg-xq-gold text-slate-900 dark:text-black shadow-xl' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <Play className="w-4 h-4" /> 2. Chơi/Ghi nước đi
              </button>
            </div>

            <div className="min-h-[400px]">
              {mode === 'setup' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/10 p-6">
                    <PiecePalette 
                      pick={pick} 
                      onSelect={setPick} 
                      onClearBoard={() => setBoard(createEmptyBoard())}
                      onImportFen={handleImportFen}
                      fenValue={importFenValue}
                      onFenChange={setImportFenValue}
                      board={board}
                      playSide={sideToMove}
                      boardRef={boardRef}
                    />
                  </div>

                   <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/10 space-y-4">
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Ai đi trước trong thế cờ này?</span>
                       <div className="flex gap-3">
                         <button 
                          onClick={() => setSideToMove('red')}
                          className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${sideToMove === 'red' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white dark:bg-black/20 border-black/5 dark:border-white/5 text-slate-400'}`}>Bên Đỏ ĐI TRƯỚC</button>
                         <button 
                          onClick={() => setSideToMove('black')}
                          className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${sideToMove === 'black' ? 'bg-slate-900 dark:bg-white border-slate-700 dark:border-white text-white dark:text-black shadow-lg shadow-white/10' : 'bg-white dark:bg-black/20 border-black/5 dark:border-white/5 text-slate-400'}`}>Bên Đen ĐI TRƯỚC</button>
                       </div>
                     </div>
                     <button 
                        onClick={() => {
                          const res = createInitialBoard();
                          setBoard(res);
                        }}
                        className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-600/20 transition-all flex items-center justify-center gap-2"
                      >
                         <Eraser className="w-4 h-4" /> Khôi phục bàn cờ mặc định
                      </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/10 space-y-6">
                     <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black text-xq-gold uppercase tracking-widest">Dãy nước đi ghi được (UCI)</h3>
                       <button 
                        onClick={() => { setRecordedMoves(''); setMode('setup'); setTimeout(() => setMode('moves'), 10); }}
                        className="text-[10px] font-black text-red-500 uppercase hover:underline"
                       >
                         Làm lại từ đầu
                       </button>
                     </div>
                     <div className="p-5 bg-white dark:bg-black/40 rounded-2xl min-h-[120px] border border-black/5 dark:border-white/5 font-mono text-base text-blue-600 dark:text-sky-400 flex flex-wrap gap-x-3 gap-y-2 shadow-inner">
                       {recordedMoves ? recordedMoves.split(' ').map((m, i) => (
                         <span key={i} className="px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">{m}</span>
                       )) : (
                         <span className="text-slate-400 dark:text-white/10 italic text-sm">Di chuyển các quân cờ trên bàn cờ bên trái để ghi lại nước đi...</span>
                       )}
                     </div>
                     
                     <div className="flex items-start gap-4 p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                       <span className="text-lg">💡</span>
                       <p className="text-xs text-slate-600 dark:text-amber-200/60 leading-relaxed font-medium">
                         Hãy thực hiện các nước đi mẫu. Hệ thống sẽ tự động lưu lại toàn bộ chuỗi di chuyển để tạo thành bàn cờ có thể xem lại (Replay) trong bài viết của bạn.
                       </p>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-black/5 dark:border-white/5 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-2xl font-black text-xs uppercase transition-all"
              >
                Đóng lại
              </button>
              <button 
                onClick={() => onSave({ fen: currentFen, moves: recordedMoves })}
                className="flex-[2] py-4.5 bg-blue-600 dark:bg-xq-gold hover:bg-blue-700 dark:hover:bg-yellow-500 text-white dark:text-black rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 dark:shadow-xq-gold/20 transition-all active:scale-95 hover:-translate-y-0.5"
              >
                <Save className="w-5 h-5" /> CHÈN VÀO BÀI VIẾT
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

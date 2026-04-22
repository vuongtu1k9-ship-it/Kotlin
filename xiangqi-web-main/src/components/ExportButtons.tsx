import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Piece, PieceSide } from '../types';
import { copyFenToClipboard, exportElementAsImage, exportGameAsVideo } from '../utils/export';
import { useToast } from './ui/Toast';
import { Copy, Image as ImageIcon, Video, Film, Download, ChevronDown, Loader2 } from 'lucide-react';
import { ExportProgressModal } from './ExportProgressModal';

interface ExportButtonsProps {
  board: (Piece | null)[][] | undefined;
  currentPlayer: PieceSide | undefined;
  boardRef: React.RefObject<HTMLElement> | undefined;
  className?: string;
  history?: any[];
  onSeek?: (idx: number | null) => void;
  initialFen?: string;
  uid?: string;
  type?: 'game' | 'puzzle';
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  board,
  currentPlayer,
  boardRef,
  className = "flex gap-1.5",
  history = [],
  onSeek,
  initialFen,
  uid,
  type = 'game'
}) => {
  const { t } = useTranslation();
  const { success, error: errorNotify, info } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [exportType, setExportType] = useState<'client' | 'server'>('client');
  const [exportFormat, setExportFormat] = useState<'mp4' | 'gif' | 'webm' | 'png'>('webm');
  const [ratio, setRatio] = useState<'16:9' | '9:16' | '1:1' | '9:10'>('9:10');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleExportFen = async () => {
    if (!board || !currentPlayer) return;
    try {
      await copyFenToClipboard(board, currentPlayer);
      success(t('game.export.copyFenSuccess'));
    } catch (err: any) {
      errorNotify(t('game.export.copyFenError'));
    }
  };

  const handleClientImage = async () => {
    if (!boardRef?.current) return;
    try {
      await exportElementAsImage(boardRef.current, `xiangqi_${Date.now()}`);
      success(t('game.export.saveImageSuccess'));
    } catch (err: any) {
      errorNotify(t('game.export.saveImageError'));
    }
  };

  const handleServerImage = async () => {
    if (!board || !currentPlayer) return;
    setIsExporting(true);
    setExportType('server');
    setExportFormat('png');
    try {
      const { boardToFen } = await import('../utils/fen');
      const fen = boardToFen(board, currentPlayer);
      
      let downloadUrl = '';
      let fileName = `xiangqi_hq_${ratio.replace(':','x')}_${Date.now()}.webp`;

      if (uid) {
        const url = `/api/export/image/${ratio.replace(':', 'x')}/${type}/${uid}.webp`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Server image export failed');
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      } else {
        // Fallback for custom positions (e.g., Sandbox)
        const response = await fetch('/api/export/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen, ratio }),
        });
        if (!response.ok) throw new Error('Server image export failed');
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 100);

      success(t('game.export.downloadHdSuccess'));
    } catch (err: any) {
      errorNotify(t('game.export.downloadHdError', { message: err.message }));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExporting(false);
      setProgress(null);
      info(t('game.export.cancelInfo'));
    }
  };

  const handleClientVideo = async () => {
    if (!boardRef?.current || !onSeek || history.length === 0) {
      errorNotify(t('game.export.noMovesError'));
      return;
    }
    
    setIsExporting(true);
    setExportType('client');
    setExportFormat('webm');
    setProgress({ current: 0, total: history.length });
    abortControllerRef.current = new AbortController();
    
    try {
      await exportGameAsVideo({
        historyLength: history.length,
        onSeek: async (idx) => {
          onSeek(idx === 0 ? 0 : idx); // Handle index 0 properly
        },
        boardElement: boardRef.current,
        fileName: `xiangqi_game_${Date.now()}`,
        onProgress: (current, total) => setProgress({ current, total }),
        signal: abortControllerRef.current.signal
      });
      if (!abortControllerRef.current.signal.aborted) {
        success(t('game.export.clientVideoSuccess'));
      }
    } catch (err: any) {
      if (err.message !== 'Aborted') {
        errorNotify(t('game.export.clientVideoError', { message: err.message }));
      }
    } finally {
      setIsExporting(false);
      setProgress(null);
      onSeek(null); // Return to live
    }
  };

  const handleServerExport = async (format: 'mp4' | 'gif') => {
    if (history.length === 0) {
      errorNotify(t('game.export.noMovesError'));
      return;
    }

    setIsExporting(true);
    setExportType('server');
    setExportFormat(format);
    setProgress({ current: 0, total: 100 });
    abortControllerRef.current = new AbortController();

    // Simulated progress for server
    let simulatedProgress = 0;
    const interval = setInterval(() => {
      simulatedProgress += (100 - simulatedProgress) * 0.05; // Asymptotic growth
      setProgress({ current: Math.round(simulatedProgress), total: 100 });
    }, 400);
    
    try {
      console.log(`[Export] Requesting server-side generation...`);
      let fetchUrl = '';
      if (uid) {
        const exportTypePath = format === 'gif' ? 'image' : 'video';
        const ext = format === 'gif' ? '.gif' : '.mp4';
        fetchUrl = `/api/export/${exportTypePath}/${ratio.replace(':', 'x')}/${type}/${uid}${ext}`;
      }
      
      let finalBlobUrl = '';
      if (fetchUrl) {
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Server export failed (${response.status})`);
        const blob = await response.blob();
        finalBlobUrl = URL.createObjectURL(blob);
      } else {
        const response = await fetch('/api/export/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            initialFen: initialFen || 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
            moves: history,
            format, 
            fps: 0.5, 
            ratio,
            width: ratio === '9:16' ? 720 : 1280,
            uid: uid || `export-${Date.now()}` 
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          if (response.status === 504) throw new Error(t('game.export.serverTimeout'));
          throw new Error('Server export failed');
        }

        const blob = await response.blob();
        finalBlobUrl = URL.createObjectURL(blob);
      }

      if (finalBlobUrl) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = finalBlobUrl;
        a.download = `xiangqi_hd_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(finalBlobUrl);
        }, 100);
        
        success(t('game.export.serverVideoSuccess', { format: format.toUpperCase() }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      errorNotify(t('game.export.serverVideoError', { message: err.message }));
    } finally {
      setIsExporting(false);
      clearInterval(interval);
    }
  };

  const btnBase = 'group flex items-center gap-2 h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50';

  return (
    <div className={`${className} relative flex flex-wrap items-center gap-2`}>
      <button 
        className={btnBase + " text-blue-500 border-blue-500/20"} 
        onClick={handleExportFen}
        disabled={isExporting}
      >
        <Copy size={14} />
        <span>{t('game.export.copyFen')}</span>
      </button>

      <div className="relative group">
        <button 
          className={btnBase + " text-xq-gold border-xq-gold/20 pr-2"}
          onClick={() => setShowMenu(!showMenu)}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span>{t('game.export.exportFile')}</span>
          <ChevronDown size={14} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1 mb-2">
                <p className="text-[9px] font-black text-white/40 uppercase mb-2">{t('game.export.size')}</p>
                <div className="flex gap-1">
                  {(['16:9', '9:16', '1:1', '9:10'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRatio(r)}
                      className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black transition-all ${ratio === r ? 'bg-xq-gold/10 border-xq-gold/50 text-xq-gold' : 'bg-white/5 border-white/10 text-white/40'}`}
                    >
                      {r === '16:9' ? t('game.export.ratios.horizontal') : r === '9:16' ? t('game.export.ratios.vertical') : r === '1:1' ? t('game.export.ratios.square') : t('game.export.ratios.board')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5 my-1" />

              <button 
                className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                onClick={() => { handleServerImage(); setShowMenu(false); }}
              >
                <ImageIcon size={16} className="text-purple-400" /> {t('game.export.downloadHd')}
              </button>
              <button 
                className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                onClick={() => { handleClientImage(); setShowMenu(false); }}
              >
                <Download size={16} className="text-slate-400" /> {t('game.export.saveImage')}
              </button>
              {history.length > 0 && (
                <>
                  <div className="h-px bg-white/5 my-1" />
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => { handleClientVideo(); setShowMenu(false); }}
                  >
                    <Video size={16} className="text-emerald-400" /> {t('game.export.clientVideo')}
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => { handleServerExport('mp4'); setShowMenu(false); }}
                  >
                    <Film size={16} className="text-blue-400" /> {t('game.export.serverVideo')}
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => { handleServerExport('gif'); setShowMenu(false); }}
                  >
                    <Download size={16} className="text-amber-400" /> {t('game.export.animatedGif')}
                  </button>
                </>
              )}

            </div>
          </>
        )}
      </div>

      <ExportProgressModal 
        isOpen={isExporting}
        onClose={handleCancelExport}
        progress={progress}
        type={exportType}
        format={exportFormat}
      />
    </div>
  );
};

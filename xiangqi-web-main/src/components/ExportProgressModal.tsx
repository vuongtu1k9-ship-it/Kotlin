import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X, Film, Video, ImageIcon, Info } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: { current: number; total: number } | null;
  type: 'client' | 'server';
  format: 'mp4' | 'gif' | 'webm' | 'png';
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  type,
  format
}) => {
  if (!isOpen) return null;

  const isClient = type === 'client';
  const percent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={(e) => e.stopPropagation()} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header Decor strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon Section */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
              {format === 'gif' ? (
                <ImageIcon className="w-10 h-10 text-pink-400" />
              ) : isClient ? (
                <Video className="w-10 h-10 text-emerald-400" />
              ) : (
                <Film className="w-10 h-10 text-blue-400" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          </div>

          {/* Text Section */}
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
            Đang xuất {format.toUpperCase()}
          </h3>
          <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed px-4">
            {isClient 
              ? `Hệ thống đang quay lại từng nước đi để tạo video HD. Vui lòng giữ trang web mở.`
              : `Máy chủ đang xử lý ván đấu và tạo file chất lượng cao. Quá trình này có thể mất ít phút.`
            }
          </p>

          {/* Progress Bar Container */}
          <div className="w-full space-y-3 mb-8">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Tiến độ
              </span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                {isClient ? `${progress?.current}/${progress?.total}` : (percent > 0 ? `${percent}%` : 'Đang chuẩn bị...')}
              </span>
            </div>
            
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 relative group"
                style={{ width: `${Math.max(5, isClient ? percent : (percent || 5))}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                <div className="absolute -inset-1 bg-blue-500/20 blur-md opacity-50" />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-center pt-2">
              <Info className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                Vui lòng không đóng trang hoặc chuyển thẻ
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Hủy xuất file</span>
          </button>
        </div>

        {/* Footer Glow */}
        <div className="h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0" />
      </div>
    </div>,
    document.body
  );
};

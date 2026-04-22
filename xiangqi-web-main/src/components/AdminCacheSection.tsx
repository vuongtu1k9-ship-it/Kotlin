import React from 'react';

interface AdminCacheSectionProps {
  cacheStats: any;
  onRefresh: () => void;
  onClearAll: () => void;
  onDeleteKey: (key: string) => void;
}

export const AdminCacheSection: React.FC<AdminCacheSectionProps> = ({
  cacheStats,
  onRefresh,
  onClearAll,
  onDeleteKey
}) => {
  return (
    <div className="bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 p-6 w-full md:w-1/2">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
        <span>Trạng Thái Redis Cache</span>
        {cacheStats?.connected && (
          <button
            onClick={onRefresh}
            className="text-xs bg-slate-200 dark:bg-white/10 hover:bg-black/20 dark:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
          >
            Làm mới
          </button>
        )}
      </h2>
      {cacheStats?.connected ? (
        <div className="space-y-4 text-sm text-slate-800 dark:text-white/70">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="font-semibold text-emerald-400">Hệ thống đang hoạt động tốt</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-200 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">
              <div className="text-slate-600 dark:text-white/40 mb-1 text-xs uppercase tracking-wider">Bộ nhớ sử dụng</div>
              <div className="font-mono text-xl text-slate-900 dark:text-white">{cacheStats.memoryUsed}</div>
            </div>
            <div className="bg-slate-200 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">
              <div className="text-slate-600 dark:text-white/40 mb-1 text-xs uppercase tracking-wider">Số lượng Keys</div>
              <div className="font-mono text-xl text-slate-900 dark:text-white">{cacheStats.keys}</div>
            </div>
          </div>

          {cacheStats.keyList && cacheStats.keyList.length > 0 && (
            <div className="pt-4">
              <div className="text-slate-600 dark:text-white/40 mb-2 text-xs uppercase tracking-wider">Danh sách Keys</div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {cacheStats.keyList.map((key: string) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-black/5 dark:border-white/5 group hover:border-black/10 dark:border-white/10 transition-colors"
                  >
                    <span className="font-mono text-xs text-xq-gold truncate mr-2" title={key}>
                      {key}
                    </span>
                    <button
                      onClick={() => onDeleteKey(key)}
                      className="text-red-500/50 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Xóa key này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={onClearAll}
              className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-2.5 rounded-xl hover:bg-red-500 flex items-center gap-2 hover:text-slate-900 dark:text-white font-bold transition-all"
            >
              🗑️ Xóa toàn bộ Cache
            </button>
            <p className="text-xs mt-2 text-slate-600 dark:text-white/40">
              Thao tác này sẽ xóa bộ nhớ đệm. Hệ thống sẽ ngay lập tức lấy API mới nhất từ cơ sở dữ liệu.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-slate-400 dark:text-white/30 text-center py-10">Đang kết nối tới Redis...</div>
      )}
    </div>
  );
};

import React from 'react'; // deployment_trigger: release_final_verification
import { MiniBoard } from './MiniBoard';

interface AdminMatch {
  _id: string;
  status: string;
  updatedAt: number;
  playerNames?: { red?: string; black?: string };
  playerUids?: { red?: string; black?: string };
  fen?: string;
  state: {
    fen?: string;
    serverMoveIndex?: number;
    playerUids?: {
      red?: any;
      black?: any;
    };
  };
}

interface AdminMatchTableProps {
  matches: AdminMatch[];
  totalCount: number;
  onDelete: (id: string) => void;
  onPost?: (id: string) => void;
  paginationUI: React.ReactNode;
}

export const AdminMatchTable: React.FC<AdminMatchTableProps> = ({
  matches,
  totalCount,
  onDelete,
  onPost,
  paginationUI
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Phòng Chơi ({totalCount})</h2>
        <span className="text-xs text-slate-500">Mới nhất xếp trên đầu</span>
      </div>
      <div className="bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-black/10 dark:border-white/10 text-slate-600 dark:text-white/40">
          <tr>
            <th className="px-6 py-4 text-left">Phòng</th>
            <th className="px-6 py-4 text-left">Người Chơi</th>
            <th className="px-6 py-4 text-left">Nước</th>
            <th className="px-6 py-4 text-left">Trạng Thái</th>
            <th className="px-6 py-4 text-left">Cập Nhật</th>
            <th className="px-6 py-4 text-left"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {matches.map(m => {
            const redName = m.playerNames?.red || (typeof m.state?.playerUids?.red === 'string' ? m.state.playerUids.red : (m.state?.playerUids?.red?.name || m.playerUids?.red || '?'));
            const blackName = m.playerNames?.black || (typeof m.state?.playerUids?.black === 'string' ? m.state.playerUids.black : (m.state?.playerUids?.black?.name || m.playerUids?.black || '?'));
            const moveCount = m.state?.serverMoveIndex || 0;
            
            return (
              <tr key={m._id} className="hover:bg-slate-100 dark:bg-white/5 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-8">
                    <div className="w-40 h-44 flex-shrink-0 bg-slate-200 dark:bg-black/20 rounded-[2rem] overflow-hidden shadow-lg border border-black/5">
                       <MiniBoard fen={m.state?.fen || m.fen || m.state?.lastposition} board={m.state?.board} eager={false} />
                    </div>
                    <a 
                      href={`/game/${m._id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-xq-gold hover:underline flex items-center gap-2"
                    >
                      {m._id}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">↗</span>
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-800 dark:text-white/70">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[150px]"><span className="text-red-400 mr-1">●</span>{redName}</span>
                    <span className="truncate max-w-[150px]"><span className="text-slate-400 mr-1">●</span>{blackName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{moveCount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    m.status === 'playing' ? 'bg-green-500/20 text-green-400' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/40'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 dark:text-white/30 whitespace-nowrap">{new Date(m.updatedAt).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {onPost && (
                      <button
                        onClick={() => onPost(m._id)}
                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Đăng lên mạng xã hội"
                      >
                        🚀
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(m._id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Xóa trận đấu"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {matches.length === 0 && <div className="py-10 text-center text-slate-400 dark:text-white/20">Không có phòng chơi nào.</div>}
      {paginationUI}
      </div>
    </div>
  );
};

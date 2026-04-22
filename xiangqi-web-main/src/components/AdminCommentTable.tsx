import React from 'react';
import { Link } from 'react-router-dom';

interface Comment {
  _id: string;
  _type: 'entity' | 'game';
  entityType?: 'puzzle' | 'tournament' | 'player' | 'general';
  entityId?: string;
  gameId?: string;
  uid: string;
  name: string;
  picture: string | null;
  text: string;
  createdAt: number;
}

interface AdminCommentTableProps {
  comments: Comment[];
  totalCount: number;
  onDelete: (type: string, id: string) => void;
  paginationUI: React.ReactNode;
}

export const AdminCommentTable: React.FC<AdminCommentTableProps> = ({
  comments,
  onDelete,
  paginationUI
}) => {
  const getLink = (c: Comment) => {
    if (c._type === 'game') return `/game/${c.gameId}`;
    if (c.entityType === 'puzzle') return `/puzzles/${c.entityId}`;
    if (c.entityType === 'tournament') return `/tournaments/${c.entityId}`;
    return '#';
  };

  const getLabel = (c: Comment) => {
    if (c._type === 'game') return '🎮 Game';
    if (c.entityType === 'puzzle') return '🧩 Puzzle';
    if (c.entityType === 'tournament') return '🏆 Tournament';
    return '📝 Other';
  };

  return (
    <div className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 font-black uppercase tracking-widest text-[10px] border-b border-black/10 dark:border-white/10">
              <th className="px-6 py-4">Người dùng</th>
              <th className="px-6 py-4">Vị trí</th>
              <th className="px-6 py-4">Nội dung</th>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {comments.map((comment) => (
              <tr key={comment._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden border border-black/10 dark:border-white/10 flex-shrink-0">
                      {comment.picture ? (
                        <img src={comment.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/30 font-bold uppercase">
                          {comment.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{comment.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/30 font-mono select-all">uid:{comment.uid}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    to={getLink(comment)} 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-white/60 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10 transition-all"
                  >
                    {getLabel(comment)}
                    <span className="text-[10px] opacity-40 font-mono">#{comment.entityId || comment.gameId}</span>
                  </Link>
                </td>
                <td className="px-6 py-4 max-w-md">
                  <div className="text-slate-800 dark:text-white/80 line-clamp-2 break-words text-xs leading-relaxed italic">
                    "{comment.text}"
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-white/40 text-[11px]">
                  {new Date(comment.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onDelete(comment._type, comment._id)}
                    className="h-8 px-4 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all border border-red-500/20"
                  >
                    🗑 Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginationUI}
    </div>
  );
};

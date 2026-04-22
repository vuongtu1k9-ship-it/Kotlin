import React from 'react';
import { MiniBoard } from './MiniBoard';
import { 
  Trash2, Eye, Share2, Award, 
  Calendar, User, CheckCircle2, 
  Layers, Move, Info, Clock, ExternalLink,
  Heart, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminPuzzle {
  _id: string;
  uid?: string;
  name: Record<string, string> | string;
  createdByName: string;
  creatorUid?: string;
  level: number;
  fen: string;
  board?: any;
  createdAt?: number;
  solvesCount?: number;
  viewCount?: number;
  attemptCount?: number;
  likeCount?: number;
  moves?: any[];
  difficulty?: string;
}

interface AdminPuzzleGridProps {
  puzzles: AdminPuzzle[];
  totalCount: number;
  onDelete: (id: string, name: string) => void;
  onPost?: (id: string) => void;
  paginationUI: React.ReactNode;
}

export const AdminPuzzleGrid: React.FC<AdminPuzzleGridProps> = ({
  puzzles,
  totalCount,
  onDelete,
  onPost,
  paginationUI
}) => {
  const getNameDisplay = (puzzle: AdminPuzzle) => {
    if (typeof puzzle.name === 'string') return puzzle.name;
    return puzzle.name?.vi || puzzle.name?.en || 'Thế cờ vô danh';
  };

  const getDifficultyStyle = (level: number) => {
    if (level >= 8) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (level >= 5) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 shadow-sm">
                <Layers size={20} />
             </div>
             Quản lý Thế Cờ
             <span className="ml-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black text-slate-400 tracking-widest border border-black/5 uppercase">
               {totalCount} Total
             </span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 ml-14">Community puzzles curation & distribution center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {puzzles.map(p => (
          <div key={p._id} className="group relative bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500">
            {/* Board Preview Area */}
            <div className="w-full md:w-72 aspect-square md:aspect-auto md:h-auto bg-slate-50 dark:bg-black/20 relative group-hover:bg-black/30 transition-colors border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
               <MiniBoard fen={p.fen} board={p.board} eager={false} />
               <div className="absolute top-4 left-4 z-20">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${getDifficultyStyle(p.level)}`}>
                    LV.{p.level}
                  </div>
               </div>
               <Link 
                 to={`/puzzles/${p.uid || p._id}`}
                 target="_blank"
                 className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all opacity-0 group-hover:opacity-100"
               >
                  <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">
                     <Eye size={20} />
                  </div>
               </Link>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1 group-hover:text-blue-500 transition-colors">
                           {getNameDisplay(p)}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                           <User size={12} className="text-slate-400" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             By {p.createdByName}
                           </span>
                        </div>
                     </div>
                     <div className="flex flex-col items-end shrink-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white italic">#{p.uid?.slice(-6) || p._id.slice(-6)}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Puzzle ID</div>
                     </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                     <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-1">
                        <Eye size={12} className="text-blue-400" />
                        <span className="text-xs font-black italic tracking-tighter text-slate-700 dark:text-white/80">{p.viewCount || 0}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Views</span>
                     </div>
                     <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-1">
                        <Target size={12} className="text-orange-400" />
                        <span className="text-xs font-black italic tracking-tighter text-slate-700 dark:text-white/80">{p.attemptCount || 0}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Tries</span>
                     </div>
                     <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-xs font-black italic tracking-tighter text-slate-700 dark:text-white/80">{p.solvesCount || 0}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Solved</span>
                     </div>
                     <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-1">
                        <Heart size={12} className="text-rose-400" />
                        <span className="text-xs font-black italic tracking-tighter text-slate-700 dark:text-white/80">{p.likeCount || 0}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Likes</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                     <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(p.createdAt)}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Award size={12} className="text-orange-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Verified</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-3 mt-8">
                  <a
                    href={`/solve/${p.uid || p._id}`}
                    target="_blank"
                    className="flex-1 h-12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 transition-all active:scale-95 border border-black/5 dark:border-white/5"
                  >
                     <ExternalLink size={14} />
                     Test View
                  </a>
                  {onPost && (
                    <button
                      onClick={() => onPost(p.uid || p._id)}
                      className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                      <Share2 size={14} />
                      Post
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(p._id, getNameDisplay(p))}
                    className="h-12 px-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          </div>
        ))}

        {puzzles.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[3rem]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Info size={32} />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không tìm thấy thế cờ nào</p>
          </div>
        )}
        
        <div className="col-span-full pt-8">
          {paginationUI}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, User, Edit3, Trash2, TrendingUp, 
  Calendar, Search, Filter, MoreVertical,
  Award, Star, Users, Activity, ExternalLink
} from 'lucide-react';

interface AdminUser {
  uid: string;
  name: string;
  slug?: string;
  email?: string;
  picture?: string;
  sysRole: string;
  provider?: string;
  customStatus?: string;
  createdAt: number;
  updatedAt: number;
  elo: number;
  gamesPlayed?: number;
  inventory?: {
    coins?: number;
  };
}

interface AdminUserTableProps {
  users: AdminUser[];
  totalCount: number;
  onUpdateRole: (uid: string, role: string) => void;
  onUpdateElo: (uid: string, elo: number) => void;
  onDelete: (uid: string, name: string) => void;
  paginationUI: React.ReactNode;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({
  users,
  totalCount,
  onUpdateRole,
  onUpdateElo,
  onDelete,
  paginationUI
}) => {
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'moderator': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getEloStyle = (elo: number) => {
    if (elo >= 2500) return 'text-orange-500';
    if (elo >= 2000) return 'text-purple-500';
    if (elo >= 1500) return 'text-blue-500';
    return 'text-emerald-500';
  };

  const formatDate = (ts: number) => {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm">
                <Users size={20} />
             </div>
             Quản lý Kỳ Thủ
             <span className="ml-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black text-slate-400 tracking-widest border border-black/5 uppercase">
               {totalCount} Total
             </span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 ml-14">Comprehensive player database & administrative command</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-sm overflow-hidden group">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-white/5 text-left">
                <th className="py-8 px-8">Identity & Provider</th>
                <th className="py-8 px-8">Timeline & Activity</th>
                <th className="py-8 px-8">Stats & Ranking</th>
                <th className="py-8 px-8">System Privilege</th>
                <th className="py-8 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {users.map(u => (
                <tr key={u.uid} className="group/row hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all duration-300">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <Link to={`/player/${u.slug || u.uid}`} className="relative group/avatar">
                        <img
                          src={u.picture || `/api/avatars/${u.uid}.webp`}
                          className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover/avatar:scale-110 transition-transform duration-500"
                          alt={u.name}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-900 rounded-full shadow-lg ${u.customStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      </Link>
                      <div className="flex flex-col gap-1.5">
                        <Link 
                          to={`/player/${u.slug || u.uid}`}
                          className="text-sm font-black text-slate-800 dark:text-white hover:text-blue-500 transition-colors leading-none flex items-center gap-2"
                        >
                          {u.name}
                          {u.sysRole === 'admin' && <Shield size={12} className="text-red-500" />}
                        </Link>
                        <div className="flex items-center gap-2">
                           <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${u.provider === 'google' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'}`}>
                             {u.provider === 'google' ? 'Google' : 'Guest'}
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 lowercase tracking-wide italic max-w-[150px] truncate">
                             {u.email || 'no-email'}
                           </span>
                        </div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          UID: {u.uid}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                             <Calendar size={14} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-800 dark:text-white leading-none">{formatDate(u.createdAt)}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Registration</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <Activity size={14} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                               {u.updatedAt ? `${formatDate(u.updatedAt)} ${formatTime(u.updatedAt)}` : 'Never'}
                             </span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Last Seen</span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-800 dark:text-white leading-none">{u.gamesPlayed || 0}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Games</span>
                          </div>
                          <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-orange-500 leading-none">{u.inventory?.coins?.toLocaleString() || 0}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Coins</span>
                          </div>
                       </div>
                       <button
                         onClick={() => onUpdateElo(u.uid, u.elo)}
                         className={`group/elo flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 hover:border-blue-500/40 transition-all active:scale-95 w-fit`}
                       >
                         <Award size={12} className={getEloStyle(u.elo)} />
                         <span className={`text-[11px] font-black italic tracking-tighter ${getEloStyle(u.elo)}`}>
                           {u.elo || 1200}
                         </span>
                         <TrendingUp size={10} className="text-slate-300 group-hover/elo:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="relative">
                      <select
                        value={u.sysRole}
                        onChange={e => onUpdateRole(u.uid, e.target.value)}
                        className={`pl-4 pr-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all focus:outline-none focus:ring-4 ring-current/10 cursor-pointer ${getRoleStyle(u.sysRole)}`}
                      >
                        <option value="user">Kỳ Thủ</option>
                        <option value="moderator">Điều Phối</option>
                        <option value="admin">Quản Trị</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                         <Star size={10} />
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/player/${u.slug || u.uid}`}
                        target="_blank"
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-90"
                        title="View Public Profile"
                      >
                         <ExternalLink size={16} />
                      </Link>
                      <button 
                        onClick={() => onUpdateElo(u.uid, u.elo)}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all active:scale-90"
                        title="Edit Player Details"
                      >
                         <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(u.uid, u.name)}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                        title="Delete Player"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-3 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5">
          {paginationUI}
        </div>
      </div>
    </div>
  );
};

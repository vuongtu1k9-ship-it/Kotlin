import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../auth/auth';

interface Bot {
  _id: string;
  name: string;
  email: string;
  level: number;
  elo?: number;
  gamesPlayed?: number;
  rank?: string;
  avatar?: string;
  personality?: 'balanced' | 'aggressive' | 'defensive' | 'chaotic' | 'steady';
  status: 'stopped' | 'running' | 'resting';
  uid?: string;
  updatedAt: string;
  activeMinutes?: number;
  restMinutes?: number;
  maxGamesPerSession?: number;
  playWithHumans?: boolean;
  canInvite?: boolean;
  acceptInvites?: boolean;
}

interface AdminBotManagerProps {
  bots: Bot[];
  onRefresh: () => void;
}

export const AdminBotManager: React.FC<AdminBotManagerProps> = ({ bots, onRefresh }) => {
  const { state: authState } = useAuth();
  const [editingBot, setEditingBot] = useState<Partial<Bot> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: string) => {
    setLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/bots/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({ start: currentStatus === 'stopped' })
      });
      if (res.ok) onRefresh();
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bot này?')) return;
    setLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/bots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      if (res.ok) onRefresh();
    } finally {
      setLoading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBot) return;
    setLoading('save');
    try {
      const isNew = !editingBot._id;
      const url = isNew ? `${API_URL}/admin/bots` : `${API_URL}/admin/bots/${editingBot._id}`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify(editingBot)
      });
      if (res.ok) {
        setEditingBot(null);
        onRefresh();
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Danh sách Bot</h2>
        <button
          onClick={() => setEditingBot({ name: '', level: 5, activeMinutes: 60, restMinutes: 30, playWithHumans: true })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          + Thêm Bot Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map((bot) => (
          <div key={bot._id} className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-5 hover:shadow-xl transition-all group relative overflow-hidden">
             {/* Status Badge */}
             <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl ${
               bot.status === 'running' ? 'bg-green-500 text-white' : 
               bot.status === 'resting' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
             }`}>
               {bot.status === 'running' ? '🟢 Đang chạy' : bot.status === 'resting' ? '🟡 Đang nghỉ (tự khởi động lại)' : '⚫ Đã tắt'}
             </div>

            <div className="flex items-center gap-4 mb-4">
              <img 
                src={bot.avatar || `/api/avatars/${bot.uid || bot._id}.webp`} 
                alt={bot.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20"
              />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{bot.name}</h3>
                <p className="text-xs text-slate-500 dark:text-white/40">{bot.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded-md uppercase">Lv {bot.level}</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-md uppercase">{bot.elo || 1200} Elo</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-md uppercase">{bot.gamesPlayed || 0} Trận</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-md uppercase">{bot.rank || 'Bronze'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
               <div className="flex justify-between text-slate-600 dark:text-white/60">
                 <span>Chu kỳ hoạt động:</span>
                 <span className="font-medium text-slate-900 dark:text-white">{bot.activeMinutes}m chơi / {bot.restMinutes}m nghỉ</span>
               </div>
               <div className="flex justify-between text-slate-600 dark:text-white/60">
                 <span>Chế độ:</span>
                 <span className="text-[10px] flex gap-1">
                           {bot.playWithHumans && <span className="bg-blue-500/10 text-blue-500 px-1.5 rounded">👤 Người</span>}
                           {bot.canInvite && <span className="bg-purple-500/10 text-purple-500 px-1.5 rounded">✉️ Mời</span>}
                           {bot.acceptInvites && <span className="bg-pink-500/10 text-pink-500 px-1.5 rounded">✅ Nhận</span>}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-white/60">
                        <span>Giới hạn trận:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{bot.maxGamesPerSession || '∞'} ván/phiên</span>
                      </div>
                   </div>

            {/* Status note for resting bots */}
            {bot.status === 'resting' && (
              <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ Bot đang nghỉ trong chu kỳ và sẽ TỰ KHỞI ĐỘNG LẠI sau {bot.restMinutes}m. Nhấn "Tắt hẳn" nếu không muốn nó chạy nữa.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {bot.status === 'stopped' ? (
                <button
                  onClick={() => handleToggle(bot._id, bot.status)}
                  disabled={loading === bot._id}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading === bot._id ? '...' : '▶️ Bật vào Pool'}
                </button>
              ) : (
                <button
                  onClick={() => handleToggle(bot._id, bot.status)}
                  disabled={loading === bot._id}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading === bot._id ? '...' : '⏹️ Tắt hẳn'}
                </button>
              )}
              <button
                onClick={() => setEditingBot(bot)}
                className="p-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(bot._id)}
                className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit/Create */}
      {editingBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <form 
            onSubmit={handleSave}
            className="bg-white dark:bg-[#1a1b1e] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingBot._id ? 'Cập Nhật Bot' : 'Tạo Bot Mới'}
              </h3>
              <button type="button" onClick={() => setEditingBot(null)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl">×</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên hiển thị</label>
                  <input
                    required
                    value={editingBot.name || ''}
                    onChange={e => setEditingBot({ ...editingBot, name: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sức mạnh Engine (1-10)</label>
                  <input
                    type="number"
                    min="1" max="10"
                    value={editingBot.level || 5}
                    onChange={e => setEditingBot({ ...editingBot, level: parseInt(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Điểm Elo (100 - 3000)</label>
                  <input
                    type="number"
                    value={editingBot.elo || 1200}
                    onChange={e => setEditingBot({ ...editingBot, elo: parseInt(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hạng hiển thị (Vd: Kiện tướng)</label>
                  <input
                    value={editingBot.rank || ''}
                    onChange={e => setEditingBot({ ...editingBot, rank: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                    placeholder="Nhập hạng..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tính cách chơi (Personality)</label>
                <select
                  value={editingBot.personality || 'balanced'}
                  onChange={e => setEditingBot({ ...editingBot, personality: e.target.value as any })}
                  className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                >
                  <option value="balanced">⚖️ Cân bằng (Balanced)</option>
                  <option value="aggressive">🔥 Tấn công (Aggressive)</option>
                  <option value="defensive">🛡️ Phòng thủ (Defensive)</option>
                  <option value="chaotic">🎲 Ngẫu hứng (Chaotic)</option>
                  <option value="steady">🗿 Kiên trì (Steady)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email (Dùng để login)</label>
                <input
                  required
                  type="email"
                  value={editingBot.email || ''}
                  onChange={e => setEditingBot({ ...editingBot, email: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Avatar URL</label>
                <input
                  value={editingBot.avatar || ''}
                  onChange={e => setEditingBot({ ...editingBot, avatar: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Thời gian chơi (phút)</label>
                  <input
                    type="number"
                    value={editingBot.activeMinutes || 0}
                    onChange={e => setEditingBot({ ...editingBot, activeMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Thời gian nghỉ (phút)</label>
                   <input
                    type="number"
                    value={editingBot.restMinutes || 0}
                    onChange={e => setEditingBot({ ...editingBot, restMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Giới hạn ván/phiên</label>
                  <input
                    type="number"
                    value={editingBot.maxGamesPerSession || 0}
                    onChange={e => setEditingBot({ ...editingBot, maxGamesPerSession: parseInt(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500 outline-none transition-all"
                    placeholder="0 = Không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={editingBot.playWithHumans} 
                      onChange={e => setEditingBot({...editingBot, playWithHumans: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-none bg-slate-200 dark:bg-white/10 checked:bg-indigo-600 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium">Cho phép đấu với người chơi</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={editingBot.canInvite} 
                      onChange={e => setEditingBot({...editingBot, canInvite: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-none bg-slate-200 dark:bg-white/10 checked:bg-indigo-600 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium">Cho phép chủ động mời người khác</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={editingBot.acceptInvites} 
                      onChange={e => setEditingBot({...editingBot, acceptInvites: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-none bg-slate-200 dark:bg-white/10 checked:bg-indigo-600 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium">Chấp nhận lời mời từ người chơi</span>
                 </label>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-white/5 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingBot(null)}
                className="flex-1 py-3 px-4 rounded-2xl font-bold text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading === 'save'}
                className="flex-[2] py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {loading === 'save' ? 'Đang lưu...' : 'Lưu Cấu Hình'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

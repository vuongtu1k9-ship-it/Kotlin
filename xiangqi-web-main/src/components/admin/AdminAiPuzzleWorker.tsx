import React, { useState, useEffect } from 'react';
import { Play, Pause, Database, Activity, Zap, Save } from 'lucide-react';
import { API_URL } from '../../auth/auth';
import { getSocket } from '../../net/socket';

export const AdminAiPuzzleWorker: React.FC<{ authState: any }> = ({ authState }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const res = await fetch(`${API_URL}/admin/ai/status?t=${Date.now()}`, { headers, credentials: 'include' });
      const result = await res.json();

      if (result.ok) {
        setStatus(result.progress);
        setPromptTemplate(result.progress.promptTemplate || '');
      }
    } catch (e) {
      console.error('Không thể kết nối tới server AI Worker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    const handleAiUpdate = (result: any) => {
      if (result.ok) setStatus(result.progress);
    };
    socket.on('ai:status', handleAiUpdate);
    return () => { socket.off('ai:status', handleAiUpdate); };
  }, []);

  const handleSaveConfig = async () => {
    setActionLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const res = await fetch(`${API_URL}/admin/ai/config`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ promptTemplate }),
        credentials: 'include'
      });
      if ((await res.json()).ok) fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleWorkerAction = async (action: 'start' | 'pause' | 'resume') => {
    setActionLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const res = await fetch(`${API_URL}/admin/ai/${action}`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
      if ((await res.json()).ok) fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center animate-pulse text-slate-400">Đang đồng bộ AI Worker...</div>;

  return (
    <div className="bg-white dark:bg-white/5 rounded-4xl border border-blue-500/10 dark:border-blue-500/20 shadow-xl shadow-blue-500/5 overflow-hidden mb-8">
      {/* Header */}
      <div className="px-8 py-5 bg-gradient-to-r from-blue-500/5 to-transparent border-b border-blue-500/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              AI Puzzle Master
              {status?.status === 'running' && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60 dark:text-blue-400/50">Tự động hóa nội dung Thế Cờ</p>
          </div>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 font-black text-xs uppercase tracking-widest"
        >
          {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Activity size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Trạng thái</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${status?.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-2xl font-black uppercase tracking-tight">{status?.status === 'running' ? 'Đang chạy' : 'Dừng'}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Database size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Đã hoàn thành</h3>
              </div>
              <div className="text-2xl font-black">{status?.processed?.toLocaleString()} / {status?.total?.toLocaleString()}</div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  style={{ width: `${Math.round((status?.processed / status?.total) * 100) || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col justify-center gap-3">
              {status?.status === 'running' ? (
                <button onClick={() => handleWorkerAction('pause')} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"><Pause size={16} /> TẠM DỪNG TÁC VỤ</button>
              ) : (
                <button onClick={() => handleWorkerAction(status?.status === 'paused' ? 'resume' : 'start')} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"><Play size={16} /> BẮT ĐẦU QUY TRÌNH</button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-4xl border border-slate-100 dark:border-white/5">
            <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
              <Database size={18} className="text-blue-500" /> Prompt Template (Nội dung Thế cờ)
            </h3>
            <textarea 
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              className="w-full bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 text-slate-700 dark:text-white/60 font-medium text-sm focus:ring-4 ring-blue-500/10 transition-all outline-none" 
              rows={6}
            />
            <div className="flex justify-end mt-4">
              <button 
                onClick={handleSaveConfig}
                disabled={actionLoading}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={14} /> Lưu mẫu Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

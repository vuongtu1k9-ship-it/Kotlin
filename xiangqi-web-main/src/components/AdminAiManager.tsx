import React, { useState, useEffect } from 'react';
import { Cpu, Brain, Shield, Save, AlertCircle } from 'lucide-react';
import { API_URL } from '../auth/auth';
import { useToast } from './ui/Toast';

export const AdminAiManager: React.FC<{ authState: any }> = ({ authState }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for resources
  const [defaultModel, setDefaultModel] = useState('gemini-3.1-flash-lite-preview');
  const [globalAutoSwitch, setGlobalAutoSwitch] = useState(true);

  const models = [
    { group: '🌍 Google AI (Gemini)', options: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Stable)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Reasoning)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest)' },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro (Legacy)' },
    ]},
    { group: '🚀 Groq (Ultra Fast)', options: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versatile)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ]},
    { group: '🎨 Mistral AI', options: [
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'mistral-small-latest', name: 'Mistral Small' },
      { id: 'codestral-latest', name: 'Codestral (SEO/Code)' },
    ]},
    { group: '💎 specialized Providers', options: [
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B (Cerebras)' },
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B (SambaNova)' },
    ]}
  ];

  const fetchData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const configRes = await fetch(`${API_URL}/admin/ai/resources`, { headers, credentials: 'include' });
      const configResult = await configRes.json();

      if (configResult.ok) {
        const c = configResult.config;
        setDefaultModel(c.defaultModel);
        setGlobalAutoSwitch(c.autoSwitch);
      }
    } catch (e) {
      setError('Không thể kết nối tới server AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveResources = async () => {
    setActionLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const res = await fetch(`${API_URL}/admin/ai/resources`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          defaultModel,
          autoSwitch: globalAutoSwitch
        }),
        credentials: 'include'
      });
      const result = await res.json();
      if (result.ok) toast.success('Đã cập nhật tài nguyên hệ thống!');
      else toast.error('Lưu thất bại');
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Phân tích Hub tài nguyên AI...</div>;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40">
              <Brain size={28} />
            </div>
            AI RESOURCE HUB
          </h1>
          <p className="text-slate-500 dark:text-white/40 font-black text-xs mt-2 uppercase tracking-[0.3em] ml-1">Quản lý Mô hình & Tài nguyên AI</p>
        </div>
        <button 
          onClick={handleSaveResources}
          disabled={actionLoading}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all disabled:opacity-50 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white"
        >
          <Save size={18} /> Đồng bộ toàn site
        </button>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl flex items-center gap-4 text-blue-600 dark:text-blue-400">
         <Shield size={20} />
         <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
           Cài đặt bảo mật: Mọi API Key được lưu trữ an toàn trong biến môi trường (.env) và không bao giờ lộ diện tại giao diện người dùng.
         </p>
      </div>

      {/* Global Config */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-10 rounded-[3rem] shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest text-xs">
          <Cpu size={20} className="text-blue-500" /> Cấu hình ưu tiên
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô hình mặc định</label>
             <select 
               value={defaultModel}
               onChange={(e) => setDefaultModel(e.target.value)}
               className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-black outline-none focus:ring-4 ring-blue-500/10 transition-all appearance-none"
             >
               {models.map(g => (
                 <optgroup key={g.group} label={g.group}>
                   {g.options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </optgroup>
               ))}
             </select>
          </div>
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tự động chuyển vùng (Failover)</label>
             <div 
               onClick={() => setGlobalAutoSwitch(!globalAutoSwitch)}
               className={`w-full p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${globalAutoSwitch ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}
             >
               <span className="text-[11px] font-black uppercase tracking-widest">{globalAutoSwitch ? 'Đã kích hoạt Fallback' : 'Tắt tự động chuyển vùng'}</span>
               <div className={`w-10 h-6 rounded-full relative transition-all ${globalAutoSwitch ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${globalAutoSwitch ? 'right-1' : 'left-1'}`} />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Provider Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {models.map((prov, pidx) => (
          <div key={pidx} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm hover:border-blue-500/30 transition-all group">
            <h4 className="text-[11px] font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center justify-between">
              {prov.group}
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <div className="space-y-3">
              {prov.options.map((m, midx) => (
                <div key={midx} className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-tight flex items-center justify-between group/item ${defaultModel === m.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 dark:text-white/40'}`}>
                  <span>{m.name}</span>
                  {defaultModel === m.id && <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full">ACTIVE</span>}
                  <button 
                    onClick={() => setDefaultModel(m.id)}
                    className={`opacity-0 group-hover/item:opacity-100 px-2 py-1 rounded-lg text-[8px] transition-all ${defaultModel === m.id ? 'hidden' : 'bg-blue-500 text-white'}`}
                  >
                    SET AS DEFAULT
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-4 text-red-500">
          <AlertCircle size={24} />
          <p className="font-black uppercase tracking-tight text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AdminAiManager;

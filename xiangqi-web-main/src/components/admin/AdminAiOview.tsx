import React, { useState, useEffect } from 'react';
import { 
  Brain, Sparkles, TrendingUp, AlertTriangle, 
  ArrowRight, Search, Zap, ShieldCheck, Users, Sword, Puzzle, Trophy, MessageCircle, Activity, Server, Clock, Cpu
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';
import { API_URL } from '../../auth/auth';

interface AIInsight {
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'info';
}

interface AIResponse {
  summary: string;
  insights: AIInsight[];
  recommendations: string[];
}

export const AdminAiOview: React.FC<{ authState: any }> = ({ authState }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [commandStatus, setCommandStatus] = useState<{ reply: string, data?: any } | null>(null);
  const [commandLoading, setCommandLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) setStats(d);
    } catch (e) {
      console.error('Failed to fetch dashboard stats', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/analytics/insights?days=30`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) setData(d.data);
      else setError(d.error);
    } catch (e) {
      setError('Kết nối AI Analytics thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    setCommandLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/analytics/ai/command`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
      });
      const d = await res.json();
      if (d.ok) setCommandStatus(d);
      else setCommandStatus({ reply: `Lỗi: ${d.error}` });
    } catch (e) {
      setCommandStatus({ reply: 'Lỗi kết nối Command Center' });
    } finally {
      setCommandLoading(false);
      setCommand('');
    }
  };

  useEffect(() => {
    fetchInsights();
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -ml-32 -mb-32 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-4xl shadow-2xl">
            <Brain className="text-white fill-white/20" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black mb-2 tracking-tight flex items-center justify-center md:justify-start gap-3">
              Trung Tâm Quản Trị Chiến Lược <Sparkles className="text-yellow-400" />
            </h2>
            <p className="text-blue-100/70 text-lg font-medium max-w-2xl leading-relaxed">
              {loading ? "AI đang tổng hợp dữ liệu chiến lược từ Analytics & Search Console..." : error ? `Lỗi: ${error}` : data?.summary || "Dữ liệu vận hành mới nhất từ hệ thống cotuong.xyz đã sẵn sàng."}
            </p>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="px-8 py-3 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-white/10 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Đang Phân Tích..." : "Cập Nhật Chiến Lược"}
          </button>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Users', value: stats?.counts?.users, icon: Users, color: 'blue' },
          { label: 'Matches', value: stats?.counts?.matches, icon: Sword, color: 'emerald' },
          { label: 'Puzzles', value: stats?.counts?.puzzles, icon: Puzzle, color: 'orange' },
          { label: 'Events', value: stats?.counts?.tournaments, icon: Trophy, color: 'purple' },
          { label: 'Comments', value: stats?.counts?.comments, icon: MessageCircle, color: 'rose' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[30px] flex flex-col gap-3 shadow-sm hover:scale-[1.02] transition-transform">
             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-${item.color}-500/10 text-${item.color}-500`}>
                <item.icon size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</p>
                <p className="text-xl font-black italic tracking-tighter">
                   {statsLoading ? '...' : (item.value || 0).toLocaleString()}
                </p>
             </div>
          </div>
        ))}
      </div>

      {/* Growth Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[40px] shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
               <TrendingUp size={16} /> User Registration Trend (30D)
            </h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.growth?.users || []}>
                     <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                     <XAxis dataKey="date" hide />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                     />
                     <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[40px] shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
               <Sword size={16} /> Match Activity Trend (30D)
            </h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.growth?.matches || []}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                     <XAxis dataKey="date" hide />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                     />
                     <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* System Pulse - Hourly 24h */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[40px] shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 rotate-12"><Activity size={120} /></div>
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" /> System Pulse (Last 24h Activity)
         </h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={stats?.growth?.pulse || []}>
                  <defs>
                     <linearGradient id="pulseUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px', fontSize: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" strokeWidth={3} fill="url(#pulseUsers)" />
                  <Line type="monotone" dataKey="matches" name="Matches Started" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
               </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* System Health */}
      <div className="bg-slate-900 dark:bg-slate-900/40 p-8 rounded-[40px] text-white border border-white/5 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Server size={180} /></div>
         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-8 flex items-center gap-2 italic">
            <Activity size={14} className="animate-pulse" /> Engine Real-time Health
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <div className="space-y-1">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Uptime</p>
               <p className="text-xl font-black italic flex items-center gap-2"><Clock size={16} className="text-emerald-500" /> {stats?.system?.uptime ? Math.floor(stats.system.uptime / 3600) : '--'} hrs</p>
            </div>
            <div className="space-y-1">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Heap Usage</p>
               <p className="text-xl font-black italic flex items-center gap-2"><Cpu size={16} className="text-blue-400" /> {stats?.system?.memory ? (stats.system.memory.heapUsed / 1024 / 1024).toFixed(1) : '--'} MB</p>
            </div>
            <div className="space-y-1">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Node Version</p>
               <p className="text-xl font-black italic">{stats?.system?.nodeVersion || '--'}</p>
            </div>
            <div className="space-y-1">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Environment</p>
               <span className="px-2 py-0.5 bg-blue-500 rounded text-[9px] font-black">DEVELOPMENT</span>
            </div>
         </div>
      </div>

      <div className="flex items-center gap-4 py-4">
         <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Smart Overview</span>
         <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
           {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-white/5 rounded-3xl" />)}
        </div>
      ) : (
        <>
          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="group p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 ${
                  insight.type === 'opportunity' ? 'bg-emerald-500' : insight.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
                   insight.type === 'opportunity' ? 'bg-emerald-500/10 text-emerald-500' : 
                   insight.type === 'warning' ? 'bg-red-500/10 text-red-500' : 
                   'bg-blue-500/10 text-blue-500'
                }`}>
                  {insight.type === 'opportunity' ? <TrendingUp /> : insight.type === 'warning' ? <AlertTriangle /> : <Zap />}
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-500 transition-colors">{insight.title}</h4>
                <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed">{insight.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recommendations List */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[40px] space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" /> Đề Xuất Quản Trị
              </h3>
              <div className="space-y-4">
                {data?.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <p className="text-slate-700 dark:text-white/70 font-medium pt-1">{rec}</p>
                    <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-500 translate-x-0 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions / AI Command Center */}
            <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
              <h3 className="text-xl font-black flex items-center gap-3 relative z-10">
                <Search className="text-blue-400" /> AI Command Center
              </h3>
              <div className="relative z-10 space-y-4">
                <p className="text-blue-100/60 text-sm">Hỏi AI về dữ liệu của bạn hoặc ra lệnh quản trị nhanh.</p>
                <form onSubmit={handleCommand} className="relative group">
                  <input 
                    type="text" 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    disabled={commandLoading}
                    placeholder="Ví dụ: 'Phân tích traffic hôm qua' hoặc 'Xóa cache'..."
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-white/20 disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={commandLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-focus-within:bg-blue-400 transition-colors disabled:opacity-50"
                  >
                    {commandLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </form>

                {commandStatus && (
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-black text-blue-400 uppercase mb-2">AI Response:</p>
                    <p className="text-sm font-medium leading-relaxed">{commandStatus.reply}</p>
                    {commandStatus.data && (
                       <pre className="mt-4 p-3 bg-black/40 rounded-xl text-[10px] text-blue-300/60 overflow-x-auto max-h-32">
                         {JSON.stringify(commandStatus.data, null, 2)}
                       </pre>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {['Check SEO', 'Clear Cache', 'Analyze Users', 'System Health'].map(tag => (
                    <span 
                      key={tag} 
                      onClick={() => setCommand(tag)}
                      className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

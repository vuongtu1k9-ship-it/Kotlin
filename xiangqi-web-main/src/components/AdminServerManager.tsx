import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Terminal, GitBranch, RefreshCw, Cpu, Zap, 
  Code, MessageSquare, LayoutDashboard, 
  Activity, Shield, Settings, XCircle,
  Clock, HardDrive, Search
} from 'lucide-react';
import { API_URL } from '../auth/auth';
import { useToast } from './ui/Toast';

export const AdminServerManager: React.FC<{ authState: any }> = ({ authState }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string>('');
  const [logLines, setLogLines] = useState(100);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'git' | 'ai'>('overview');
  const [logSearch, setLogSearch] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/admin/server/status`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) setStatus(d.data);
    } catch (e) {
      toast.error('Không thể lấy trạng thái server');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/server/logs?lines=${logLines}`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) setLogs(d.logs);
    } catch (e) {
      toast.error('Không thể lấy log server');
    }
  };

  const runGitAction = async (action: string, tool: 'git' | 'gh' = 'git') => {
    toast.info(`Đang thực hiện ${tool} ${action}...`);
    try {
      const res = await fetch(`${API_URL}/admin/server/git-action`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, tool })
      });
      const d = await res.json();
      if (d.ok) {
        if (tool === 'gh') {
          toast.success(`${tool} ${action} thành công!`);
          setAnalysis(`KẾT QUẢ ${tool.toUpperCase()} ${action.toUpperCase()}:\n\n${d.output}`);
          setActiveTab('ai');
        } else {
          toast.success(`Git ${action} thành công!`);
          fetchStatus();
        }
      } else {
        toast.error(`${tool} ${action} thất bại: ${d.error}`);
      }
    } catch (e) {
      toast.error(`Lỗi kết nối khi chạy ${tool}`);
    }
  };

  const analyzeLogs = async () => {
    if (!logs) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${API_URL}/admin/server/analyze-logs`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });
      const d = await res.json();
      if (d.ok) {
        setAnalysis(d.analysis);
        setActiveTab('ai');
      } else {
        toast.error('Lỗi khi phân tích log: ' + d.error);
      }
    } catch (e) {
      toast.error('Lỗi kết nối AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createIssueFromLogs = async (customAnalysis?: string) => {
    if (!logs && !customAnalysis) return;
    toast.info('AI đang soạn thảo issue...');
    try {
      const res = await fetch(`${API_URL}/admin/server/gh-create-issue`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          logs: logs.substring(0, 3000),
          body: customAnalysis 
        })
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(`Đã tạo issue thành công: ${d.title}`);
        setAnalysis(`ĐÃ TẠO ISSUE TRÊN GITHUB:\n\n${d.output}\n\nTiêu đề: ${d.title}`);
        setActiveTab('ai');
      } else {
        toast.error('Lỗi khi tạo issue: ' + d.error);
      }
    } catch (e) {
      toast.error('Lỗi kết nối khi tạo issue');
    }
  };

  const analyzeGitHubIssue = async (num: string) => {
    if (!num) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${API_URL}/admin/server/gh-analyze-issue`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ issueNumber: num })
      });
      const d = await res.json();
      if (d.ok) {
        setAnalysis(`AI ANALYSIS OF ISSUE #${num}:\n\n${d.suggestion}`);
        setActiveTab('ai');
      } else {
        toast.error('Lỗi khi phân tích issue: ' + d.error);
      }
    } catch (e) {
      toast.error('Lỗi kết nối AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logEndRef.current && activeTab === 'logs' && !logSearch) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab, logSearch]);

  const filteredLogs = logs.split('\n').filter(line => 
    line.toLowerCase().includes(logSearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="w-16 h-16 border-4 border-slate-200 border-t-xq-gold rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Command Center...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-xq-gold/10 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] -ml-32 -mb-32" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-xq-gold to-amber-600 flex items-center justify-center shadow-2xl shadow-xq-gold/20 shrink-0">
              <Server size={36} className="text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter leading-none italic uppercase">Infrastructure</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest">System Healthy</span>
                <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} /> {status?.uptime} • Node {status?.node}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
             <button 
               onClick={() => { fetchStatus(); fetchLogs(); }}
               disabled={isRefreshing}
               className="group px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all border border-white/5"
             >
               <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /> 
               Sync Data
             </button>
             <button 
               onClick={analyzeLogs}
               className="px-8 py-4 bg-xq-gold text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-xq-gold/20"
             >
               <Zap size={14} /> AI Diagnostic
             </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-2 rounded-3xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'logs', label: 'Terminal', icon: Terminal },
          { id: 'git', label: 'Source Control', icon: GitBranch },
          { id: 'ai', label: 'Diagnostic Lab', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-xl' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             {/* Health Stats */}
             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 text-blue-500">
                       <Activity size={24} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">CPU Performance</h4>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {status?.pm2?.map((proc: any, i: number) => (
                      <div key={i} className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-tight">{proc.name}</span>
                            <span className="text-xl font-black italic">{Math.round(proc.monit.cpu)}<span className="text-[10px] ml-1 uppercase opacity-40">%</span></span>
                         </div>
                         <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${proc.monit.cpu > 70 ? 'bg-red-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.max(5, Math.min(100, proc.monit.cpu))}%` }} 
                            />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 text-xq-gold">
                       <HardDrive size={24} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Memory Allocation</h4>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {status?.pm2?.map((proc: any, i: number) => (
                      <div key={i} className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-tight">{proc.name}</span>
                            <span className="text-xl font-black italic">{Math.round(proc.monit.memory / 1024 / 1024)}<span className="text-[10px] ml-1 uppercase opacity-40">MB</span></span>
                         </div>
                         <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5">
                            <div 
                              className="h-full rounded-full bg-xq-gold transition-all duration-1000" 
                              style={{ width: `${Math.min(100, (proc.monit.memory / 1024 / 1024 / 512) * 100)}%` }} 
                            />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             {/* PM2 Quick List */}
             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col">
                <div className="flex items-center gap-4 mb-8 text-emerald-400">
                  <Cpu size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">PM2 Runtime</h4>
                </div>
                <div className="space-y-4 flex-1">
                   {status?.pm2?.map((proc: any, idx: number) => (
                      <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`w-3 h-3 rounded-full ${proc.pm2_env.status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                           <div>
                              <p className="text-xs font-black uppercase tracking-tight">{proc.name}</p>
                              <p className="text-[9px] font-bold text-white/40 uppercase">ID: {proc.pm_id} • restarts: {proc.pm2_env.restart_time}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black italic text-emerald-400">{proc.pm2_env.status.toUpperCase()}</p>
                        </div>
                      </div>
                   ))}
                </div>
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${status?.runner === 'ONLINE' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Runner listener</span>
                   </div>
                   <span className="text-[10px] font-black">{status?.runner || 'UNKNOWN'}</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col h-[750px] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* Terminal Header */}
            <div className="p-8 border-b border-white/5 bg-black/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <Search size={14} className="text-white/40" />
                      <input 
                        type="text" 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Search logs..." 
                        className="bg-transparent text-[10px] font-black uppercase text-white outline-none w-32 md:w-64 placeholder:text-white/20"
                      />
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                      {[50, 100, 250, 500].map(n => (
                        <button 
                          key={n}
                          onClick={() => setLogLines(n)}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${logLines === n ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                          {n} Lines
                        </button>
                      ))}
                   </div>
                   <button 
                     onClick={fetchLogs}
                     className="p-3 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl transition-all border border-white/5"
                   >
                      <RefreshCw size={16} />
                   </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-10 font-mono text-[13px] leading-relaxed bg-black/50 custom-scrollbar scroll-smooth">
                {filteredLogs.length > 0 ? filteredLogs.map((line, i) => {
                   const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') || line.includes('[ERROR]');
                   const isWarn = line.toLowerCase().includes('warn') || line.includes('[WARN]');
                   const isSuccess = line.toLowerCase().includes('success') || line.includes('verified') || line.includes('connected');
                   return (
                      <div key={i} className={`py-1 flex gap-8 hover:bg-white/5 transition-colors group px-4 -mx-4 rounded-lg ${isError ? 'text-rose-400 bg-rose-400/5' : isWarn ? 'text-xq-gold' : isSuccess ? 'text-emerald-400' : 'text-slate-400'}`}>
                         <span className="opacity-10 group-hover:opacity-40 select-none text-right w-10 shrink-0 italic">{i+1}</span>
                         <span className="whitespace-pre-wrap">{line}</span>
                      </div>
                   );
                }) : (
                   <div className="h-full flex flex-col items-center justify-center gap-6 text-white/5 italic">
                      <Terminal size={64} />
                      <p className="text-sm font-black uppercase tracking-[0.3em]">No matching logs found</p>
                   </div>
                )}
                <div ref={logEndRef} />
            </div>

            {/* Terminal Actions */}
            <div className="p-8 border-t border-white/5 bg-black/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex gap-4 w-full sm:w-auto">
                   <button 
                     onClick={() => createIssueFromLogs()}
                     className="flex-1 sm:flex-none px-8 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                   >
                     Report Issue
                   </button>
                   <button 
                     onClick={analyzeLogs}
                     disabled={isAnalyzing}
                     className="flex-1 sm:flex-none px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-emerald-500/20"
                   >
                     {isAnalyzing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={16} />} 
                     AI Scan
                   </button>
                </div>
                <div className="flex items-center gap-6 opacity-30">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">Live</span>
                   </div>
                   <p className="text-[9px] font-black uppercase text-white tracking-widest">Tail enabled • UTF-8</p>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'git' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-sm space-y-10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4 text-xq-gold">
                      <GitBranch size={28} />
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest">Source Control</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Direct Git Integration</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => runGitAction('fetch')} className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-xq-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Git Fetch</button>
                      <button onClick={() => runGitAction('pull')} className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Git Pull</button>
                   </div>
                </div>

                <div className="p-8 bg-slate-950 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden">
                   <div className="absolute top-4 right-4 text-white/5 font-black text-4xl">GIT</div>
                   <pre className="text-[13px] font-mono text-sky-400 overflow-x-auto leading-relaxed relative z-10">
                     {status?.git || 'Fetching repository state...'}
                   </pre>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <Clock size={18} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last remote sync</span>
                   </div>
                   <span className="text-xs font-black italic">{new Date().toLocaleTimeString()}</span>
                </div>
             </div>

             <div className="bg-slate-900 text-white p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-4">
                      <Code size={28} />
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest">GitHub Management</h3>
                        <p className="text-[9px] font-bold text-white/40 uppercase mt-1">Official GitHub CLI</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => runGitAction('pr list -R hoanb1/xiangqi-web', 'gh')} className="px-6 py-3 bg-white/10 hover:bg-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Pull Requests</button>
                   </div>
                </div>

                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 h-48 overflow-y-auto custom-scrollbar italic font-mono text-slate-400 text-[11px] leading-relaxed">
                   {status?.gh || 'Validating GH session tokens...'}
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {[
                     { icon: MessageSquare, label: 'Browse Open Issues', color: 'text-blue-400', action: 'issue list -R hoanb1/xiangqi-web' },
                     { icon: Activity, label: 'CI/CD Pipelines', color: 'text-emerald-400', action: 'run list -R hoanb1/xiangqi-web' },
                   ].map((item, i) => (
                     <button 
                       key={i}
                       onClick={() => runGitAction(item.action, 'gh')}
                       className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center justify-between group transition-all"
                     >
                       <div className="flex items-center gap-5">
                          <item.icon size={20} className={item.color} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                       </div>
                       <Settings size={14} className="opacity-10 group-hover:rotate-90 group-hover:opacity-100 transition-all" />
                     </button>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
             {analysis ? (
                <div className="bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                   <div className="p-12 border-b border-slate-100 dark:border-white/5 bg-gradient-to-br from-blue-600/5 to-emerald-500/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/30">
                               <Zap size={36} />
                            </div>
                            <div>
                               <h3 className="text-2xl font-black italic uppercase tracking-tighter">AI Diagnostic Insight</h3>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Health Report • Engine V3.1</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            {!analysis.includes('ĐÃ TẠO ISSUE') && (
                               <button 
                                 onClick={() => createIssueFromLogs(analysis)}
                                 className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                               >
                                  Create Tech Issue
                               </button>
                            )}
                            <button onClick={() => setAnalysis(null)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-red-500 transition-colors">
                               <XCircle size={24} />
                            </button>
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-12 space-y-10">
                      <div className="bg-slate-50 dark:bg-black/50 rounded-[2.5rem] p-10 font-medium text-slate-700 dark:text-blue-50 leading-[2] text-[15px] whitespace-pre-wrap border border-slate-200/50 dark:border-white/5 shadow-inner italic">
                         {analysis}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {[
                           { icon: Activity, title: 'Performance Path', desc: 'Auto-scaling and endpoint caching recommended.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                           { icon: Shield, title: 'Security Posture', desc: 'Rethink anonymous access and audit repetitive re-auth.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                         ].map((tip, i) => (
                           <div key={i} className="p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-start gap-6 group hover:border-black/10 dark:hover:border-white/10 transition-all">
                              <div className={`p-4 rounded-2xl ${tip.bg} ${tip.color} group-hover:scale-110 transition-transform`}><tip.icon size={24} /></div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{tip.title}</p>
                                 <p className="text-xs font-bold leading-relaxed">{tip.desc}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             ) : (
                <div className="py-40 text-center space-y-10 group">
                   <div className="w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                      <Zap size={48} className="group-hover:text-xq-gold transition-colors" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter opacity-20">Awaiting Signal</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] max-w-sm mx-auto leading-loose">Navigate to the Terminal tab and initiate an AI Scan to generate an infrastructure technical report.</p>
                   </div>
                   <button 
                     onClick={() => setActiveTab('logs')}
                     className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/30"
                   >
                      Go to Terminal
                   </button>
                </div>
             )}

             <div className="bg-white dark:bg-slate-900/40 p-12 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-sm space-y-10">
                <div className="flex items-center gap-6">
                   <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl"><MessageSquare size={24} /></div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Issue Resolver Lab</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">AI-powered code fix suggestions for existing issues</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <input 
                     type="number" 
                     placeholder="GIVE ME AN ISSUE ID#" 
                     id="gh_issue_num"
                     className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl px-8 py-5 text-xs font-black outline-none focus:ring-4 ring-blue-500/10 transition-all"
                   />
                   <button 
                     onClick={() => {
                        const num = (document.getElementById('gh_issue_num') as HTMLInputElement).value;
                        analyzeGitHubIssue(num);
                     }}
                     className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                   >
                     Analyze Fix
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

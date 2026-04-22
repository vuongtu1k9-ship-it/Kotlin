import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, 
  Tooltip, Legend, Line 
} from 'recharts';
import { Database, Smartphone, Globe, AlertCircle, BellRing } from 'lucide-react';

interface SearchPerfTabProps {
  totalClicks: number;
  avgPosition: string | number;
  scChartDataAggregated: any[];
  topPages: any[];
  indexingStatus: any[];
  sitemaps: any;
  alerts: any[];
  onInspectUrl: (url: string) => void;
  onSpeedTest: (url: string) => void;
}

export const SearchPerfTab: React.FC<SearchPerfTabProps> = ({ 
  totalClicks, avgPosition, scChartDataAggregated, topPages, 
  indexingStatus, sitemaps, alerts, onInspectUrl, onSpeedTest 
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-700">
       <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10"><Database size={200} /></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="md:col-span-2">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-orange-400 mb-6">Search Console Intel</h3>
                <h4 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Organic Growth</h4>
                <p className="text-white/40 text-[10px] font-bold uppercase leading-relaxed max-w-sm">Dữ liệu hợp nhất từ Google Search Console cho phép theo dõi tỷ lệ nhấp chuột (CTR) và vị trí trung bình của từ khóa.</p>
             </div>
             <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col justify-center text-center">
                <p className="text-[9px] font-black uppercase text-orange-400 mb-2">Total Clicks</p>
                <p className="text-5xl font-black tracking-tighter italic">{totalClicks.toLocaleString()}</p>
             </div>
             <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col justify-center text-center">
                <p className="text-[9px] font-black uppercase text-blue-400 mb-2">Avg Position</p>
                <p className="text-5xl font-black tracking-tighter italic text-blue-400">{avgPosition}</p>
             </div>
          </div>
       </div>

       <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3.5rem] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl"><Smartphone size={20} /></div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Device Comparison Trend</h4>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mobile vs Desktop Organic Clicks</p>
                </div>
             </div>
          </div>
          <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scChartDataAggregated}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} />
                   <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }} />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }} />
                   <Line type="monotone" dataKey="mobileClicks" name="Mobile" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                   <Line type="monotone" dataKey="desktopClicks" name="Desktop" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </ComposedChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3.5rem] shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-[2000ms]"><Globe size={180} /></div>
          <div className="flex items-center justify-between mb-10">
             <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">URL Inspector & Indexing Status</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status of your top 50 landing pages</p>
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full">
                <thead className="text-[9px] font-black uppercase text-slate-500/50 border-b border-slate-100 dark:divide-white/5 text-left">
                   <tr>
                      <th className="pb-4">Page Path</th>
                      <th className="pb-4 text-center">Indexing Status</th>
                      <th className="pb-4 text-right">Clicks</th>
                      <th className="pb-4 text-right">Avg. Pos</th>
                      <th className="pb-4 text-center">Rich Results</th>
                      <th className="pb-4 text-right">Last Crawl</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                   {topPages?.map((p: any, i: number) => {
                      const status = indexingStatus?.find((s: any) => s.url === p.keys[0]);
                      const isGood = status?.state === 'PASS' || status?.state === 'GOOD' || status?.verdict === 'INDEXED';
                      return (
                         <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-black/20 transition-all cursor-default">
                             <td className="py-5 px-2 font-mono text-[10px] text-slate-500 dark:text-blue-200/40 truncate max-w-[280px]">{p.keys[0].replace(/https?:\/\/[^\/]+/, '') || '/'}</td>
                             <td className="py-5 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${isGood ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>
                                   {(status?.verdict || 'PENDING').replace('VERDICT_', '')}
                                </span>
                             </td>
                             <td className="py-5 text-right font-black italic text-emerald-500">{(p.clicks || 0).toLocaleString()}</td>
                             <td className="py-5 text-right font-black text-blue-500">{(p.position || 0).toFixed(1)}</td>
                             <td className="py-5 text-center">
                                <div className="flex justify-center gap-1">
                                   {status?.richResults?.map((r: any, j: number) => (
                                      <span key={j} className="w-1.5 h-1.5 rounded-full bg-blue-500" title={r.type} />
                                   ))}
                                </div>
                             </td>
                             <td className="py-5 text-right text-[9px] font-bold text-slate-400">{status?.lastCrawlTime ? new Date(status.lastCrawlTime).toLocaleDateString() : '—'}</td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-8 rounded-[3rem] shadow-sm">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2"><Globe size={14} /> XML Feed Status</h4>
                <div className="space-y-4">
                   {sitemaps?.sitemap?.map((s: any, i: number) => (
                      <div key={i} className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                         <div className="truncate max-w-[140px]">
                            <p className="text-[9px] font-mono text-slate-500 truncate lowercase">{s.path.split('/').pop()}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                              {Array.isArray(s.contents) ? (
                                <span>
                                  {s.contents[0]?.submitted || 0} Sub / {s.contents[0]?.indexed || 0} Idx
                                </span>
                              ) : (s.contents || '—')} URLs
                            </p>
                         </div>
                         <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${!s.errors || s.errors === "0" ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {(!s.errors || s.errors === "0") ? 'VALID' : 'ERROR'}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-900 border border-white/5 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><BellRing size={80} /></div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-6 italic">Critical Alerts Dashboard</h4>
                <div className="space-y-4">
                   {alerts?.map((a, i) => (
                      <div key={i} className={`p-5 rounded-2xl border ${a.type === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-100' : 'bg-amber-500/10 border-amber-500/20 text-amber-100'}`}>
                         <div className="flex items-center gap-3 mb-2">
                            <AlertCircle size={14} className={a.type === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                            <p className="text-[9px] font-black uppercase tracking-widest">{a.title}</p>
                         </div>
                         <p className="text-[10px] opacity-60 font-bold leading-normal mb-1">{a.message}</p>
                      </div>
                   ))}
                   {(!alerts || alerts.length === 0) && (
                      <div className="py-10 text-center opacity-20 italic text-[10px] uppercase font-black tracking-widest">No issues detected</div>
                   )}
                </div>
             </div>
          </div>
       </div>
  );
};

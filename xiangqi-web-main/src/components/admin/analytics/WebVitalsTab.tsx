import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, 
  Tooltip, Area, Line 
} from 'recharts';
import { Zap, Smartphone, Monitor, Binary } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface WebVitalsTabProps {
  perfStrategy: 'mobile' | 'desktop';
  setPerfStrategy: (s: 'mobile' | 'desktop') => void;
  runSpeedTest: (url?: string) => void;
  isTestingSpeed: boolean;
  data: any;
  onInspectUrl: (url: string) => void;
}

export const WebVitalsTab: React.FC<WebVitalsTabProps> = ({ 
  perfStrategy, setPerfStrategy, runSpeedTest, isTestingSpeed, data, onInspectUrl 
}) => {
  const perf = data?.performance?.[perfStrategy];
  
  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
       {/* Core Web Vitals Header */}
       <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-12 rounded-[4rem] relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-[2000ms]"><Zap size={250} /></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
             <div>
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-blue-500 mb-6">User Experience Laboratory</h3>
                <h4 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-slate-900 dark:text-white">Web Vitals Hub</h4>
                <div className="flex items-center gap-6 mt-6">
                   <button 
                      onClick={() => setPerfStrategy('mobile')}
                      className={`flex items-center gap-2 group transition-all ${perfStrategy === 'mobile' ? 'text-blue-500' : 'text-slate-400'}`}
                   >
                      <div className={`p-3 rounded-2xl ${perfStrategy === 'mobile' ? 'bg-blue-500 text-white shadow-xl' : 'bg-slate-100 dark:bg-white/5'} transition-all`}><Smartphone size={20} /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Mobile Strategy</span>
                   </button>
                    <button 
                       onClick={() => setPerfStrategy('desktop')}
                       className={`flex items-center gap-2 group transition-all ${perfStrategy === 'desktop' ? 'text-blue-500' : 'text-slate-400'}`}
                    >
                       <div className={`p-3 rounded-2xl ${perfStrategy === 'desktop' ? 'bg-blue-500 text-white shadow-xl' : 'bg-slate-100 dark:bg-white/5'} transition-all`}><Monitor size={20} /></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Desktop Strategy</span>
                    </button>
                    <div className="w-px h-10 bg-slate-200 dark:bg-white/10 mx-2" />
                   <button 
                      onClick={() => runSpeedTest()}
                      disabled={isTestingSpeed}
                      className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/10 disabled:opacity-50"
                   >
                      <Zap size={16} className={isTestingSpeed ? 'animate-spin text-emerald-500' : 'text-emerald-500'} /> {isTestingSpeed ? 'Analyzing Page...' : 'Execute Lab Test'}
                   </button>
                </div>
             </div>
             <div className="text-right flex flex-col items-end gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Field Performance</span>
                 <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-8 h-2 rounded-full bg-emerald-500/20" />)}
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
             <MetricCard 
                label="LCP" 
                sub="Largest Contentful Paint" 
                value={perf?.lcp?.percentile !== undefined ? (perf.lcp.percentile / 1000).toFixed(2) : '—'} 
                unit="s" 
                category={perf?.lcp?.category} 
                desc="Đo tải nội dung chính." 
             />
             <MetricCard 
                label="FID" 
                sub="First Input Delay" 
                value={perf?.fid?.percentile ?? '—'} 
                unit="ms" 
                category={perf?.fid?.category} 
                desc="Độ trễ tương tác đầu." 
             />
             <MetricCard 
                label="CLS" 
                sub="Cumulative Layout Shift" 
                value={perf?.cls?.percentile !== undefined ? (perf.cls.percentile / 100).toFixed(3) : '—'} 
                unit="" 
                category={perf?.cls?.category} 
                desc="Độ ổn định khi bố cục." 
             />
             <MetricCard 
                label="INP" 
                sub="Interaction to Next Paint" 
                value={perf?.inp?.percentile ?? '—'} 
                unit="ms" 
                category={perf?.inp?.category} 
                desc="Phản hồi tương tác tổng." 
             />
          </div>
       </div>

       {/* History Trend Chart */}
       {data?.vitalsHistory && data.vitalsHistory.length > 0 && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3.5rem] shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Historical Speed Analysis</h4>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">LCP & CLS Trend Correlation ({perfStrategy})</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[8px] font-black text-slate-400 uppercase">LCP (s)</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] font-black text-slate-400 uppercase">CLS (x10)</span></div>
                </div>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={data.vitalsHistory.filter((h: any) => h.strategy === perfStrategy).map((h: any) => ({
                      date: new Date(h.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                      lcp: (h.metrics.lcp || 0) / 1000,
                      cls: (h.metrics.cls || 0) * 10,
                   }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 'bold', fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} />
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }} />
                      <Area type="monotone" dataKey="lcp" name="LCP (s)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={3} />
                      <Line type="monotone" dataKey="cls" name="CLS (x10)" stroke="#10b981" strokeWidth={3} dot={false} />
                   </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>
       )}

       {/* URL Indexing Status Table */}
       <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-10 text-blue-500">
             <div className="flex items-center gap-4">
                <Binary size={24} />
                <h4 className="text-xs font-black uppercase tracking-widest">URL Inspector & Indexing Status</h4>
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full">
                <thead className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-white/5 text-left">
                   <tr>
                      <th className="pb-5 px-2">Production URL Path</th>
                      <th className="pb-5 px-2 text-right">Traffic</th>
                      <th className="pb-5 px-2 text-center">LCP (s)</th>
                      <th className="pb-5 px-2 text-center">CLS</th>
                      <th className="pb-5 px-2 text-center">Index</th>
                      <th className="pb-5 px-2 text-right">Optimization</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                   {data?.topPages?.map((p: any, i: number) => {
                      const indexing = data?.indexingStatus?.find((idx: any) => idx.url === p.keys[0]);
                      const isGood = indexing?.state === 'PASS' || indexing?.state === 'GOOD';
                      const perfData = (data as any).pagesPerformance?.find((item: any) => item.url === p.keys[0])?.perf;
                      
                      const lcpVal = perfData?.lcp?.percentile ? (perfData.lcp.percentile / 1000).toFixed(2) : '—';
                      const clsVal = perfData?.cls?.percentile !== undefined ? (perfData.cls.percentile / 100).toFixed(3) : '—';
                      const lcpCat = perfData?.lcp?.category;
                      const clsCat = perfData?.cls?.category;

                      return (
                         <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-black/20 transition-all">
                            <td className="py-5 px-2 font-mono text-[10px] text-slate-500 dark:text-blue-200/40 truncate max-w-[200px]">{p.keys[0].replace(/https?:\/\/[^\/]+/, '') || '/'}</td>
                            <td className="py-5 px-2 text-right font-black italic">{p.clicks.toLocaleString()}</td>
                            <td className="py-5 px-2 text-center">
                               <span className={`text-[10px] font-black ${lcpCat === 'FAST' ? 'text-emerald-500' : lcpCat === 'AVERAGE' ? 'text-amber-500' : lcpCat === 'POOR' ? 'text-red-500' : 'text-slate-400 opacity-30'}`}>
                                  {lcpVal}
                               </span>
                            </td>
                            <td className="py-5 px-2 text-center">
                               <span className={`text-[10px] font-black ${clsCat === 'FAST' ? 'text-emerald-500' : clsCat === 'AVERAGE' ? 'text-amber-500' : clsCat === 'POOR' ? 'text-red-500' : 'text-slate-400 opacity-30'}`}>
                                  {clsVal}
                               </span>
                            </td>
                            <td className="py-5 px-2 text-center">
                               <div className="flex justify-center">
                                  {indexing ? (
                                     <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${isGood ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>
                                        {(indexing.state || 'UNKNOWN').toUpperCase().replace(/_/g, ' ')}
                                     </span>
                                  ) : <span className="text-[9px] opacity-20 uppercase font-bold">—</span>}
                               </div>
                            </td>
                            <td className="py-5 px-2 text-right space-x-4">
                               <button 
                                  onClick={() => onInspectUrl(p.keys[0])}
                                  className="text-[9px] font-black uppercase tracking-widest text-[#3b82f6] hover:text-blue-400 transition-colors"
                               >
                                  Inspect URL
                               </button>
                               <button 
                                  onClick={() => runSpeedTest(p.keys[0])}
                                  className="text-[9px] font-black uppercase tracking-widest text-[#10b981] hover:text-emerald-400 transition-colors"
                               >
                                  Speed Test
                               </button>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

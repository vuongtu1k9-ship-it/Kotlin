import React from 'react';
import { 
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, 
  Tooltip, Bar 
} from 'recharts';
import { Zap, TrendingUp, Compass, Target } from 'lucide-react';

interface KeywordsTabProps {
  aiInsights: any;
  data: any;
}

export const KeywordsTab: React.FC<KeywordsTabProps> = ({ aiInsights, data }) => {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
       {/* Breakout Radar */}
       {aiInsights?.expansion?.breakoutKeywords && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-12 rounded-[4rem] shadow-sm">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-8 flex items-center gap-2">
                <Zap size={16} className="animate-pulse" /> Real-time Breakout Radar (Last 24-48h)
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiInsights.expansion.breakoutKeywords.map((kw: any, i: number) => (
                   <div key={i} className="bg-white dark:bg-black/40 p-6 rounded-3xl border border-rose-500/10 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={40} className="text-rose-500" /></div>
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{kw.keyword}</span>
                         <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-md uppercase">{kw.growth}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{kw.reason}</p>
                   </div>
                ))}
             </div>
          </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
             {/* Spikes Chart */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-12 rounded-[4rem] shadow-sm">
                <div className="flex items-center justify-between mb-12">
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4">Trend Spikes</h4>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Rising Stars</h3>
                   </div>
                </div>
                <div className="h-[350px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.trends?.slice(0, 10)} layout="vertical" margin={{ left: 100, right: 40 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#88888811" />
                         <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                         <YAxis dataKey="query" type="category" axisLine={false} tickLine={false} width={120} tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} />
                         <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }} />
                         <Bar dataKey="current" name="Current Clicks" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                         <Bar dataKey="currentImpressions" name="Volume (Imp)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="space-y-12">
             {/* Cluster Stats */}
             {aiInsights?.expansion && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-12 rounded-[4rem] shadow-sm">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2"><Compass size={14} /> Market Clusters</h4>
                   <div className="space-y-4">
                      {aiInsights.expansion.clusters?.map((c: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-[10px] font-bold p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <span className="text-slate-600 dark:text-slate-400">{c.name}</span>
                            <span className={`px-2 py-0.5 rounded-md ${c.status === 'Strong' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{c.count}</span>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {/* Opportunity Radar placeholder/summary */}
             <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Target size={120} /></div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-6 italic">Opportunity Radar</h4>
                <div className="space-y-6">
                   <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Keywords with Potential</p>
                       <p className="text-3xl font-black italic tracking-tighter">{data?.topQueries?.filter((q: any) => q.position > 10 && q.position < 30).length || 0}</p>
                       <p className="text-[8px] font-bold text-blue-400/60 uppercase">Currently on page 2-3</p>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

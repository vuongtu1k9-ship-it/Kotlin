import React from 'react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, Tooltip
} from 'recharts';
import { Sparkles, RefreshCw, Info, Target, ListRestart } from 'lucide-react';

interface AiStrategyTabProps {
  aiInsights: any;
  isGeneratingInsights: boolean;
  onGenerateInsights: () => void;
  days: number;
}

export const AiStrategyTab: React.FC<AiStrategyTabProps> = ({ 
  aiInsights, isGeneratingInsights, onGenerateInsights, days 
}) => {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
       <div className="bg-slate-900 border border-white/5 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03]"><Sparkles size={300} /></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
             <div className="max-w-xl">
                <h3 className="text-xs font-black uppercase tracking-[0.6em] text-blue-500 mb-8">AI Augmented Intelligence</h3>
                <h4 className="text-6xl font-black italic tracking-tighter uppercase mb-6 leading-none">Strategic Nexus</h4>
                <p className="text-white/40 text-xs font-bold leading-relaxed mb-10">
                   Sử dụng mô hình AI Gemini Pro để phân tích toàn bộ dữ liệu {days} ngày qua, tìm ra các khoảng trống thị trường và cơ hội tăng trưởng nội dung.
                </p>
                <button 
                   onClick={onGenerateInsights}
                   disabled={isGeneratingInsights}
                   className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                   {isGeneratingInsights ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                   {isGeneratingInsights ? 'Computing Global Strategy...' : 'Regenerate Neural Analysis'}
                </button>
             </div>
             <div className="flex-1 lg:max-w-md space-y-4">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Info size={14} /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Analysis Scope</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-2xl font-black italic leading-none">{days}D</p>
                         <p className="text-[8px] font-bold text-white/40 uppercase mt-1">Time Horizon</p>
                      </div>
                      <div>
                         <p className="text-2xl font-black italic leading-none text-emerald-500">Live</p>
                         <p className="text-[8px] font-bold text-white/40 uppercase mt-1">Data Stream</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {aiInsights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             {/* Content Gaps */}
             <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Target size={16} /> Content Opportunity Gaps</h4>
                <div className="grid grid-cols-1 gap-4">
                   {aiInsights.contentGaps?.map((gap: any, i: number) => (
                      <div key={i} className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] hover:border-blue-500/30 transition-all group">
                         <div className="flex justify-between items-start mb-4">
                             <span className="text-lg font-black italic tracking-tighter uppercase text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase">{gap.topic}</span>
                             <span className="px-3 py-1 bg-blue-500/5 text-blue-500 text-[8px] font-black rounded-full uppercase border border-blue-500/20">{gap.priority}</span>
                         </div>
                         <p className="text-xs text-slate-500 dark:text-white/40 font-bold mb-6 leading-relaxed">{gap.recommendation}</p>
                         <div className="flex flex-wrap gap-2">
                            {gap.keywords?.map((kw: string, j: number) => (
                               <span key={j} className="text-[8px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400">{kw}</span>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Semantic Intelligence */}
             <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><ListRestart size={16} /> Semantic Intensity Graph</h4>
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 h-[500px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#88888811" />
                         <XAxis type="number" dataKey="volume" name="Volume" unit=" imp" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                         <YAxis type="number" dataKey="relevance" name="Relevance" unit="%" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                         <ZAxis type="number" dataKey="opportunity" range={[100, 1000]} name="Opportunity" />
                         <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }} />
                         <Scatter name="Keywords" data={aiInsights.semanticMap || []} fill="#3b82f6" opacity={0.6} />
                      </ScatterChart>
                   </ResponsiveContainer>
                   <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                         <p className="text-2xl font-black italic tracking-tighter text-blue-500">{aiInsights.semanticMap?.length || 0}</p>
                         <p className="text-[8px] font-black uppercase text-slate-400">Total Nodes</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                         <p className="text-2xl font-black italic tracking-tighter text-emerald-500">{(aiInsights.semanticScore || 0).toFixed(1)}</p>
                         <p className="text-[8px] font-black uppercase text-slate-400">Semantic Cohesion</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

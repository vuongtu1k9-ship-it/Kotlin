import React from 'react';
import { Zap } from 'lucide-react';

export const LabMetricCard: React.FC<any> = ({ label, sub, value, unit, category, desc }) => {
  const isGood = category === 'FAST';
  const isAvg = category === 'AVERAGE';
  const isPoor = category === 'POOR';
  return (
    <div className="bg-white/40 dark:bg-black/20 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 backdrop-blur-md group hover:border-blue-500/30 transition-all flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
              <p className="text-[8px] font-bold uppercase text-slate-300 truncate max-w-[100px]">{sub}</p>
           </div>
           <div className={`w-3.5 h-3.5 rounded-full ${isGood ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : isAvg ? 'bg-amber-500' : isPoor ? 'bg-red-500' : 'bg-slate-300'} animate-pulse`} />
        </div>
        <div className="flex items-baseline gap-2">
           <span className="text-5xl font-black tracking-tighter italic text-slate-900 dark:text-white leading-none">{value}</span>
           <span className="text-[10px] font-black text-slate-400 uppercase italic">{unit}</span>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
         <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isGood ? 'text-emerald-500' : isAvg ? 'text-amber-500' : isPoor ? 'text-red-500' : 'text-slate-400'}`}>
            {isGood ? 'Optimal Status' : isAvg ? 'Needs Tuning' : isPoor ? 'Critical Alert' : 'Calculating...'}
         </p>
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
  );
};

export const SpeedTestResultModal: React.FC<any> = ({ isOpen, onClose, url, data, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
        <div className="p-12 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-2xl shadow-emerald-500/20"><Zap size={28} /></div>
             <div>
                <h2 className="text-2xl font-black italic tracking-tighter dark:text-white uppercase leading-none">Lab Performance Report</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{url || 'Global Domain Edge'}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-red-500 transition-all font-black text-xs uppercase">Esc</button>
        </div>

        <div className="p-12">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-10 text-center">
              <div className="relative">
                 <div className="w-24 h-24 border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 rounded-full animate-spin" />
                 <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" size={32} />
              </div>
              <div className="space-y-3">
                 <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] animate-pulse">Running Neural Optimization Audit...</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-50">Simulation takes ~60 seconds to synthesize lab data</p>
              </div>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <LabMetricCard 
                 label="LCP" 
                 sub="Largest Contentful" 
                 value={(data.lcp.percentile && !isNaN(data.lcp.percentile)) ? (data.lcp.percentile/1000).toFixed(2) : '—'} 
                 unit="s" 
                 category={data.lcp.category} 
                 desc="Main content render speed." 
               />
               <LabMetricCard 
                 label="FID" 
                 sub="Input Delay" 
                 value={data.fid.percentile ?? '—'} 
                 unit="ms" 
                 category={data.fid.category} 
                 desc="Response time to user." 
               />
               <LabMetricCard 
                 label="CLS" 
                 sub="Layout Shift" 
                 value={(data.cls.percentile && !isNaN(data.cls.percentile)) ? (data.cls.percentile/100).toFixed(3) : '—'} 
                 unit="" 
                 category={data.cls.category} 
                 desc="Visual stability rating." 
               />
               <LabMetricCard 
                 label="INP" 
                 sub="Next Paint" 
                 value={data.inp.percentile ?? '—'} 
                 unit="ms" 
                 category={data.inp.category} 
                 desc="Total interactive delay." 
               />
            </div>
          ) : (
             <div className="py-20 text-center text-red-500 font-black uppercase tracking-widest animate-bounce">Critical Fault during lab analysis</div>
          )}
        </div>

        <div className="p-8 bg-slate-50 dark:bg-black/40 text-center">
            <button onClick={onClose} className="bg-slate-900 dark:bg-white text-white dark:text-black px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl active:scale-95">Complete Audit</button>
        </div>
      </div>
    </div>
  );
};

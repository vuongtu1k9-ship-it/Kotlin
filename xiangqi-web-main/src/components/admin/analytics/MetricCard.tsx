import React from 'react';

interface MetricCardProps {
  label: string;
  sub: string;
  value: string | number;
  unit: string;
  category?: 'GOOD' | 'AVERAGE' | 'POOR' | 'FAST';
  desc: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, sub, value, unit, category, desc }) => {
  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'GOOD':
      case 'FAST':
        return 'bg-emerald-500';
      case 'AVERAGE':
        return 'bg-amber-500';
      case 'POOR':
        return 'bg-red-500';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase">{sub}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`} />
      </div>
      <p className="text-3xl font-black italic tracking-tighter mb-1">
        {value}<span className="text-sm font-bold opacity-40">{unit}</span>
      </p>
      <p className="text-[9px] font-bold text-slate-400 uppercase">{desc}</p>
    </div>
  );
};

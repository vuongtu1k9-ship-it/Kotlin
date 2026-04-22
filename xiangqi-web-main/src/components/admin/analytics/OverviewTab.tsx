import React from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  ComposedChart, CartesianGrid, XAxis, YAxis, Area 
} from 'recharts';
import { MapPin } from 'lucide-react';

interface OverviewTabProps {
  activeUsers: number;
  totalViews: number;
  avgPosition: string | number;
  totalUsers: number;
  pieData: any[];
  unifiedDataChart: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  activeUsers, totalViews, avgPosition, totalUsers, pieData, unifiedDataChart 
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Load Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
           <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                 <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100 italic">Global Realtime Load</h3>
              </div>
              <div>
                 <div className="text-8xl font-black tracking-tighter leading-none mb-2">{activeUsers}</div>
                 <p className="text-xs font-bold text-blue-100/60 uppercase tracking-widest">Active users right now</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-black/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[8px] font-black uppercase text-blue-200/50 mb-1">Total Hits</p>
                    <p className="text-lg font-black">{totalViews.toLocaleString()}</p>
                 </div>
                 <div className="p-4 bg-black/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[8px] font-black uppercase text-blue-200/50 mb-1">Avg Rank</p>
                    <p className="text-lg font-black">{avgPosition}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Demographic Density */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3rem] shadow-sm overflow-hidden flex flex-col md:flex-row gap-10">
           <div className="flex-1 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3"><MapPin size={16} /> Demographic Density</h3>
              <div className="space-y-5">
                 {pieData.map((item: any, idx) => (
                    <div key={item.name} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5] }} /> 
                            {item.name}
                          </span>
                          <span className="text-slate-400">{item.value} users</span>
                       </div>
                       <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-1000" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5], width: `${(item.value / (activeUsers || 1)) * 100}%` }} />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           <div className="w-full md:w-[260px] flex items-center justify-center bg-slate-50 dark:bg-black/20 rounded-[2rem] p-4">
              <ResponsiveContainer width="100%" height={240}>
                 <PieChart>
                    <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                       {pieData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '16px', border: 'none', color: '#fff' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Traffic Performance unified chart */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px]" />
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Traffic Performance</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Unified GA4 Engagement Metrics</p>
            </div>
            <div className="flex items-center gap-10">
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Total Users</p>
                  <p className="text-2xl font-black italic">{totalUsers.toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Page Impressions</p>
                  <p className="text-2xl font-black italic text-blue-500">{totalViews.toLocaleString()}</p>
               </div>
            </div>
         </div>

         <div className="h-[450px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={unifiedDataChart}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '20px', padding: '16px' }}
                   itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                 />
                 <Area type="monotone" dataKey="views" name="Page Views" stroke="#10b981" strokeWidth={3} fillOpacity={0.1} fill="#10b981" />
                 <Area type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" />
              </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

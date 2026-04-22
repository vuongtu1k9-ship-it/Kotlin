import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Area, PieChart, Pie, Cell, Legend, ComposedChart, Line,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, AreaChart
} from 'recharts';
import { 
  TrendingUp, Search, AlertCircle, 
  Zap, Smartphone, Monitor, BellRing, Globe,
  Activity, MapPin, LayoutDashboard, Database, BarChart3, Binary,
  Sparkles, ListRestart, Info, RefreshCw, Target, Compass
} from 'lucide-react';
import { AiSceoModal } from './admin/AiSceoModal';
import { API_URL } from '../auth/auth';
import { useToast } from './ui/Toast';

interface MetricCardProps {
  label: string;
  sub: string;
  value: string | number;
  unit: string;
  category?: 'GOOD' | 'AVERAGE' | 'POOR';
  desc: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, sub, value, unit, category, desc }) => (
  <div className="bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase">{sub}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${category === 'GOOD' ? 'bg-emerald-500' : category === 'AVERAGE' ? 'bg-amber-500' : 'bg-red-500'}`} />
    </div>
    <p className="text-3xl font-black italic tracking-tighter mb-1">{value}<span className="text-sm font-bold opacity-40">{unit}</span></p>
    <p className="text-[9px] font-bold text-slate-400 uppercase">{desc}</p>
  </div>
);

interface AnalyticsData {
  analytics: any;
  searchConsole: any;
  sitemaps: any;
  topQueries: any[];
  topPages: any[];
  devices: any[];
  performance: {
    mobile: any;
    desktop: any;
  };
  indexingStatus: any[];
  alerts: any[];
  realtime?: any;
  vitalsHistory: any[];
  trends: any[];
  deltas: any[];
  kwAnalysis: any;
}

export const AdminAnalyticsDashboard: React.FC<{ authState: any }> = ({ authState }) => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'overview') as 'overview' | 'search' | 'keywords' | 'speed' | 'ai';
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [days, setDays] = useState(30);
  const [seoModal, setSeoModal] = useState<{ open: boolean, url: string }>({ open: false, url: '' });
  const [perfStrategy, setPerfStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [speedModal, setSpeedModal] = useState<{ open: boolean, url: string, data: any }>({ open: false, url: '', data: null });
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [trendModal, setTrendModal] = useState<{ open: boolean, query: string, data: any[], type: 'keyword' | 'page', granularity: string }>({ 
    open: false, query: '', data: [], type: 'keyword', granularity: 'day' 
  });
  const [isFetchingTrend, setIsFetchingTrend] = useState(false);

  const fetchTrend = async (query: string, type: 'keyword' | 'page' = 'keyword', granularity: string = 'day') => {
    console.log(`[Trend] Fetching ${type} trend for:`, query, 'granularity:', granularity);
    setTrendModal(prev => ({ ...prev, open: true, query, type, granularity, data: (prev.query === query && prev.granularity === granularity) ? prev.data : [] }));
    setIsFetchingTrend(true);
    try {
      const endpoint = type === 'page' ? 'page-trend' : 'keyword-trend';
      const param = type === 'page' ? 'page' : 'query';
      const url = `${API_URL}/admin/analytics/${endpoint}?${param}=${encodeURIComponent(query)}&days=365&granularity=${granularity}`;
      console.log(`[Trend] URL:`, url);
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      console.log(`[Trend] Received data:`, d);
      if (d.ok) setTrendModal(prev => ({ ...prev, data: d.data }));
    } catch (e) {
      console.error(`[Trend] Fetch failed:`, e);
      toast.error('Không thể lấy lịch sử');
    } finally {
      setIsFetchingTrend(false);
    }
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/analytics/status`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      setIsEnabled(d.enabled);
      if (d.enabled) fetchData();
      else setLoading(false);
    } catch (e) {
      toast.error('Không thể kiểm tra trạng thái API');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!data) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/analytics/summary?days=${days}`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) {
        setData(d.data);
      } else {
        toast.error(d.error);
      }
    } catch (e) {
      toast.error('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsights = async () => {
    setIsGeneratingInsights(true);
    setAiInsights(null);
    try {
      const res = await fetch(`${API_URL}/admin/analytics/insights?days=${days}`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) {
        setAiInsights(d.data);
      } else {
        toast.error('Lỗi khi tạo phân tích AI');
      }
    } catch (e) {
      toast.error('Lỗi kết nối AI');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const runSpeedTest = async (url = '') => {
    setIsTestingSpeed(true);
    setSpeedModal({ open: true, url, data: null });
    try {
      const res = await fetch(`${API_URL}/admin/analytics/speed-test`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ strategy: perfStrategy, url })
      });
      const d = await res.json();
      if (d.ok) {
        setSpeedModal(prev => ({ ...prev, data: d.data }));
        if (!url) {
          setData((prev: any) => ({
            ...prev,
            performance: { ...prev.performance, [perfStrategy]: d.data }
          }));
        }
      } else {
        setSpeedModal({ open: false, url: '', data: null });
        toast.error('Lỗi speed test: ' + d.error);
      }
    } catch (e) {
      setSpeedModal({ open: false, url: '', data: null });
      toast.error('Lỗi kết nối');
    } finally {
      setIsTestingSpeed(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    let interval: any;
    if (isEnabled) interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [days, isEnabled]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Synchronizing Global Analytics Hub...</p>
    </div>
  );

  if (!isEnabled) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 p-12 rounded-[3rem] text-center max-w-2xl mx-auto shadow-2xl">
        <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-amber-500">
           <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-amber-900 dark:text-amber-500 mb-4 uppercase italic">Google API Required</h2>
        <p className="text-amber-700/60 font-medium mb-10 leading-relaxed text-sm">
           Vui lòng hoàn tất cấu hình GA4, Search Console và PageSpeed API trong tab Cài đặt để kích hoạt trạm phân tích.
        </p>
        <button onClick={fetchStatus} className="bg-amber-500 text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Retry Authentication</button>
      </div>
    );
  }

  const analyticsRows = data?.analytics?.rows || [];
  const chartData = analyticsRows.map((row: any) => ({
    rawDate: row.dimensionValues[0].value,
    date: row.dimensionValues[0].value.replace(/^(\d{4})(\d{2})(\d{2})$/, '$3/$2'),
    users: parseInt(row.metricValues[0].value),
    views: parseInt(row.metricValues[2].value),
  })).sort((a: any, b: any) => a.rawDate.localeCompare(b.rawDate));

  const totalUsers = chartData.reduce((acc: number, curr: any) => acc + curr.users, 0);
  const totalViews = chartData.reduce((acc: number, curr: any) => acc + curr.views, 0);

  const realtimeRows = data?.realtime?.rows || [];
  const activeUsers = realtimeRows.reduce((acc: number, row: any) => acc + parseInt(row.metricValues[0].value), 0);
  
  const pieData = Object.entries(realtimeRows.reduce((acc: any, row: any) => {
    const country = row.dimensionValues[0].value;
    acc[country] = (acc[country] || 0) + parseInt(row.metricValues[0].value);
    return acc;
  }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 5);

  const scRows = data?.searchConsole?.rows || [];
  const scChartDataRaw = scRows.map((row: any) => ({
    rawDate: row.keys[0],
    date: row.keys[0].split('-').slice(1).reverse().join('/'),
    device: row.keys[1]?.toLowerCase(),
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
  })).sort((a: any, b: any) => a.rawDate.localeCompare(b.rawDate));

  const scChartDataAggregated = Array.from(new Set(scChartDataRaw.map((r: any) => r.date))).map((date: any) => {
    const dayRows = scChartDataRaw.filter((r: any) => r.date === date);
    return {
      date,
      clicks: dayRows.reduce((acc: number, r: any) => acc + r.clicks, 0),
      mobileClicks: dayRows.find((r: any) => r.device === 'mobile')?.clicks || 0,
      desktopClicks: dayRows.find((r: any) => r.device === 'desktop')?.clicks || 0,
    };
  });

  const totalClicks = scChartDataRaw.reduce((acc: number, curr: any) => acc + curr.clicks, 0);
  const avgPosition = scChartDataRaw.length > 0 
    ? (scChartDataRaw.reduce((acc: number, curr: any) => acc + curr.position, 0) / scChartDataRaw.length).toFixed(1)
    : '-';

  const unifiedDataChart = chartData.map((ga: any) => {
    const sc = scChartDataAggregated.find((s: any) => s.date === ga.date);
    return { ...ga, clicks: sc?.clicks || 0 };
  });

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[120px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[120px] -ml-40 -mb-40" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/20 shrink-0">
              <BarChart3 size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter leading-none italic uppercase">Analytics</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                   <Activity size={10} className="animate-pulse" /> Live Metrics
                </span>
                <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">GA4 • Search Console • PageSpeed</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
            {[7, 30, 90].map(d => (
              <button 
                key={d}
                onClick={() => setDays(d)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  days === d ? 'bg-white text-black shadow-2xl scale-105' : 'text-white/40 hover:text-white'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-2 rounded-3xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'search', label: 'Search Perf', icon: TrendingUp },
          { id: 'keywords', label: 'Từ khóa & Thị trường', icon: Target },
          { id: 'speed', label: 'Web Vitals', icon: Zap },
          { id: 'ai', label: 'AI Strategy', icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-xl scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[600px] animate-in slide-in-from-bottom-6 duration-700">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

              <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-10 rounded-[3rem] shadow-sm overflow-hidden flex flex-col md:flex-row gap-10">
                 <div className="flex-1 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3"><MapPin size={16} /> Demographic Density</h3>
                    <div className="space-y-5">
                       {pieData.map((item: any, idx) => (
                          <div key={item.name} className="space-y-2">
                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx] }} /> {item.name}</span>
                                <span className="text-slate-400">{item.value} users</span>
                             </div>
                             <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-1000" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx], width: `${(item.value / (activeUsers || 1)) * 100}%` }} />
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
        )}

        {activeTab === 'search' && (
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
                         {data?.topPages?.map((p: any, i: number) => {
                            const status = data.indexingStatus?.find((s: any) => s.url === p.keys[0]);
                            const isGood = status?.state === 'PASS' || status?.state === 'GOOD' || status?.verdict === 'INDEXED';
                            return (
                               <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-black/20 transition-all cursor-default">
                                   <td className="py-5 px-2 font-mono text-[10px] text-slate-500 dark:text-blue-200/40 truncate max-w-[280px]">
                                      <button 
                                        onClick={() => fetchTrend(p.keys[0], 'page')}
                                        className="hover:text-blue-500 hover:underline transition-all text-left"
                                      >
                                        {p.keys[0].replace(/https?:\/\/[^\/]+/, '') || '/'}
                                      </button>
                                   </td>
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
                         {data?.sitemaps?.sitemap?.map((s: any, i: number) => (
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
                         {data?.alerts?.map((a, i) => (
                            <div key={i} className={`p-5 rounded-2xl border ${a.type === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-100' : 'bg-amber-500/10 border-amber-500/20 text-amber-100'}`}>
                               <div className="flex items-center gap-3 mb-2">
                                  <AlertCircle size={14} className={a.type === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                                  <p className="text-[9px] font-black uppercase tracking-widest">{a.title}</p>
                               </div>
                               <p className="text-[10px] opacity-60 font-bold leading-normal mb-1">{a.message}</p>
                            </div>
                         ))}
                         {(!data?.alerts || data.alerts.length === 0) && (
                            <div className="py-10 text-center opacity-20 italic text-[10px] uppercase font-black tracking-widest">No issues detected</div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
        )}

        {activeTab === 'speed' && (
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
                      value={data?.performance?.[perfStrategy]?.lcp?.percentile !== undefined ? (data.performance[perfStrategy].lcp.percentile / 1000).toFixed(2) : '—'} 
                      unit="s" 
                      category={data?.performance?.[perfStrategy]?.lcp?.category} 
                      desc="Đo tải nội dung chính." 
                   />
                   <MetricCard 
                      label="FID" 
                      sub="First Input Delay" 
                      value={data?.performance?.[perfStrategy]?.fid?.percentile ?? '—'} 
                      unit="ms" 
                      category={data?.performance?.[perfStrategy]?.fid?.category} 
                      desc="Độ trễ tương tác đầu." 
                   />
                   <MetricCard 
                      label="CLS" 
                      sub="Cumulative Layout Shift" 
                      value={data?.performance?.[perfStrategy]?.cls?.percentile !== undefined ? (data.performance[perfStrategy].cls.percentile / 100).toFixed(3) : '—'} 
                      unit="" 
                      category={data?.performance?.[perfStrategy]?.cls?.category} 
                      desc="Độ ổn định khi bố cục." 
                   />
                   <MetricCard 
                      label="INP" 
                      sub="Interaction to Next Paint" 
                      value={data?.performance?.[perfStrategy]?.inp?.percentile ?? '—'} 
                      unit="ms" 
                      category={data?.performance?.[perfStrategy]?.inp?.category} 
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
                         {data?.topPages?.map((p: any, i) => {
                            const indexing = data?.indexingStatus?.find(idx => idx.url === p.keys[0]);
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
                                        onClick={() => setSeoModal({ open: true, url: p.keys[0] })}
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
        )}

        {activeTab === 'keywords' && (
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

                   {/* Opportunity Radar */}
                   <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5"><Target size={120} /></div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-8 italic">Expansion Opportunity Radar</h4>
                      <div className="h-[250px] w-full mb-8">
                         <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#88888811" />
                               <XAxis type="number" dataKey="difficulty" name="Difficulty" domain={[0, 10]} hide />
                               <YAxis type="number" dataKey="volume" name="Volume" hide />
                               <ZAxis type="number" dataKey="growth" range={[50, 400]} />
                               <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }} />
                               <Scatter name="Keywords" data={aiInsights?.expansion?.expansionSuggestions || []} fill="#8b5cf6" />
                            </ScatterChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                         {aiInsights?.expansion?.expansionSuggestions?.slice(0, 5).map((s: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                               <span className="text-xs font-black tracking-tight">{s.keyword}</span>
                               <span className="text-emerald-400 font-black text-[10px]">+{s.growth}%</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             {/* Main Keyword Table - Full Width */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-12 rounded-[4rem] shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-[2000ms]"><Binary size={180} /></div>
                <div className="flex items-center justify-between mb-10">
                   <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Active Market Presence</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct from Google Search Console</p>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full">
                      <thead className="text-[9px] font-black uppercase text-slate-500/50 border-b border-slate-100 dark:border-white/5 text-left">
                         <tr>
                            <th className="pb-4">Search Term</th>
                            <th className="pb-4 text-center">Status</th>
                            <th className="pb-4 text-right">Imp</th>
                            <th className="pb-4 text-right">Clicks</th>
                            <th className="pb-4 text-right">Pos</th>
                            <th className="pb-4 text-right">Change</th>
                            <th className="pb-4 text-right">CTR</th>
                            <th className="pb-4 text-right">Trends</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                         {data?.topQueries?.map((q: any, i: number) => {
                            const queryStr = q.query || q.keys[0];
                            const delta = data.deltas?.find((d: any) => d.query === queryStr);
                            const isNew = delta?.status === 'new';
                            const posChange = delta?.delta?.position;
                            
                            return (
                               <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-black/20 transition-all cursor-default">
                                  <td className="py-5 font-black text-xs text-slate-800 dark:text-white/80 tracking-tight">
                                     <button 
                                       onClick={() => fetchTrend(queryStr)}
                                       className="hover:text-blue-500 hover:underline transition-all text-left"
                                     >
                                       {queryStr}
                                     </button>
                                     {q.related?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                           {q.related.slice(0, 3).map((rel: string, idx: number) => (
                                              <span key={idx} className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">#{rel}</span>
                                           ))}
                                        </div>
                                     )}
                                  </td>
                                  <td className="py-5 text-center">
                                     {isNew ? (
                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-md uppercase">NEW</span>
                                     ) : (
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest opacity-20">—</span>
                                     )}
                                  </td>
                                  <td className="py-5 text-right font-black text-slate-400">{(q.impressions || 0).toLocaleString()}</td>
                                  <td className="py-5 text-right font-black italic text-emerald-500">{(q.clicks || 0).toLocaleString()}</td>
                                  <td className="py-5 text-right font-black text-blue-500">{(typeof q.position === 'number' ? q.position : parseFloat(q.position || '0')).toFixed(0)}</td>
                                  <td className="py-5 text-right">
                                     {posChange !== undefined && posChange !== 0 ? (
                                        <span className={`inline-flex items-center gap-1 font-black text-[10px] ${posChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                           {posChange > 0 ? '▲' : '▼'} {Math.abs(posChange).toFixed(1)}
                                        </span>
                                     ) : (
                                        <span className="text-[10px] font-black text-slate-300 opacity-20">0.0</span>
                                     )}
                                  </td>
                                  <td className="py-5 text-right font-black text-slate-400 text-[10px]">{q.ctr || ((q.ctr * 100).toFixed(1) + '%')}</td>
                                  <td className="py-5 text-right">
                                     <a href={q.trendsUrl || `https://trends.google.com.vn/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(queryStr)}&hl=vi`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                                        <Compass size={14} />
                                     </a>
                                  </td>
                                </tr>
                            );
                         })}
                         {/* Render Lost Keywords */}
                         {data.deltas?.filter((d: any) => d.status === 'lost').map((d: any, i: number) => (
                            <tr key={`lost-${i}`} className="bg-rose-500/5 opacity-50 grayscale">
                               <td className="py-5 font-black text-xs text-slate-400 line-through tracking-tight px-2">{d.query}</td>
                               <td className="py-5 text-center">
                                  <span className="px-2 py-0.5 bg-slate-400 text-white text-[8px] font-black rounded-md uppercase">LOST</span>
                               </td>
                               <td className="py-5 text-right font-black text-slate-400 opacity-30">{(d.previous?.impressions || 0).toLocaleString()}</td>
                               <td className="py-5 text-right font-black italic text-slate-400 opacity-30">{(d.previous?.clicks || 0).toLocaleString()}</td>
                               <td className="py-5 text-right font-black text-slate-400 opacity-30">{(d.previous?.position || 0).toFixed(0)}</td>
                               <td className="py-5 text-right">
                                  <span className="text-rose-400 text-[10px] font-black uppercase">OUT</span>
                                </td>
                               <td className="py-5 text-right font-black text-slate-400 opacity-30">—</td>
                               <td className="py-5 text-right opacity-10">—</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-10 duration-1000">
             {/* AI Strategic Intelligence Panel */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] -mr-40 -mt-40 animate-pulse" />
                
                <div className="p-12 border-b border-slate-100 dark:border-white/5 bg-gradient-to-br from-blue-600/5 to-emerald-500/5 flex flex-col md:flex-row md:items-center justify-between gap-10">
                   <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-2xl relative group-hover:scale-110 transition-transform duration-500">
                         <Sparkles size={36} className="text-blue-400" />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Strategy Hub</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">High-Level Domain Intelligence & Execution Roadmap</p>
                      </div>
                   </div>
                   <button 
                     onClick={fetchAiInsights}
                     disabled={isGeneratingInsights}
                     className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/10 disabled:opacity-50"
                   >
                      <RefreshCw size={16} className={isGeneratingInsights ? 'animate-spin' : ''} />
                      {isGeneratingInsights ? 'Analyzing Domain...' : 'Generate New Strategy'}
                   </button>
                </div>

                <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                   {/* Summary Section */}
                   <div className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <Activity size={14} /> Domain Pulse Analysis
                      </h4>
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                         {aiInsights ? (
                            <div className="space-y-6">
                               <div className="p-6 bg-blue-50 dark:bg-blue-500/5 rounded-3xl border border-blue-100 dark:border-blue-500/10">
                                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed italic">{aiInsights.summary || 'Summary generated.'}</p>
                               </div>
                               <div className="grid grid-cols-1 gap-4">
                                  {aiInsights.insights?.map((ins: any, i: number) => (
                                     <div key={i} className="flex gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="text-blue-500"><Target size={16} /></div>
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{typeof ins === 'string' ? ins : ins.description}</p>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ) : (
                            <div className="py-20 text-center opacity-40">
                               <RefreshCw size={48} className="mx-auto mb-6 text-slate-300" />
                               <p className="text-[11px] font-black uppercase tracking-widest">Refresh to synchronize AI intelligence</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Strategy Roadmap Section */}
                   <div className="space-y-8 border-l border-slate-100 dark:border-white/5 pl-12">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <ListRestart size={14} /> Strategic Execution Roadmap
                      </h4>
                      {aiInsights?.expansion ? (
                         <div className="space-y-10">
                            <div>
                               <p className="text-[9px] font-black uppercase text-slate-400 mb-4 italic">Market Growth Perspective</p>
                               <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5">
                                  <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300 italic">{aiInsights.expansion.marketAnalysis}</p>
                               </div>
                            </div>
                            
                            <div>
                               <p className="text-[9px] font-black uppercase text-slate-400 mb-4 italic">Prioritized Administrative Actions</p>
                               <div className="space-y-3">
                                  {aiInsights.expansion.strategicActions?.map((act: string, i: number) => (
                                     <div key={i} className="flex items-center gap-4 p-4 bg-emerald-500/10 dark:bg-white/10 rounded-2xl border border-emerald-500/20">
                                        <div className="p-1.5 bg-emerald-500 text-white rounded-lg"><Zap size={10} /></div>
                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-relaxed">{act}</p>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      ) : (
                         <div className="py-20 text-center opacity-40">
                            <Binary size={48} className="mx-auto mb-6 text-slate-300" />
                            <p className="text-[11px] font-black uppercase tracking-widest">Growth strategic data will follow domain analysis</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <AiSceoModal isOpen={seoModal.open} url={seoModal.url} onClose={() => setSeoModal({ ...seoModal, open: false })} authState={authState} />
      <SpeedTestResultModal 
        isOpen={speedModal.open} 
        onClose={() => setSpeedModal({ ...speedModal, open: false })}
        url={speedModal.url}
        data={speedModal.data}
        loading={isTestingSpeed}
      />
      <PerformanceTrendModal 
        isOpen={trendModal.open} 
        onClose={() => setTrendModal({ ...trendModal, open: false })}
        type={trendModal.type}
        query={trendModal.query}
        data={trendModal.data}
        loading={isFetchingTrend}
        granularity={trendModal.granularity}
        onGranularityChange={(g: string) => fetchTrend(trendModal.query, trendModal.type, g)}
      />
    </div>
    </>
  );
};

const LabMetricCard = ({ label, sub, value, unit, category, desc }: any) => {
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

const SpeedTestResultModal = ({ isOpen, onClose, url, data, loading }: any) => {
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


const PerformanceTrendModal = ({ isOpen, onClose, type, query, data, loading, granularity, onGranularityChange }: any) => {
  if (!isOpen) return null;
  const isPage = type === 'page';
  const displayData = data.map((d: any) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('vi-VN', { 
      day: granularity === 'day' ? '2-digit' : undefined, 
      month: '2-digit',
      year: granularity === 'month' ? 'numeric' : undefined
    })
  }));
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
        <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/20"><TrendingUp size={24} /></div>
             <div>
                <h2 className="text-xl font-black italic tracking-tighter dark:text-white uppercase leading-none">{isPage ? 'Page Analytics Blueprint' : 'Keyword Performance Blueprint'}</h2>
                <div className="flex items-center gap-4 mt-2">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Trend Analysis: <span className="text-slate-900 dark:text-white font-mono">{query}</span></p>
                   <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                      {['day', 'week', 'month'].map(g => (
                        <button 
                          key={g}
                          onClick={() => onGranularityChange(g)}
                          className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${granularity === g ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        >
                          {g === 'day' ? 'Daily' : g === 'week' ? 'Weekly' : 'Monthly'}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-red-500 transition-all font-black text-xs uppercase">Close</button>
        </div>

        <div className="p-10">
          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-6 text-center">
                <RefreshCw size={48} className="text-blue-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synthesizing Historical Data...</p>
             </div>
          ) : data && data.length > 0 ? (
             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-emerald-500" /> Click Trajectory (90 Days)
                      </p>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={displayData}>
                            <defs>
                              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888811" vertical={false} />
                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 'bold', fill: '#64748b'}} />
                            <YAxis hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                              labelStyle={{ color: '#888' }}
                            />
                            <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorClicks)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Target size={14} className="text-blue-500" /> Average Position Rank
                      </p>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={displayData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888811" vertical={false} />
                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 'bold', fill: '#64748b'}} />
                            <YAxis reversed domain={['dataMin - 1', 'dataMax + 1']} hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                            />
                            <Line type="stepAfter" dataKey="position" stroke="#3b82f6" strokeWidth={4} dot={{ r: 2, fill: '#3b82f6' }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase text-slate-400">
                      <tr>
                        <th className="p-4">Period / Date</th>
                        <th className="p-4 text-right">Clicks</th>
                        <th className="p-4 text-right">Impressions</th>
                        <th className="p-4 text-right">Rank</th>
                        <th className="p-4 text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {displayData.slice().reverse().slice(0, 10).map((d: any, i: number) => (
                        <tr key={i} className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          <td className="p-4 uppercase">{d.displayDate}</td>
                          <td className="p-4 text-right text-emerald-500">{d.clicks.toLocaleString()}</td>
                          <td className="p-4 text-right">{d.impressions.toLocaleString()}</td>
                          <td className="p-4 text-right text-blue-500">{d.position.toFixed(1)}</td>
                          <td className="p-4 text-right">{(d.ctr * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          ) : (
             <div className="py-32 text-center">
                <Database size={48} className="mx-auto mb-6 text-slate-200" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Insufficient historical depth</p>
                <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase">Snapshots are captured daily. Check back after next sync cycle.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

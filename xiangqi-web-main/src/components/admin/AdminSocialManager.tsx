import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Share2, Send, 
  Sparkles, Calendar, Clock, History, Layout, 
  Image as ImageIcon, Video, ChevronRight, AlertCircle,
  CheckCircle2, Loader2, MoreVertical, ExternalLink,
  Zap, MessageSquare, List, Activity, Info, Trash2, RefreshCw, Eye, ThumbsUp, BarChart
} from 'lucide-react';



import { useTranslation } from 'react-i18next';

const Facebook = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Youtube = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const Instagram = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const XTwitter = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);


import { API_URL } from '../../auth/auth';


import { useAuth } from '../../auth/AuthContext';


import { useToast } from '../ui/Toast';



const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: 'blue', limit: 5000 },
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-5 h-5" />, color: 'red', limit: 1000 },
  { id: 'tiktok', name: 'TikTok', icon: <div className="font-black italic text-[10px]">TikTok</div>, color: 'slate', limit: 2200 },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: 'pink', limit: 2200 },
  { id: 'x', name: 'X.com', icon: <XTwitter className="w-5 h-5" />, color: 'slate', limit: 280 }
];

const QUICK_TEMPLATES = [
  { id: 'update', title: '📢 Bản cập nhật mới', content: 'Chào mừng các kỳ thủ! 🚀 Hệ thống vừa cập nhật những tính năng mới hấp dẫn: ... #cotuong #online #update' },
  { id: 'puzzle', title: '🧩 Thử thách cờ thế', content: 'Thế cờ hôm nay có làm khó được bạn? 🤔 Hãy thử sức ngay tại cotuong.xyz! #cotuong #puzzle #challenge' },
  { id: 'tournament', title: '🏆 Giải đấu sắp diễn ra', content: 'Chuẩn bị tinh thần cho giải đấu lớn nhất tuần này! 🏅 Đăng ký ngay để tranh tài. #cotuong #tournament' }
];

export const AdminSocialManager: React.FC = () => {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { showToast } = useToast();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [content, setContent] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [previewTab, setPreviewTab] = useState('facebook');
  const [scheduledDate, setScheduledDate] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<any>(null);
  const [isRefreshingStats, setIsRefreshingStats] = useState<string | null>(null);
  const [socialPrompt, setSocialPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSuggestingPrompt, setIsSuggestingPrompt] = useState(false);
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/admin/social/status`, {
        headers: { 'Authorization': `Bearer ${authState.token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
        setHistory(data.history || []);
        setPlatformStatus(data.platformStatus || {});
        if (data.prompt) setSocialPrompt(data.prompt);
      }
    } catch (e) {
      console.error('Failed to fetch social status', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/social/summary`, {
        headers: { 'Authorization': `Bearer ${authState.token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) setSummary(data.summary);
    } catch (e) {
      console.error('Failed to fetch social summary', e);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này trên tất cả các nền tảng?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/social/post/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authState.token}` },
        credentials: 'include'
      });
      const result = await res.json();
      if (result.ok) {
        showToast('Đã xóa bài đăng thành công', 'success');
        fetchStatus();
        fetchSummary();
      } else {
        showToast(result.error || 'Lỗi khi xóa bài đăng', 'error');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu xóa', 'error');
    }
  };

  const handleRefreshStats = async (id: string) => {
    setIsRefreshingStats(id);
    try {
      const res = await fetch(`${API_URL}/admin/social/stats/${id}`, {
        headers: { 'Authorization': `Bearer ${authState.token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
        setHistory(prev => prev.map(p => p._id === id ? { ...p, stats: data.stats } : p));
        showToast('Đã cập nhật chỉ số tương tác mới nhất', 'success');
      }
    } catch (e) {
      showToast('Lỗi khi cập nhật chỉ số', 'error');
    } finally {
      setIsRefreshingStats(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSummary();
  }, [authState.token]);

  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(previewTab)) {
      setPreviewTab(selectedPlatforms[0]);
    }
  }, [selectedPlatforms]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAiOptimize = async () => {
    if (!content) {
      showToast('Vui lòng nhập nội dung trước khi tối ưu', 'error');
      return;
    }
    setIsAiProcessing(true);
    try {
      const res = await fetch(`${API_URL}/admin/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          command: `Tối ưu nội dung sau thành bài đăng mạng xã hội hấp dẫn, thêm hashtag liên quan đến cờ tướng và emojis phù hợp: ${content}`
        })
      });
      const result = await res.json();
      if (result.ok && result.response) {
        setContent(result.response);
        showToast('Đã tối ưu nội dung bằng AI!', 'success');
      }
    } catch (e) {
      showToast('Lỗi khi gọi AI trợ giúp', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh!', 'error');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      showToast('Vui lòng chọn tệp video!', 'error');
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!content || selectedPlatforms.length === 0) {
      showToast('Vui lòng nhập nội dung và chọn ít nhất một nền tảng', 'error');
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      if (scheduledDate) formData.append('scheduledAt', scheduledDate);
      if (mediaFile) formData.append('media', mediaFile);

      const res = await fetch(`${API_URL}/admin/social/post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`
        },
        credentials: 'include',
        body: formData
      });
      const result = await res.json();
      if (result.ok) {
        showToast(scheduledDate ? 'Đã lên lịch bài đăng thành công!' : 'Đã đăng bài thành công!', 'success');
        setContent('');
        setScheduledDate('');
        removeMedia();
        fetchStatus(); // Refresh history
      } else {
        showToast(result.error || 'Lỗi khi đăng bài', 'error');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu đăng bài', 'error');
    } finally {
      setIsPosting(false);
    }
  };
  const handleExchangeToken = async (userToken: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/social/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ userToken })
      });
      const result = await res.json();
      if (result.ok) {
        showToast(`Đã cập nhật Token vĩnh viễn cho Page: ${result.pageName}`, 'success');
        fetchStatus();
      } else {
        showToast(result.error || 'Lỗi khi nâng cấp token', 'error');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu nâng cấp token', 'error');
    }
  };

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setContent(tpl.content);
    setActiveTemplate(tpl.id);
    setTimeout(() => setActiveTemplate(null), 1000);
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      const res = await fetch(`${API_URL}/admin/social/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ prompt: socialPrompt })
      });
      if ((await res.json()).ok) showToast('Đã lưu cấu hình Prompt AI!', 'success');
    } catch (e) {
      showToast('Lỗi khi lưu Prompt', 'error');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSuggestPrompt = async () => {
    setIsSuggestingPrompt(true);
    try {
      const res = await fetch(`${API_URL}/admin/social/prompt/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ currentPrompt: socialPrompt })
      });
      const data = await res.json();
      if (data.ok) {
        setSocialPrompt(data.suggestedPrompt);
        showToast('AI đã gợi ý bản Prompt mới tối ưu hơn!', 'success');
      }
    } catch (e) {
      showToast('Lỗi khi gọi AI gợi ý', 'error');
    } finally {
      setIsSuggestingPrompt(false);
    }
  };

  const currentLimit = PLATFORMS.find(p => p.id === previewTab)?.limit || 2000;
  const isOverLimit = content.length > currentLimit;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-2xl shadow-orange-500/40 group overflow-hidden">
              <Share2 size={28} className="group-hover:scale-125 transition-transform duration-500" />
            </div>
            {t('admin.social.title')}
          </h1>
          <p className="text-slate-500 dark:text-white/40 font-black text-xs mt-2 uppercase tracking-[0.3em] ml-1">AI-Powered Content Distribution</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">API Status: Healthy</span>
          </div>
        </div>
      </div>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Posts</span>
               <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500"><Send size={14} /></div>
             </div>
             <p className="text-2xl font-black italic tracking-tighter">{summary.totalPosts}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Last 30 days activity</p>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facebook</span>
               <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Facebook size={14} /></div>
             </div>
             <p className="text-2xl font-black italic tracking-tighter">{summary.platforms.facebook}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Page/Group Reach</p>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YouTube</span>
               <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><Youtube size={14} /></div>
             </div>
             <p className="text-2xl font-black italic tracking-tighter">{summary.platforms.youtube}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Shorts Uploads</p>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TikTok</span>
               <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500"><div className="font-black italic text-[8px]">TT</div></div>
             </div>
             <p className="text-2xl font-black italic tracking-tighter">{summary.platforms.tiktok}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Mobile Presence</p>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram</span>
               <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500"><Instagram size={14} /></div>
             </div>
             <p className="text-2xl font-black italic tracking-tighter">{summary.platforms.instagram}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Visual Growth</p>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">X.com</span>
               <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white"><XTwitter size={14} /></div>
             </div>
             <p className="text-2xl font-black italic tracking-tighter">{summary.platforms.x}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Real-time Pulse</p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {summary && summary.chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-700 delay-100">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
              <Activity size={16} /> Social Activity Trend (Last 14 Days)
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 'black', fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px', color: '#fff' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Posts" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
              <Share2 size={16} /> Platform Mix
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Facebook', value: summary.platforms.facebook, color: '#3b82f6' },
                      { name: 'YouTube', value: summary.platforms.youtube, color: '#ef4444' },
                      { name: 'TikTok', value: summary.platforms.tiktok, color: '#8b5cf6' },
                      { name: 'Instagram', value: summary.platforms.instagram, color: '#ec4899' },
                      { name: 'X.com', value: summary.platforms.x, color: '#0f172a' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Facebook', value: summary.platforms.facebook, color: '#3b82f6' },
                      { name: 'YouTube', value: summary.platforms.youtube, color: '#ef4444' },
                      { name: 'TikTok', value: summary.platforms.tiktok, color: '#8b5cf6' },
                      { name: 'Instagram', value: summary.platforms.instagram, color: '#ec4899' },
                      { name: 'X.com', value: summary.platforms.x, color: '#0f172a' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Composer */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Quick Templates */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
             <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 flex-shrink-0">
               <Zap size={14} />
             </div>
             {QUICK_TEMPLATES.map(tpl => (
               <button
                 key={tpl.id}
                 onClick={() => applyTemplate(tpl)}
                 className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                   activeTemplate === tpl.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-orange-500/40'
                 }`}
               >
                 {tpl.title}
               </button>
             ))}
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
            
            <h3 className="font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest text-xs relative z-10">
              <Layout size={20} className="text-orange-500" /> {t('admin.social.postTitle')}
            </h3>

            <div className="space-y-6 relative z-10">
              {/* Platforms */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">{t('admin.social.platforms')}</label>
                <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map(p => {
                      const status = platformStatus[p.id] || 'unknown';
                      const isConnected = status === 'connected';
                      const isExpired = status === 'expired';
                      const isSelected = selectedPlatforms.includes(p.id);
                      
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <button
                            onClick={() => togglePlatform(p.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all active:scale-95 relative ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/30'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-orange-500/50'
                            }`}
                          >
                            <div className={isSelected ? 'text-white' : 'text-slate-400'}>
                              {p.icon}
                            </div>
                            <span className="text-xs font-bold">{p.name}</span>
                            
                            {/* Status Indicator */}
                            <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                              isConnected ? 'bg-emerald-500' : isExpired ? 'bg-red-500 animate-pulse' : 'bg-slate-300'
                            }`} />
                          </button>
                          
                          {p.id === 'facebook' && (isExpired || !isConnected) && (
                            <button 
                              onClick={() => {
                                const token = prompt("Nhập User Access Token từ Facebook Graph Explorer:");
                                if (token) handleExchangeToken(token);
                              }}
                              className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-orange-500 hover:bg-orange-500/10 transition-colors"
                              title="Cập nhật Token vĩnh viễn"
                            >
                              <Zap size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">Nội dung bài đăng</label>
                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isOverLimit ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                      {content.length} / {currentLimit}
                    </div>
                  </div>
                  <button 
                    onClick={handleAiOptimize}
                    disabled={isAiProcessing}
                    className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 group/ai"
                  >
                    {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />}
                    {t('admin.social.aiHelp')}
                  </button>
                </div>
                <div className="relative group/ta">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={t('admin.social.placeholder')}
                    rows={10}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[2rem] px-8 py-8 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 ring-orange-500/10 transition-all resize-none shadow-inner"
                  />
                  <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover/ta:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Autosaving...</span>
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleMediaChange(e, 'image')} 
                />
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  className="hidden" 
                  accept="video/*" 
                  onChange={(e) => handleMediaChange(e, 'video')} 
                />

                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] border-2 border-dashed transition-all group/up relative overflow-hidden ${mediaType === 'image' ? 'border-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover/up:opacity-100 transition-opacity" />
                  <ImageIcon className={`w-10 h-10 ${mediaType === 'image' ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'} transition-all group-hover:scale-110`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${mediaType === 'image' ? 'text-orange-500' : 'text-slate-400 dark:text-white/20 group-hover:text-orange-500'}`}>Thêm Hình Ảnh</span>
                </button>

                <button 
                  onClick={() => videoInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] border-2 border-dashed transition-all group/up relative overflow-hidden ${mediaType === 'video' ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover/up:opacity-100 transition-opacity" />
                  <Video className={`w-10 h-10 ${mediaType === 'video' ? 'text-red-500' : 'text-slate-400 group-hover:text-red-500'} transition-all group-hover:scale-110`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${mediaType === 'video' ? 'text-red-500' : 'text-slate-400 dark:text-white/20 group-hover:text-red-500'}`}>Thêm Video</span>
                </button>
              </div>

              {mediaPreview && (
                <div className="relative group/preview rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10">
                  {mediaType === 'image' ? (
                    <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
                  ) : (
                    <video src={mediaPreview} className="w-full h-48 object-cover" controls />
                  )}
                  <button 
                    onClick={removeMedia}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className="h-px bg-slate-100 dark:bg-white/5" />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full group/sched">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover/sched:text-orange-500 transition-colors" />
                    <input 
                      type="datetime-local" 
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl pl-12 pr-6 py-4 text-xs font-bold text-slate-600 dark:text-white/60 focus:ring-4 ring-orange-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={handlePost}
                  disabled={isPosting || isOverLimit}
                  className="w-full sm:w-auto px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all disabled:opacity-50 hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white shadow-orange-500/20"
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
                  {scheduledDate ? 'Đặt lịch' : t('admin.social.postNow')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center justify-between uppercase tracking-widest text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500" /> {t('admin.social.preview')}
              </div>
              <div className="flex items-center gap-2 text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                <Info size={10} /> Live Rendering
              </div>
            </h3>

            {/* Preview Tabs */}
            <div className="flex border-b border-slate-100 dark:border-white/5 mb-6 overflow-x-auto no-scrollbar">
              {selectedPlatforms.map(pid => (
                <button
                  key={pid}
                  onClick={() => setPreviewTab(pid)}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative flex-shrink-0 ${
                    previewTab === pid ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'
                  }`}
                >
                  {pid}
                  {previewTab === pid && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full" />}
                </button>
              ))}
              {selectedPlatforms.length === 0 && <div className="py-3 text-[10px] text-slate-400 italic px-4">Chọn nền tảng để xem trước</div>}
            </div>

            {/* Preview Content */}
            <div className="bg-slate-100 dark:bg-black/60 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 min-h-[400px] shadow-inner animate-in zoom-in-95 duration-300">
              {previewTab === 'facebook' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl shadow-lg">⚙️</div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Cờ Tướng Online</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">Vừa xong · <Activity size={8} /> Public</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-white/80 whitespace-pre-wrap leading-relaxed">
                    {content || 'Nội dung bài đăng Facebook sẽ hiển thị ở đây...'}
                  </div>
                  <div className="aspect-video bg-slate-200 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-slate-300 transition-colors overflow-hidden">
                    {mediaPreview && mediaType === 'image' ? (
                      <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-slate-400 opacity-20 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Image Selected</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {previewTab === 'youtube' && (
                <div className="space-y-6">
                  <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                         <Youtube size={32} />
                       </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex-shrink-0 shadow-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white">Cờ Tướng TV</div>
                      <div className="text-xs text-slate-500 dark:text-white/40 line-clamp-3 italic">
                        {content || 'Mô tả video sẽ được tự động trích xuất từ nội dung chính...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!['facebook', 'youtube'].includes(previewTab) && selectedPlatforms.length > 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <AlertCircle size={40} className="opacity-10 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Đang tối ưu giao diện</p>
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest opacity-60">Xem trước cho {previewTab} sẽ sớm ra mắt</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Prompt Configuration */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-10 rounded-[3.5rem] shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] text-sm">AI Automation Prompt</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Master prompt for automatic puzzle and game posting</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleSuggestPrompt}
               disabled={isSuggestingPrompt}
               className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-orange-500 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-orange-500/10 transition-all active:scale-95 disabled:opacity-50"
             >
               {isSuggestingPrompt ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
               Suggest Optimization
             </button>
             <button 
               onClick={handleSavePrompt}
               disabled={isSavingPrompt}
               className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white"
             >
               {isSavingPrompt ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
               Save Prompt
             </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={socialPrompt}
              onChange={e => setSocialPrompt(e.target.value)}
              rows={12}
              className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] px-8 py-8 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-4 ring-orange-500/10 transition-all resize-none shadow-inner"
              placeholder="Enter your system prompt here..."
            />
            <div className="absolute top-4 right-8 flex gap-2">
               <div className="px-3 py-1 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-[8px] font-black text-slate-400 border border-black/5 uppercase tracking-widest">Supports Handlebars</div>
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-white/5 rounded-3xl p-6 border border-black/5">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={12} /> Available Placeholders</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { key: '{{type_vn}}', desc: 'Loại (thế cờ/ván đấu)' },
                  { key: '{{name}}', desc: 'Tên thực thể' },
                  { key: '{{description}}', desc: 'Mô tả gốc' },
                  { key: '{{extra_info}}', desc: 'Thông tin thêm' },
                  { key: '{{url}}', desc: 'Link chia sẻ' }
                ].map(p => (
                  <div key={p.key} className="space-y-1">
                    <code className="text-[10px] font-black text-orange-500">{p.key}</code>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">{p.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Full-Width Recent Posts & Management */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-10 rounded-[3.5rem] shadow-sm group animate-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-[0.3em] text-sm">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:rotate-180 transition-transform duration-1000">
                <History size={20} />
              </div>
              {t('admin.social.history')}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-14">Detailed performance metrics across all active channels</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchStatus()} 
              className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-orange-500/10 text-slate-500 dark:text-white/40 hover:text-orange-500 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-3 active:scale-95"
            >
               <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} />
               Synchronize Timeline
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          {isLoadingHistory && history.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin" />
                <History className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/20" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Aggregating cross-platform analytics...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] group/empty hover:border-orange-500/20 transition-colors">
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover/empty:scale-110 transition-transform">
                <Layout size={32} className="text-slate-200 dark:text-white/10" />
              </div>
              <p className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">No social activity logged yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
               <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-white/5 text-left">
                      <th className="pb-6 px-4">Content Snapshot</th>
                      <th className="pb-6 px-4">Timeline</th>
                      <th className="pb-6 px-4">Channels</th>
                      <th className="pb-6 px-4 text-center">Status</th>
                      <th className="pb-6 px-4 text-center">Reach / Views</th>
                      <th className="pb-6 px-4 text-center">Engagement</th>
                      <th className="pb-6 px-4 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {history.map((post: any) => {
                      const totalLikes = (post.stats?.facebook?.likes || 0) + 
                                       (post.stats?.youtube?.likes || 0) + 
                                       (post.stats?.instagram?.likes || 0) + 
                                       (post.stats?.x?.likes || 0);
                      
                      const totalComments = (post.stats?.facebook?.comments || 0) + 
                                          (post.stats?.youtube?.comments || 0) + 
                                          (post.stats?.instagram?.comments || 0) + 
                                          (post.stats?.x?.replies || 0);

                      const totalViews = (post.stats?.youtube?.views || 0) + 
                                       (post.stats?.tiktok?.views || 0) +
                                       (post.stats?.instagram?.plays || 0);

                      const totalReach = (post.stats?.facebook?.reach || 0) + 
                                       (post.stats?.instagram?.reach || 0) + 
                                       (post.stats?.x?.impressions || 0);

                      return (
                        <tr key={post._id} className="group/row hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-all duration-300">
                          <td className="py-8 px-4">
                            <div className="flex items-center gap-4 max-w-[300px]">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover/row:bg-orange-500 group-hover/row:text-white transition-all duration-500 shadow-sm overflow-hidden">
                                {post.content?.includes('http') ? <ExternalLink size={20} /> : <MessageSquare size={20} />}
                              </div>
                              <div className="flex flex-col gap-1.5 overflow-hidden">
                                <div className="text-xs font-black text-slate-800 dark:text-white line-clamp-1 leading-none group-hover/row:text-orange-500 transition-colors">{post.content?.split('\n')[0] || 'System Message'}</div>
                                <div className="text-[10px] text-slate-400 dark:text-white/30 line-clamp-1 italic group-hover/row:text-slate-600 dark:group-hover/row:text-white/60 transition-colors">{post.content?.split('\n').slice(1).join(' ') || 'No description provided'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-8 px-4">
                            <div className="flex flex-col gap-1">
                              <div className="text-[10px] font-black text-slate-600 dark:text-white/60 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">{new Date(post.postedAt || post.createdAt).toLocaleDateString()}</div>
                              <div className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase">{new Date(post.postedAt || post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </td>
                          <td className="py-8 px-4">
                             <div className="flex items-center gap-2.5">
                                {post.platforms?.map((p: string) => {
                                  const result = post.results?.[p];
                                  const isSuccess = result?.status === 'success';
                                  const isFailed = result?.status === 'failed';
                                  const error = result?.error;
                                  const link = result?.link;

                                  return (
                                    <div key={p} className="relative group/platform">
                                      <a 
                                        href={link || '#'} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95 ${
                                          !result ? 'bg-slate-100 dark:bg-white/5 text-slate-300 grayscale opacity-40' :
                                          isSuccess ? (
                                            p === 'facebook' ? 'bg-blue-500 text-white shadow-blue-500/20' :
                                            p === 'youtube' ? 'bg-red-500 text-white shadow-red-500/20' :
                                            p === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white shadow-pink-500/20' :
                                            p === 'tiktok' ? 'bg-black text-white shadow-slate-900/20' :
                                            p === 'x' ? 'bg-slate-900 text-white shadow-slate-900/20' :
                                            'bg-orange-500 text-white'
                                          ) : 'bg-red-500 text-white shadow-red-500/20'
                                        }`} 
                                        title={p.toUpperCase()}
                                        onClick={(e) => !link && e.preventDefault()}
                                      >
                                        {p === 'facebook' ? <Facebook size={16} /> : 
                                         p === 'youtube' ? <Youtube size={16} /> : 
                                         p === 'instagram' ? <Instagram size={16} /> :
                                         p === 'x' ? <XTwitter size={16} /> :
                                         p === 'tiktok' ? <div className="font-black italic text-[8px]">TT</div> :
                                         <Share2 size={16} />}
                                        
                                        {/* Mini Status Badge */}
                                        {result && (
                                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                            {isSuccess ? <CheckCircle2 size={8} className="text-white" /> : <AlertCircle size={8} className="text-white" />}
                                          </div>
                                        )}
                                      </a>

                                      {/* Error Tooltip */}
                                      {isFailed && error && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/platform:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/10 uppercase tracking-widest">
                                          {error}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                             </div>
                          </td>
                          <td className="py-8 px-4 text-center">
                             <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               post.scheduledAt && new Date(post.scheduledAt) > new Date()
                                 ? 'bg-blue-500/10 text-blue-500'
                                 : 'bg-emerald-500/10 text-emerald-500'
                             }`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${post.scheduledAt && new Date(post.scheduledAt) > new Date() ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                               {post.scheduledAt && new Date(post.scheduledAt) > new Date() ? 'Scheduled' : 'Live'}
                             </div>
                          </td>
                          <td className="py-8 px-4 text-center">
                             <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white italic">
                                   <Eye size={14} className="text-slate-400" />
                                   {totalViews > 0 ? totalViews.toLocaleString() : totalReach > 0 ? totalReach.toLocaleString() : '---'}
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{totalViews > 0 ? 'Total Views' : 'Est. Reach'}</span>
                             </div>
                          </td>
                          <td className="py-8 px-4 text-center">
                             <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-white/60">
                                    <ThumbsUp size={12} className="text-orange-500" /> {totalLikes.toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-white/60">
                                    <MessageSquare size={12} className="text-blue-500" /> {totalComments.toLocaleString()}
                                  </div>
                                </div>
                                <div className="w-16 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${Math.min((totalLikes + totalComments) * 2, 100)}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="py-8 px-4 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => handleRefreshStats(post._id)}
                                  disabled={isRefreshingStats === post._id}
                                  className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-orange-500 hover:border-orange-500/40 transition-all active:scale-90 shadow-sm"
                                  title="Force Refresh Metrics"
                                >
                                  <RefreshCw size={16} className={isRefreshingStats === post._id ? 'animate-spin' : ''} />
                                </button>
                                <button 
                                  onClick={() => handleDeletePost(post._id)}
                                  className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 hover:border-red-500/40 transition-all active:scale-90 shadow-sm"
                                  title="Archive Post"
                                >
                                  <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSocialManager;

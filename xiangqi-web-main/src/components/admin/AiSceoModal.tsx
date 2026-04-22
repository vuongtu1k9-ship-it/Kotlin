import React, { useState, useEffect } from 'react';
import { Sparkles, X, Info, AlertCircle } from 'lucide-react';
import { API_URL } from '../../auth/auth';

interface SEOData {
  title: string;
  description: string;
  tags: string[];
  reasoning: string;
}

interface AiSceoModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  authState: any;
}

export const AiSceoModal: React.FC<AiSceoModalProps> = ({ url, isOpen, onClose, authState }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SEOData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/analytics/ai/optimize?url=${encodeURIComponent(url)}`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      const d = await res.json();
      if (d.ok) setSuggestions(d.data);
      else setError(d.error);
    } catch (e) {
      setError('Không thể kết nối AI SEO Optimizer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
        
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
              <Sparkles />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tối Ưu SEO AI</h3>
              <p className="text-xs text-slate-500 dark:text-white/40 font-bold truncate max-w-xs">{url}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 custom-scrollbar">
          {loading ? (
            <div className="text-center py-20 animate-pulse space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full mx-auto flex items-center justify-center">
                <Brain className="w-8 h-8 text-indigo-500 animate-bounce" />
              </div>
              <p className="text-slate-500 font-bold">AI đang phân tích dữ liệu Google...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-500/10 text-red-500 rounded-3xl flex flex-col items-center gap-4 border border-red-500/20">
              <AlertCircle className="w-12 h-12" />
              <p className="font-black">LỖI: {error}</p>
              <button onClick={fetchSuggestions} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold">Thử lại</button>
            </div>
          ) : (
            <>
              {/* Suggestion Card */}
              <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[32px] border border-black/5 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Tiêu đề đề xuất (Title)</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{suggestions?.title}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Mô tả Meta (Description)</p>
                  <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed italic">"{suggestions?.description}"</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions?.tags.map(t => (
                    <span key={t} className="px-3 py-1 bg-white dark:bg-black/20 rounded-lg text-[10px] font-bold text-slate-500">#{t}</span>
                  ))}
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="flex gap-4 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <Info className="text-indigo-500 shrink-0" />
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">
                  <span className="font-black uppercase tracking-wider block mb-1">Tại sao tối ưu này?</span>
                  {suggestions?.reasoning}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-300 transition-all"
          >
            Bỏ qua
          </button>
          <button 
            disabled={loading || !!error}
            className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            Áp Dụng Tối Ưu
          </button>
        </div>
      </div>
    </div>
  );
};

const Brain = Sparkles; // Using Sparkles as Brain for consistent iconography

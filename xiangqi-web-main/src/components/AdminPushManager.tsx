import React, { useState } from 'react';
import { API_URL } from '../auth/auth';
import { useAuth } from '../auth/AuthContext';
import { useToast } from './ui/Toast';

const TEMPLATES = [
  {
    id: 'tournament',
    title: '🏆 Giải đấu sắp bắt đầu!',
    body: 'Mời bạn tham gia giải đấu mới tại Cờ tướng Online. Đăng ký ngay để nhận quà!',
    url: '/tournaments'
  },
  {
    id: 'maintenance',
    title: '🛠️ Bảo trì hệ thống',
    body: 'Hệ thống sẽ bảo trì trong 30 phút tới. Vui lòng hoàn thành ván đấu của bạn.',
    url: '/'
  },
  {
    id: 'update',
    title: '🆕 Tính năng mới!',
    body: 'Cờ tướng Online vừa cập nhật giao diện và thêm các bài học mới. Khám phá ngay!',
    url: '/practice'
  },
  {
    id: 'gift',
    title: '🎁 Quà tặng bất ngờ!',
    body: 'Chúc mừng! Bạn nhận được một món quà từ hệ thống. Kiểm tra túi đồ ngay!',
    url: '/profile'
  }
];

export const AdminPushManager: React.FC = () => {
  const { state: authState } = useAuth();
  const { showToast } = useToast();
  const [targetUid, setTargetUid] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTitle(t.title);
    setBody(t.body);
    setUrl(t.url);
  };

  const handleSend = async (mode: 'personal' | 'broadcast') => {
    if (!title || !body) {
      showToast('Vui lòng nhập tiêu đề và nội dung', 'error');
      return;
    }
    if (mode === 'personal' && !targetUid) {
      showToast('Vui lòng nhập UID người nhận', 'error');
      return;
    }

    setSending(true);
    try {
      const endpoint = mode === 'personal' ? '/admin/push/send' : '/admin/push/broadcast';
      const payload = mode === 'personal' ? { targetUid, title, body, url } : { title, body, url };
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result?.ok) {
        showToast(mode === 'personal' ? 'Đã gửi thông báo cá nhân!' : `Đã gửi thông báo tới ${result.sentCount || 'tất cả'} người dùng!`, 'success');
        if (mode === 'personal') setTargetUid('');
      } else {
        showToast('Gửi thất bại: ' + (result.error || 'Server error'), 'error');
      }
    } catch (e) {
      showToast('Lỗi hệ thống khi gửi', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Templates Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-slate-600 dark:text-white/40 uppercase tracking-widest">Mẫu thông báo</h3>
            <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest">Chọn mẫu để soạn thảo nhanh</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="group p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white/[0.02] hover:bg-slate-100 dark:bg-white/5 hover:border-black/10 dark:border-white/10 text-left transition-all"
              >
                <div className="text-sm font-bold text-slate-800 dark:text-white/80 group-hover:text-slate-900 dark:text-white mb-1">{t.title}</div>
                <div className="text-[10px] text-slate-400 dark:text-white/30 line-clamp-1">{t.body}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-4">Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo..."
                  className="w-full bg-white/90 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-4">Đường dẫn (URL)</label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="/tournaments"
                  className="w-full bg-white/90 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-4">Nội dung</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Nhập nội dung thông báo chi tiết..."
                rows={4}
                className="w-full bg-white/90 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-3xl px-6 py-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              />
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/5 mx-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-4">Gửi cá nhân (UID)</label>
                  <input
                    type="text"
                    value={targetUid}
                    onChange={e => setTargetUid(e.target.value)}
                    placeholder="UID người nhận..."
                    className="w-full bg-slate-200 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl px-6 py-3 text-xs text-slate-800 dark:text-white/70 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleSend('personal')}
                  disabled={sending}
                  className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {sending ? 'Đang gửi...' : '🚀 Gửi cá nhân'}
                </button>
              </div>

              <div className="space-y-4 flex flex-col justify-end">
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-2">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Cảnh báo Broadcast</div>
                  <div className="text-[9px] text-blue-400/60 leading-tight">Hành động này sẽ gửi thông báo tới TẤT CẢ người dùng đã đăng ký. Chỉ sử dụng cho tin tức quan trọng.</div>
                </div>
                <button
                  onClick={() => handleSend('broadcast')}
                  disabled={sending}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                >
                  {sending ? 'Đang gửi...' : '📢 Gửi Toàn Hệ Thống'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-6 rounded-3xl bg-xq-gold/5 border border-xq-gold/10 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/90 dark:bg-black/40 flex items-center justify-center text-lg">🔔</div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-xq-gold uppercase tracking-widest">Bản xem trước</div>
                <div className="text-[8px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-widest italic">Mockup trình duyệt</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 dark:text-white">{title || 'Tiêu đề thông báo'}</div>
              <div className="text-xs text-slate-600 dark:text-white/60 line-clamp-3">{body || 'Nội dung thông báo sẽ xuất hiện ở đây...'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

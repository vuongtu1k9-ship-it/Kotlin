import { useState, useEffect } from 'react';
import { subscribeToPush } from '../net/push';
import { useAuth } from '../auth/AuthContext';
import { useToast } from './ui/Toast';

export function PushNotificationBanner() {
  const { state: authState } = useAuth();
  const [show, setShow] = useState(false);
  const { showToast, error: toastError } = useToast();

  useEffect(() => {
    // Only check if supported, permission is 'default', and user is NOT a guest
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (!authState.user || authState.user.provider === 'guest') return;

    if (Notification.permission === 'default') {
      // Respect dismissal for 7 days
      const dismissed = localStorage.getItem('push-banner-dismissed-until');
      const now = Date.now();
      if (!dismissed || parseInt(dismissed, 10) < now) {
        // Show after a short delay to not overwhelm the user
        const timeout = setTimeout(() => setShow(true), 5000);
        return () => clearTimeout(timeout);
      }
    }
  }, [authState.user]);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const res = await subscribeToPush();
        if (res?.ok) {
          showToast('Đã kích hoạt thông báo thành công!', 'success');
        }
      }
      setShow(false);
    } catch (err) {
      console.error('Push subscription failed', err);
      toastError('Không thể kích hoạt thông báo. Vui lòng thử lại sau.');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Remember dismissal for 7 days
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('push-banner-dismissed-until', String(sevenDaysFromNow));
  };

  if (!show) return null;

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden p-0.5 rounded-[24px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 shadow-xl shadow-blue-500/20">
        <div className="bg-[#0f172a]/90 backdrop-blur-xl rounded-[23px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">

          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
              <span className="text-3xl animate-bounce">🔔</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">Kích hoạt thông báo</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-relaxed max-w-md">
                Đừng bỏ lỡ lời mời thi đấu hoặc tin nhắn từ đối thủ khi bạn đang ở tab khác. Chúng tôi sẽ gửi thông báo trực tiếp đến trình duyệt của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleAllow}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 active:scale-95"
            >
              Cho phép ngay
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Để sau
            </button>
          </div>

          {/* Decorative background element */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

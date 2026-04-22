import React from 'react';

interface Props {
  settings: any;
  onSave: (settings: any) => void;
  saving: boolean;
  setLocalSettings: (updater: (prev: any) => any) => void;
}

const AdminSettingsSection: React.FC<Props> = ({ settings, onSave, saving, setLocalSettings }) => {
  if (!settings) return null;

  const labelStyle = "text-sm font-semibold text-slate-700 dark:text-white/80";
  const inputStyle = "bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all w-full";

  const renderBoolean = (key: string, label: string, color: 'blue' | 'orange' = 'blue') => (
    <div key={key} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
      <div>
        <div className={labelStyle}>{label}</div>
        <div className="text-[10px] text-slate-500 dark:text-white/40">{key}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocalSettings((prev: any) => ({ ...prev, [key]: !prev[key] }))}
          className={`w-14 h-7 rounded-full transition-all relative ${settings[key] ? (color === 'blue' ? 'bg-blue-600' : 'bg-orange-500') : 'bg-slate-300 dark:bg-white/10'}`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings[key] ? 'left-8' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );

  const renderString = (key: string, label: string) => (
    <div key={key} className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className={labelStyle}>{label}</label>
      </div>
      <input
        type="text"
        value={settings[key] || ''}
        onChange={e => setLocalSettings((prev: any) => ({ ...prev, [key]: e.target.value }))}
        className={inputStyle}
      />
    </div>
  );

  const renderTextArea = (key: string, label: string) => (
    <div key={key} className="flex flex-col gap-2 col-span-full">
      <div className="flex justify-between items-center">
        <label className={labelStyle}>{label}</label>
      </div>
      <textarea
        value={settings[key] || ''}
        onChange={e => setLocalSettings((prev: any) => ({ ...prev, [key]: e.target.value }))}
        rows={4}
        className={inputStyle + " font-mono text-[10px]"}
      />
    </div>
  );

  const renderNumber = (key: string, label: string) => (
    <div key={key} className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className={labelStyle}>{label}</label>
      </div>
      <input
        type="number"
        value={settings[key] || 0}
        onChange={e => setLocalSettings((prev: any) => ({ ...prev, [key]: Number(e.target.value) }))}
        className={inputStyle}
      />
    </div>
  );

  const renderRanks = () => {
    const ranks = settings['elo.ranks'] || [];
    const updateRank = (index: number, field: string, value: any) => {
      const newRanks = [...ranks];
      newRanks[index] = { ...newRanks[index], [field]: field === 'max' ? Number(value) : value };
      setLocalSettings((prev: any) => ({ ...prev, 'elo.ranks': newRanks }));
    };
    const addRank = () => {
      const newRanks = [...ranks, { max: 1000, title: 'New Rank', icon: '👤' }];
      setLocalSettings((prev: any) => ({ ...prev, 'elo.ranks': newRanks }));
    };
    const removeRank = (index: number) => {
      const newRanks = ranks.filter((_: any, i: number) => i !== index);
      setLocalSettings((prev: any) => ({ ...prev, 'elo.ranks': newRanks }));
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Elo Ranks Management</h4>
          <button onClick={addRank} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <span>+ thêm hạng</span>
          </button>
        </div>
        
        <div className="grid grid-cols-[80px_1fr_60px_40px] gap-2 text-xs font-bold text-slate-600 dark:text-white/50 px-2">
          <div>Max Elo</div>
          <div>Danh hiệu</div>
          <div className="text-center">Icon</div>
          <div></div>
        </div>
        
        <div className="space-y-2">
          {ranks.map((r: any, i: number) => (
            <div key={i} className="grid grid-cols-[80px_1fr_60px_40px] gap-2 items-center">
              <input type="number" value={r.max} onChange={e => updateRank(i, 'max', e.target.value)} className={inputStyle} />
              <input type="text" value={r.title} onChange={e => updateRank(i, 'title', e.target.value)} className={inputStyle} />
              <input type="text" value={r.icon} onChange={e => updateRank(i, 'icon', e.target.value)} className={inputStyle + " text-center px-1"} />
              <button title="Xóa" onClick={() => removeRank(i)} className="text-red-400 hover:bg-red-500/20 h-full rounded-lg flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end sticky top-0 z-10 py-2">
        <button
          onClick={() => onSave(settings)}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : '💾'}
          {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-slate-100 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">🌐 Site & Access</h3>
          {renderBoolean('site.maintenanceMode', 'Chế độ Bảo Trì', 'orange')}
          {renderBoolean('site.registrationOpen', 'Mở Đăng Ký', 'orange')}
          {renderBoolean('site.guestAllowed', 'Cho Phép Khách', 'orange')}
          {renderString('site.announcementText', 'Thông Báo Hệ Thống')}
          {renderString('site.maintenanceMessage', 'Nội Dung Bảo Trì')}
          {renderTextArea('site.keywords', 'Từ Khoá SEO (Meta Keywords)')}
        </div>

        <div className="space-y-6 bg-slate-100 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">♟️ Gameplay & AI</h3>
          {renderBoolean('game.spectatorAllowed', 'Cho Phép Khán Giả', 'blue')}
          {renderBoolean('chat.enabled', 'Bật Chat', 'blue')}
          {renderBoolean('chat.globalNotificationsDefault', 'Thông báo phòng Chung (Mặc định)', 'blue')}
          {renderBoolean('ai.enabled', 'Hệ Thống AI', 'blue')}
          {renderBoolean('ai.autoSwitch', 'Tự Động Chuyển Model (AI Auto-Switch)', 'blue')}
          {renderBoolean('ai.pikafishCacheEnabled', 'Bật Cached Pikafish', 'blue')}
          {renderString('ai.defaultModel', 'Mô Hình AI Mặc Định (LLM ID)')}
          {renderNumber('ai.defaultLevel', 'Cấp Độ AI Mặc Định (1-10)')}
          {renderNumber('game.maxActiveRooms', 'Giới Hạn Số Phòng')}
          {renderNumber('bot.maxConcurrent', 'Số Bot Chạy Đồng Thời Tối Đa')}
        </div>


        <div className="col-span-full space-y-6 bg-slate-100 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">📊 Analytics & SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderString('google.ga4PropertyId', 'GA4 Property ID')}
            {renderString('google.searchConsoleSiteUrl', 'Search Console Site URL')}
            {renderString('lobby.videoHighlightId', 'YouTube Lobby Video ID')}
          </div>
        </div>

        <div className="col-span-full space-y-6 bg-slate-100 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">📱 Social Media IDs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Facebook</h4>
               {renderString('facebook.pageId', 'Facebook Page ID')}
               {renderString('facebook.groupId', 'Facebook Group ID')}
            </div>
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-pink-500">Instagram</h4>
               {renderString('instagram.userId', 'Instagram User ID')}
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> API Keys, Secrets, and Refresh Tokens are managed via server-side environment variables (.env) for security and cannot be changed from this interface.
            </p>
          </div>
        </div>

        <div className="col-span-full space-y-6 bg-slate-100 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/10">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">🏆 Cấp Bậc (Elo Ranks)</h3>
          {renderRanks()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsSection;

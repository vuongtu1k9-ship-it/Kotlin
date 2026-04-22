import React from 'react';

interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'users', label: '👤 Người Dùng' },
    { id: 'matches', label: '🎮 Phòng Chơi' },
    { id: 'puzzles', label: '🧩 Thế Cờ' },
    { id: 'tournaments', label: '🏆 Giải Đấu' },
    { id: 'bots', label: '🤖 Quản Lý Bot' },
    { id: 'comments', label: '💬 Bình Luận' },
    { id: 'practice', label: '📚 Bài Học' },
    { id: 'shop', label: '🛒 Cửa Hàng' },
    { id: 'settings', label: '⚙️ Cấu Hình' },
    { id: 'analytics', label: '📊 Phân Tích (Google)' },
    { id: 'push', label: '📢 Thông Báo Push' },
    { id: 'cache', label: '⚡ Cache (Redis)' },
    { id: 'ai', label: '✨ SEO & Puzzle Optimizer' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-white/5 p-2 rounded-2xl w-full">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border border-transparent ${
            activeTab === tab.id 
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border-slate-200 dark:border-white/10' 
              : 'text-slate-600 dark:text-white/40 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

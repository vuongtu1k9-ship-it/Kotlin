import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Gamepad2, Puzzle, Trophy, Bot, MessageSquare, 
  BookOpen, ShoppingCart, Settings, BarChart3, Bell, 
  Database, Brain, LayoutDashboard, Server, Share2,
  ChevronRight, LogOut, ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user }) => {
  const { t } = useTranslation();

  const groups = [
    {
      title: 'Core',
      items: [
        { id: 'dashboard', label: t('admin.sidebar.dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, color: 'blue' },
        { id: 'analytics', label: t('admin.sidebar.analytics'), icon: <BarChart3 className="w-5 h-5" />, color: 'emerald' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'users', label: t('admin.sidebar.users'), icon: <Users className="w-5 h-5" /> },
        { id: 'matches', label: t('admin.sidebar.matches'), icon: <Gamepad2 className="w-5 h-5" /> },
        { id: 'puzzles', label: t('admin.sidebar.puzzles'), icon: <Puzzle className="w-5 h-5" /> },
        { id: 'tournaments', label: t('admin.sidebar.tournaments'), icon: <Trophy className="w-5 h-5" /> },
        { id: 'comments', label: t('admin.sidebar.comments'), icon: <MessageSquare className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Marketing & AI',
      items: [
        { id: 'social', label: t('admin.sidebar.social'), icon: <Share2 className="w-5 h-5" />, color: 'orange' },
        { id: 'ai', label: t('admin.sidebar.ai'), icon: <Brain className="w-5 h-5" />, color: 'purple' },
        { id: 'push', label: t('admin.sidebar.push'), icon: <Bell className="w-5 h-5" /> },
        { id: 'shop', label: t('admin.sidebar.shop'), icon: <ShoppingCart className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Technical',
      items: [
        { id: 'bots', label: t('admin.sidebar.bots'), icon: <Bot className="w-5 h-5" /> },
        { id: 'practice', label: t('admin.sidebar.practice'), icon: <BookOpen className="w-5 h-5" /> },
        { id: 'cache', label: t('admin.sidebar.cache'), icon: <Database className="w-5 h-5" /> },
        { id: 'server', label: t('admin.sidebar.server'), icon: <Server className="w-5 h-5" /> },
        { id: 'settings', label: t('admin.sidebar.settings'), icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  return (
    <div className="w-80 flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 transition-all duration-300 relative z-50">
      {/* Brand Header */}
      <div className="p-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-red-500 to-orange-600 shadow-xl shadow-red-500/30 flex items-center justify-center text-2xl relative group">
          <div className="absolute inset-0 rounded-[1.25rem] bg-white/20 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="relative z-10">⚔️</span>
        </div>
        <div className="flex flex-col">
          <h1 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('admin.title')}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 dark:text-white/30 uppercase font-black tracking-widest">v2.0 Command Center</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 custom-scrollbar">
        {groups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="px-4 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.25em]">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const colorClasses: Record<string, string> = {
                  blue: 'text-blue-500 bg-blue-500/5',
                  emerald: 'text-emerald-500 bg-emerald-500/5',
                  purple: 'text-purple-500 bg-purple-500/5',
                  orange: 'text-orange-500 bg-orange-500/5'
                };
                const activeStyle = colorClasses[item.color || 'blue'] || colorClasses.blue;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                      isActive 
                        ? `${activeStyle} font-black` 
                        : 'text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 w-1 h-6 bg-current rounded-r-full shadow-[0_0_12px_rgba(0,0,0,0.1)]" />
                    )}
                    <div className={`${isActive ? 'scale-110' : 'opacity-60 group-hover:opacity-100 group-hover:scale-110'} transition-all duration-300`}>
                      {item.icon}
                    </div>
                    <span className="text-xs uppercase tracking-widest font-bold">{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto w-3 h-3 opacity-50" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User & System Status */}
      <div className="p-6 m-6 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black shadow-sm flex items-center justify-center font-black text-slate-900 dark:text-white border border-black/5 dark:border-white/5 relative group">
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-50 dark:border-slate-900 rounded-full flex items-center justify-center">
              <ShieldCheck size={8} className="text-white" />
            </div>
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</p>
            <p className="text-[9px] text-slate-400 dark:text-white/20 uppercase font-black tracking-widest truncate">System Administrator</p>
          </div>
        </div>
        
        <div className="h-px bg-black/5 dark:bg-white/5 w-full" />
        
        <button className="w-full flex items-center justify-between px-2 text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest hover:text-red-500 transition-colors group">
          <span className="flex items-center gap-2"><LogOut size={12} /> Sign Out</span>
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

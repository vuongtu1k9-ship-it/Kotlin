import React from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationSettings {
  roomInvitations: boolean;
}

interface NotificationSettingsProps {
  pushStatus: 'default' | 'granted' | 'denied';
  onTogglePush: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  pushStatus, 
  onTogglePush,
  settings,
  onUpdateSettings
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-8 shadow-2xl space-y-8 relative overflow-hidden group">
      <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-3xl">🔔</div>
      
      <div className="space-y-6 relative z-10">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('settings.notifications')}</h3>
          <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed font-medium">{t('settings.notificationsDesc', { defaultValue: 'Receive alerts about matches and activity.' })}</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div className="space-y-1">
             <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('settings.roomNotifications', { defaultValue: 'New Board Notifications' })}</div>
             <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase">{t('settings.roomNotificationsDesc', { defaultValue: 'Notify when boards are opened' })}</p>
          </div>
          <button 
            onClick={() => onUpdateSettings({ ...settings, roomInvitations: !settings.roomInvitations })}
            className={`w-12 h-6 rounded-full transition-all relative ${settings.roomInvitations ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.roomInvitations ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="relative z-10 pt-4 border-t border-black/5 dark:border-white/5">
        <div className="mb-4 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">{t('settings.pushPermissions', { defaultValue: 'Browser Push Permissions' })}</div>
        {pushStatus === 'granted' ? (
          <div className="flex items-center gap-3 text-green-400 font-black text-[10px] uppercase tracking-widest bg-green-400/10 px-5 py-4 rounded-2xl border border-green-400/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> {t('settings.notificationsEnabled')}
          </div>
        ) : (
          <button onClick={onTogglePush} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20">{t('settings.enableNotifications', { defaultValue: 'Enable Notifications Now' })}</button>
        )}
      </div>
    </div>
  );
};

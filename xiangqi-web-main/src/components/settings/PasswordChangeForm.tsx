import React from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordChangeFormProps {
  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  onUpdate: (e: React.FormEvent) => void;
  updatingPassword: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  oldPassword, setOldPassword, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, onUpdate, updatingPassword
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-[3rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-10 shadow-2xl space-y-8 relative overflow-hidden">
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-red-500/10 rounded-full blur-[100px]" />
      <div className="relative z-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-8"><span className="text-red-500">🛡️</span> {t('settings.security')}</h3>
        <form onSubmit={onUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] ml-1">{t('settings.oldPassword')}</label>
            <input 
              type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} 
              className="w-full h-14 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white transition-all focus:outline-none focus:border-red-500/50"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] ml-1">{t('settings.newPassword')}</label>
            <input 
              type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} 
              className="w-full h-14 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white transition-all focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] ml-1">{t('settings.confirmPassword')}</label>
            <input 
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} 
              className="w-full h-14 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white transition-all focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="md:col-span-2 pt-4">
            <button disabled={updatingPassword || !newPassword} className="w-full md:w-auto px-12 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-600/20">{t('settings.changePassword')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

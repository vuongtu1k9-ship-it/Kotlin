import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProfileEditFormProps {
  user: any;
  name: string;
  setName: (v: string) => void;
  onUpdate: (e: React.FormEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updatingProfile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  user, name, setName, onUpdate, onFileChange, updatingProfile, fileInputRef
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-[3rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-10 shadow-2xl space-y-10 relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
        <div className="flex flex-col items-center gap-4 group/avatar">
          <div className="relative">
            {user?.picture ? (
              <img src={user.picture} className="h-32 w-32 rounded-[42px] border-4 border-black/5 dark:border-white/5 object-cover relative z-10 shadow-2xl" alt="avatar" />
            ) : (
              <div className="h-32 w-32 rounded-[42px] bg-slate-100 dark:bg-white/5 border-4 border-black/5 dark:border-white/5 flex items-center justify-center text-5xl relative z-10">👤</div>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-90 z-20 border-4 border-[#0B0F19]">📸</button>
          </div>
          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
        </div>

        <form onSubmit={onUpdate} className="flex-1 w-full space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] ml-1">{t('settings.displayName')}</label>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-14 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all"
              placeholder={t('settings.displayNamePlaceholder', { defaultValue: 'Enter name...' })}
            />
          </div>
          <button disabled={updatingProfile || name === user?.name} className="px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-slate-900 dark:text-white disabled:opacity-20 transition-all shadow-xl shadow-white/5">{t('common.save')}</button>
        </form>
      </div>
    </div>
  );
};

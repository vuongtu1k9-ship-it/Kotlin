import React from 'react';
import { useTranslation } from 'react-i18next';

interface SetupInfoFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  onSave: () => void;
  isGuest: boolean;
  showValidationErrors: boolean;
  onLoginRequired?: () => void;
}

const selectClass = "w-full h-10 px-3 text-[11px] font-bold border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer";

export const SetupInfoForm: React.FC<SetupInfoFormProps> = ({
  name, setName, description, setDescription, level, setLevel, 
  onSave, isGuest, showValidationErrors, onLoginRequired
}) => {
  const { t } = useTranslation();
  const handleSave = () => {
    if (isGuest) {
      onLoginRequired?.();
      return;
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      {isGuest && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <span className="text-lg shrink-0">🔐</span>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide leading-none mb-0.5">{t('setup.form.guestTitle')}</p>
            <p className="text-[10px] text-amber-700/70 dark:text-amber-300/60 leading-snug">{t('setup.form.guestDesc')}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">{t('setup.form.nameLabel')}</span>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className={selectClass + (showValidationErrors && !name.trim() ? " border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "")} 
          placeholder={t('setup.form.namePlaceholder')} 
          disabled={isGuest}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">{t('setup.form.levelLabel')}</span>
        <select value={level} onChange={e => setLevel(e.target.value)} className={selectClass} disabled={isGuest}>
          <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('setup.form.levelOption')}</option>
          {[1,2,3,4,5,6].map(i => (
            <option key={i} value={String(i)} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              {t('setup.form.levelValue', { level: i })}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">{t('setup.form.descLabel')}</span>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className={selectClass + " h-20 py-3 resize-none" + (showValidationErrors && !description.trim() ? " border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "")} 
          placeholder={t('setup.form.descPlaceholder')} 
          disabled={isGuest}
        />
      </div>
      <button
        onClick={handleSave}
        className={`h-12 w-full rounded-2xl font-black text-[11px] uppercase shadow-xl transition-all active:scale-95 ${
          isGuest
            ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30 cursor-not-allowed'
            : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500'
        }`}
      >
        {isGuest ? t('setup.form.loginSaveAction') : t('setup.form.saveAction')}
      </button>
    </div>
  );
};

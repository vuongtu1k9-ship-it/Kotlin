import React from 'react';
import { useTranslation } from 'react-i18next';

interface SetupHistoryProps {
  saved: any[];
  onLoad: (id: string) => void;
  onView: (name: string, id: string) => void;
  onCreateRoom: (id: string, name: string) => void;
}

export const SetupHistory: React.FC<SetupHistoryProps> = ({ saved, onLoad, onView, onCreateRoom }) => {
  const { t, i18n } = useTranslation();
  if (saved.length === 0) return null;

  return (
    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
      {saved.map((s: any) => (
        <div key={s.id} className="p-3 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl hover:border-black/20 dark:border-white/20 transition-all group/s">
          <div className="text-[11px] font-bold text-slate-800 dark:text-white/80 truncate mb-1">{s.name}</div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-400 dark:text-white/20 font-black uppercase">{new Date(s.createdAt).toLocaleDateString(i18n.language)}</span>
            <div className="flex gap-2">
              <button onClick={() => onLoad(s.id)} className="text-[10px] font-black text-blue-400 uppercase hover:underline">{t('setup.history.loadAction')}</button>
              <button onClick={() => onView(s.name, s.id)} className="text-[10px] font-black text-xq-gold uppercase hover:underline">{t('setup.history.viewAction')}</button>
              <button onClick={() => onCreateRoom(s.id, s.name)} className="text-[10px] font-black text-purple-400 uppercase hover:underline">{t('common.challenge')}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

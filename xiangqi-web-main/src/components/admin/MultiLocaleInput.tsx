import React, { useState } from 'react';

interface MultiLocaleInputProps {
  label: string;
  value: Record<string, string> | string | undefined;
  onChange: (newValue: Record<string, string>) => void;
  type?: 'text' | 'textarea' | 'richtext';
  placeholder?: string;
  className?: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export const MultiLocaleInput: React.FC<MultiLocaleInputProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  placeholder = '',
  className = ''
}) => {
  const [activeLang, setActiveLang] = useState('en');

  // Ensure value is an object
  const normalizedValue: Record<string, string> = typeof value === 'object' && value !== null
    ? { ...value }
    : { en: typeof value === 'string' ? value : '', vi: typeof value === 'string' ? value : '' };

  const handleValueChange = (lng: string, val: string) => {
    const newValue = { ...normalizedValue, [lng]: val };
    onChange(newValue);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
          {label}
        </label>
        <div className="flex gap-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveLang(lang.code)}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1 ${
                activeLang === lang.code 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white/60'
              }`}
            >
              <span>{lang.flag}</span>
              <span className="uppercase">{lang.code}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative group">
        {type === 'textarea' ? (
          <textarea
            value={normalizedValue[activeLang] || ''}
            onChange={e => handleValueChange(activeLang, e.target.value)}
            placeholder={placeholder || `Enter ${label} in ${activeLang.toUpperCase()}...`}
            rows={4}
            className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
          />
        ) : (
          <input
            type="text"
            value={normalizedValue[activeLang] || ''}
            onChange={e => handleValueChange(activeLang, e.target.value)}
            placeholder={placeholder || `Enter ${label} in ${activeLang.toUpperCase()}...`}
            className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        )}
        
        {/* Helper text showing what's being edited */}
        <div className="absolute top-2 right-2 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity">
          <span className="text-[10px] font-black uppercase text-blue-500/50 bg-blue-500/5 px-2 py-0.5 rounded">
            Editing {activeLang}
          </span>
        </div>
      </div>
    </div>
  );
};

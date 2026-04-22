import React from 'react';
import { useTranslation } from 'react-i18next';

interface FenImporterProps {
  fenValue: string;
  onFenChange: (value: string) => void;
  onImport: () => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Shared FEN Import UI component.
 * Used in both AI Page and Board Setup Page to provide a unified experience.
 */
export const FenImporter: React.FC<FenImporterProps> = ({
  fenValue,
  onFenChange,
  onImport,
  label,
  placeholder,
  className = ''
}) => {
  const { t } = useTranslation();
  const actualLabel = label !== undefined ? label : t('setup.fen.label');
  const actualPlaceholder = placeholder || t('setup.fen.placeholder');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {actualLabel && (
        <label className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest px-1">
          {actualLabel}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={fenValue}
          onChange={(e) => onFenChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onImport()}
          placeholder={actualPlaceholder}
          className="flex-1 min-w-0 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/10"
        />
        <button
          onClick={onImport}
          // Using a consistent cobalt/blue-600 for action buttons
          className="aspect-square w-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10 transition-all active:scale-95 group shrink-0"
          title={t('setup.fen.apply')}
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

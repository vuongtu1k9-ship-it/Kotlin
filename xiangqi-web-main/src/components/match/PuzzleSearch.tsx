import React from 'react';
import { useTranslation } from 'react-i18next';

interface PuzzleSearchProps {
  selectedSetupId: string | null;
  selectedSetupName: string | null;
  setSelectedSetupId: (id: string | null) => void;
  setSelectedSetupName: (name: string | null) => void;
  puzzleSearchQuery: string;
  setPuzzleSearchQuery: (q: string) => void;
  isSearchingPuzzles: boolean;
  puzzleSearchResults: any[];
  likedPuzzles: any[];
  isFixedSetup?: boolean;
}

export const PuzzleSearch: React.FC<PuzzleSearchProps> = ({
  selectedSetupId, selectedSetupName, setSelectedSetupId, setSelectedSetupName,
  puzzleSearchQuery, setPuzzleSearchQuery, isSearchingPuzzles, puzzleSearchResults, 
  likedPuzzles, isFixedSetup = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 px-1">
        {t('match.config.puzzleSetup')} {selectedSetupId && ` - ${t('match.config.selected')}`}
      </label>
      
      {selectedSetupId ? (
         <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-purple-400 uppercase tracking-tight line-clamp-1">{selectedSetupName || t('match.config.selectedPuzzle')}</span>
               <span className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase">ID: {selectedSetupId}</span>
            </div>
            {!isFixedSetup && (
               <button 
                 type="button"
                 onClick={() => {
                   setSelectedSetupId(null);
                   setSelectedSetupName(null);
                 }}
                 className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase underline decoration-2 cursor-pointer"
               >
                 {t('match.config.change')}
               </button>
            )}
         </div>
      ) : (
        <div className="space-y-3">
          {likedPuzzles.length > 0 && (
            <div className="space-y-2 pb-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase">{t('match.config.suggestions')}</span>
                <span className="text-[9px] font-bold text-purple-400/40 uppercase">♥ {likedPuzzles.length}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
                {likedPuzzles.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedSetupId(p.id);
                      setSelectedSetupName(p.name);
                    }}
                    className="flex-shrink-0 w-32 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left group relative overflow-hidden"
                  >
                    <div className="text-[10px] font-black text-slate-800 dark:text-white/70 group-hover:text-purple-400 uppercase truncate mb-1 relative z-10">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative group">
            <input 
              type="text"
              value={puzzleSearchQuery}
              onChange={e => setPuzzleSearchQuery(e.target.value)}
              placeholder={t('match.config.searchPuzzlePlaceholder')}
              className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-purple-500/10 rounded-2xl px-4 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-400 dark:text-white/20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-purple-400 transition-colors">
              {isSearchingPuzzles ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : '🧩'}
            </div>
          </div>

          {puzzleSearchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-200 dark:bg-black/20 border border-black/5 dark:border-white/5 custom-scrollbar">
               {puzzleSearchResults.map(p => (
                 <button
                   key={p.id}
                   type="button"
                   onClick={() => {
                     setSelectedSetupId(p.id);
                     setSelectedSetupName(p.name);
                   }}
                   className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:bg-white/5 border-b border-white/[0.02] last:border-0 transition-colors text-left"
                 >
                    <div className="flex flex-col items-start gap-0.5">
                       <span className="text-[11px] font-black text-slate-800 dark:text-white/80 uppercase tracking-tight">{p.name}</span>
                       <span className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase">Level {p.level || '?'}</span>
                    </div>
                    <span className="text-[10px] font-black text-purple-400/60 uppercase group-hover:text-purple-400">{t('match.config.select')}</span>
                 </button>
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

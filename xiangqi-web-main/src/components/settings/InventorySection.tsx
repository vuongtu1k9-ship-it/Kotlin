import React from 'react';
import { useTranslation } from 'react-i18next';

interface InventorySectionProps {
  stats: { inventory?: Record<string, number> } | null;
  shopGifts: Record<string, { id: string; name: string; icon: string }>;
}

export const InventorySection: React.FC<InventorySectionProps> = ({ stats, shopGifts }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
        <span className="text-blue-500">🎒</span> {t('settings.inventory')}
      </h3>
      <div className="flex flex-wrap gap-4">
        {Object.values(shopGifts).map(item => {
          const count = stats?.inventory?.[item.id] || 0;
          if (count === 0) return null;
          return (
            <div key={item.id} className="relative group p-4 rounded-2xl bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-all text-center min-w-[100px]">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="text-[10px] font-black text-slate-600 dark:text-white/40 uppercase truncate">{item.name}</div>
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-lg bg-blue-600 text-[10px] font-black text-slate-900 dark:text-white shadow-xl border border-black/10 dark:border-white/10">x{count}</span>
            </div>
          );
        })}
        {(!stats?.inventory || Object.keys(stats.inventory || {}).length <= 1) && (
          <div className="w-full py-12 text-center rounded-[2rem] border-2 border-dashed border-black/5 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-white/10 uppercase tracking-[0.3em]">{t('profile.gifts.empty')}</div>
        )}
      </div>
    </div>
  );
};

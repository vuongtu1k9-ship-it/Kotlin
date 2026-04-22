type Tab<T extends string> = { key: T; label: string };

export function Tabs<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  tabs: Tab<T>[];
}) {
  const { value, onChange, tabs } = props;
  return (
    <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={
            'rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ' +
            (value === t.key
              ? 'bg-[var(--cobalt-indigo)] text-white shadow-xl shadow-indigo-500/20 scale-105 z-10'
              : 'border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:text-white hover:border-slate-300')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

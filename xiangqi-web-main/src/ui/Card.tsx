import React, { type HTMLAttributes } from 'react';

type Props = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
};

export function Card({ title, subtitle, headerRight, className = '', children, ...props }: Props) {
  return (
    <div
      className={
        'relative group rounded-[2rem] bg-white dark:bg-white/[0.03] p-6 premium-border premium-shadow-luxe ring-premium-luxe ' +
        'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl ' +
        'transition-shadow duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:bg-white/[0.06] ' +
        className
      }
      {...props}
    >
      {/* Top Accent Bar (điểm nhấn) */}
      <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-transparent via-[var(--cobalt-indigo)] to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
      {(title || subtitle || headerRight) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <div className="truncate text-sm font-extrabold text-slate-900 dark:text-white/90 uppercase tracking-tighter font-heading">
                {title}
              </div>
            )}
            {subtitle && <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-widest">{subtitle}</div>}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

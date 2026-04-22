import React from 'react';

interface InfoCardProps {
  children: React.ReactNode;
  title: string;
  icon?: string;
  className?: string;
  fullHeight?: boolean;
}

/**
 * Premium Glassmorphism Card for sidebars and information display.
 * Includes a gradient glow effect and consistent typography.
 */
export const InfoCard: React.FC<InfoCardProps> = React.memo(({ 
  children, 
  title, 
  icon, 
  className = "",
  fullHeight = false
}) => (
  <div className={`relative overflow-hidden group bg-white/70 dark:bg-black/30 backdrop-blur-md rounded-[32px] border border-black/10 dark:border-white/10 shadow-sm dark:shadow-2xl transition-all duration-500 hover:border-black/20 dark:border-white/20 ${fullHeight ? 'h-full flex flex-col' : ''} ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />
    <div className={`relative p-5 ${fullHeight ? 'flex-1 flex flex-col' : ''}`}>
      <div className="flex items-center gap-3 mb-5 shrink-0">
        {icon && <span className="text-xl">{icon}</span>}
        <div className="flex flex-col">
          <h2 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">{title}</h2>
          <div className="h-[2px] w-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all group-hover:w-12" />
        </div>
      </div>
      <div className={fullHeight ? 'flex-1' : ''}>
        {children}
      </div>
    </div>
  </div>
));

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/30 backdrop-blur-md border-b border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            {t('navbar.brand')} <span className="text-blue-400">{t('navbar.online')}</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/practice" className="hover:text-blue-500 transition-colors uppercase tracking-widest text-slate-600 dark:text-white/70">
            {t('navbar.practice')}
          </Link>
          <Link to="/puzzles" className="hover:text-blue-500 transition-colors uppercase tracking-widest text-slate-600 dark:text-white/70">
            {t('navbar.puzzles')}
          </Link>
          <Link to="/shop" className="hover:text-blue-500 transition-colors uppercase tracking-widest text-slate-600 dark:text-white/70">
            {t('navbar.shop')}
          </Link>
          <Link to="/tournaments" className="hover:text-blue-500 transition-colors uppercase tracking-widest text-slate-600 dark:text-white/70">
            {t('navbar.tournaments')}
          </Link>
          <Link to="/players" className="hover:text-blue-500 transition-colors uppercase tracking-widest text-slate-600 dark:text-white/70">
            {t('navbar.leaderboard')}
          </Link>
          <Link to="/how-to-play" className="hover:text-blue-500 transition-colors uppercase tracking-widest text-slate-600 dark:text-white/70">
            {t('navbar.howToPlay')}
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

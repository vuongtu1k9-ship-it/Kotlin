import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
const AuthBar = lazy(() => import('../components/AuthBar').then(m => ({ default: m.AuthBar })));
const Footer = lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));
import { useAuth } from '../auth/AuthContext';
import { useInvitations } from '../hooks/useInvitations';
import { useSiteSettings, refreshSiteSettings } from '../hooks/useSiteSettings';
import { SEO } from '../components/SEO';
import { PushInitializer } from '../components/PushInitializer';
import { ThemeToggle } from '../components/ThemeToggle';
import { useChallengeContext } from '../components/ChallengeContext';
import { showBrowserNotification } from '../utils/browserNotify';
import { getSiteOrigin, getAbsoluteUrl } from '../utils/url';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

// Lazy load non-critical widgets
const GlobalChatWidget = lazy(() => import('../components/GlobalChatWidget').then(m => ({ default: m.GlobalChatWidget })));
const ChallengeManager = lazy(() => import('../components/ChallengeManager').then(m => ({ default: m.ChallengeManager })));
const GoogleOneTap = lazy(() => import('../components/GoogleOneTap').then(m => ({ default: m.GoogleOneTap })));
const UserProfileDialog = lazy(() => import('../components/UserProfileDialog').then(m => ({ default: m.UserProfileDialog })));


function BurgerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

import { getSocket } from '../net/socket';

import { useToast } from '../components/ui/Toast';

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { state: authState } = useAuth();
  const settings = useSiteSettings();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { addSystemNotif } = useChallengeContext();
  const { t } = useTranslation();

  const localizedNavLinks = [
    { to: '/', label: t('navbar.home') },
    { to: '/game', label: t('common.play') },
    { to: '/puzzles', label: t('navbar.puzzles') },
    { to: '/xep-co-the', label: t('navbar.setup') },
    { to: '/ai', label: t('navbar.ai') },
    { to: '/tournaments', label: t('navbar.tournaments') },
    { to: '/practice', label: t('navbar.practice') },
    { to: '/how-to-play', label: t('navbar.howToPlay') },
    { to: '/players', label: t('navbar.players') },
    { to: '/shop', label: t('navbar.shop') },
  ];

  useInvitations();

  useEffect(() => {
    const s = getSocket();
    const handleNotification = (data: { title: string; body: string; url?: string }) => {
      // 1. Show in-app toast
      showToast(
        <div className="flex flex-col gap-1">
          <div className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">{data.title}</div>
          <div className="text-[11px] text-slate-600 dark:text-white/60 leading-tight">{data.body}</div>
          {data.url && (
            <Link to={data.url} className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 hover:text-blue-300">
              Xem ngay →
            </Link>
          )}
        </div>,
        'info'
      );
      // 2. Add to bell
      addSystemNotif({
        id: `notif-${Date.now()}-${Math.random()}`,
        title: data.title,
        body: data.body,
        url: data.url,
        createdAt: Date.now(),
      });
      // 3. Browser notification when tab is hidden
      showBrowserNotification(data.title, { body: data.body, url: data.url });
    };

    s.on('notification:receive', handleNotification);
    return () => {
      s.off('notification:receive', handleNotification);
    };
  }, [showToast, addSystemNotif]);

  useEffect(() => {
    if (!authState.user?.uid) {
      setActiveRoomId(null);
      return;
    }

    const s = getSocket();
    const handleActiveUpdate = (data: { roomId: string | null }) => {
      setActiveRoomId(data.roomId);
    };

    s.on('room:active_game', handleActiveUpdate);
    s.emit('room:active_check');

    const onRefreshEvent = () => s.emit('room:active_check');
    window.addEventListener('refresh-active-game', onRefreshEvent);

    return () => {
      s.off('room:active_game', handleActiveUpdate);
      window.removeEventListener('refresh-active-game', onRefreshEvent);
    };
  }, [authState.user, authState.token]);

  const isAtActiveRoom = activeRoomId && (
    location.pathname === `/game/${activeRoomId}` ||
    location.pathname.startsWith(`/game/${activeRoomId}-`)
  );

  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const s = getSocket();
    const handleSettingsUpdate = () => {
      refreshSiteSettings();
    };
    s.on('site:settings_update', handleSettingsUpdate);
    return () => {
      s.off('site:settings_update', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const isMaintenance = settings['site.maintenanceMode'] === true && authState.user?.sysRole !== 'admin';

  return (
    <>
      <PushInitializer />

      {/* Global Background (High-Contrast Luxe) */}
      <div className="fixed inset-0 z-[-1] bg-[var(--porcelain-bg)] dark:bg-[#0B0F19] overflow-hidden transition-colors duration-500" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--porcelain-bg)] via-[var(--luxe-slate)]/50 to-[var(--porcelain-bg)] dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#0B0F19]" />
        {/* Orbs: isolated to GPU compositor layer to avoid main-thread TBT. Pulse disabled on mobile for CLS stability. */}
        <div className="perf-isolated-anim absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[var(--cobalt-indigo-soft)]/[0.08] dark:bg-blue-500/10 blur-[60px] sm:blur-[130px] rounded-full pointer-events-none" />
        <div className="perf-isolated-anim absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/[0.08] dark:bg-indigo-500/10 blur-[60px] sm:blur-[130px] rounded-full pointer-events-none" />
      </div>

      <div className="min-h-screen relative flex flex-col text-slate-900 dark:text-slate-200 selection:bg-blue-500/20 font-sans overflow-x-hidden xq-layout-root">
        {/* TOP RESERVED SPACE: Prevents CLS from dynamic bars */}
        <div className="xq-top-reserve" aria-hidden="true" />

        {/* Header/Nav Section: Part of the Flow to prevent overlap hacks */}
        <div className="z-50 flex flex-col w-full relative">
          <div className="w-full">
            {/* Maintenance Overlay */}
            {isMaintenance && (
              <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                  <div className="text-6xl mb-6">🛠️</div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-4 tracking-tight">{t('site.maintenanceModeTitle')}</h2>
                  <p className="text-slate-600 dark:text-white/60 mb-8 leading-relaxed">
                    {settings['site.maintenanceMessage'] || t('site.maintenanceMessageDefault')}
                  </p>
                  <div className="h-1 w-20 bg-xq-gold mx-auto rounded-full" />
                </div>
              </div>
            )}

            {/* Announcement: Container with fixed height to avoid layout shift */}
            <div className="relative z-30" style={{ minHeight: settings['site.announcementText'] ? '40px' : '0px' }}>
              {settings['site.announcementText'] && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 shadow-lg overflow-hidden h-[40px]">
                  <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded shadow-sm">{t('site.announcementLabel')}</span>
                    <span className="text-sm font-bold truncate tracking-tight">{settings['site.announcementText']}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Header */}
            {!isAdminPage && (
            <header className="px-4 ethereal-glass shadow-md border-b border-slate-200/50 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md">
              <div className="mx-auto w-full max-w-[1800px]">
                <div className="flex items-center h-16 gap-2 sm:gap-4 relative">
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      title={t('navbar.openMenu')}
                      aria-label={t('navbar.openMenu')}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-slate-800 dark:text-white/80 hover:bg-slate-200 dark:bg-white/10 transition-all sm:hidden"
                      onClick={() => setOpen(true)}
                    >
                      <BurgerIcon />
                    </button>
                  </div>

                  {/* Center: Brand */}
                  <div className="flex-1 flex justify-center sm:justify-start min-w-0">
                    <Link to="/" className="flex flex-col group min-w-0 transition-all">
                      <div className="font-heading text-xs sm:text-lg xl:text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors leading-tight flex flex-col sm:flex-row sm:gap-1.5 items-center sm:items-baseline">
                        <span>{t('navbar.brand')}</span>
                        <span className="text-blue-500">{t('navbar.online')}</span>
                      </div>
                    </Link>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-[150px] sm:min-w-[180px] justify-end">
                    <div className="hidden xl:flex items-center gap-2 mr-4 border-r border-black/10 dark:border-white/10 pr-6 no-scrollbar">
                      {localizedNavLinks.map((t) => (
                        <NavLink
                          key={t.to}
                          to={t.to}
                          className={({ isActive }) =>
                            [
                              'px-1 xl:px-2 py-1 text-[11px] xl:text-[12px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap',
                              isActive
                                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                                : 'text-slate-500 dark:text-white/40 border-transparent hover:text-slate-900 dark:text-white',
                            ].join(' ')
                          }
                        >
                          {t.label}
                        </NavLink>
                      ))}
                    </div>
                    <LanguageSelector />
                    <ThemeToggle />
                    <Suspense fallback={<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 animate-pulse min-w-[126px]"><div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" /><div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded shrink-0" /></div>}>
                      <AuthBar />
                    </Suspense>
                  </div>
                </div>

                {/* Tablet secondary navigation */}
                <nav className="hidden sm:flex xl:hidden items-center gap-4 py-3 border-t border-white/[0.03] overflow-x-auto no-scrollbar">
                  {localizedNavLinks.map((t) => (
                    <NavLink
                      key={t.to}
                      to={t.to}
                      className={({ isActive }) =>
                        [
                          'px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap',
                          isActive
                            ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                            : 'text-slate-500 dark:text-white/40 border-transparent hover:text-slate-900 dark:text-white',
                        ].join(' ')
                      }
                    >
                      {t.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </header>
            )}

            {/* Mobile drawer */}
            {open && (
              <div className="fixed inset-0 z-[60] sm:hidden">
                <button aria-label={t('navbar.closeMenu')} className="absolute inset-0 bg-white/95 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
                <aside className="absolute left-0 top-0 h-full w-[85%] max-w-xs border-r border-black/5 dark:border-white/5 bg-[#0b0f19]/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-left duration-300">
                  <div className="flex items-center justify-between border-b border-white/[0.03] px-6 h-16">
                    <div className="flex flex-col">
                      <div className="font-heading font-black text-slate-900 dark:text-white text-sm tracking-tighter uppercase">{t('navbar.menu')}</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest">{t('navbar.navigation')}</div>
                    </div>
                    <button
                      type="button"
                      title={t('navbar.closeMenu')}
                      aria-label={t('navbar.closeMenu')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-slate-600 dark:text-white/50 hover:text-slate-900 dark:text-white"
                      onClick={() => setOpen(false)}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <nav className="flex flex-col gap-1 p-4 overflow-y-auto">
                    {localizedNavLinks.map((t) => (
                      <NavLink
                        key={t.to}
                        to={t.to}
                        className={({ isActive }) =>
                          [
                            'px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-l-4',
                            isActive
                              ? 'text-blue-500 border-blue-500'
                              : 'text-slate-600 dark:text-white/40 border-transparent hover:text-slate-900 dark:text-white',
                          ].join(' ')
                        }
                      >
                        {t.label}
                      </NavLink>
                    ))}
                  </nav>
                </aside>
              </div>
            )}
          </div></div>

        {/* Main Content Area */}
        <main className="w-full mx-auto max-w-[1800px] px-2 pb-12 pt-6 sm:px-6 min-h-[50vh] flex-grow">
          {activeRoomId && !isAtActiveRoom && location.pathname !== '/' && (
            <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
              <Link
                to={`/game/${activeRoomId}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-slate-900 dark:text-white shadow-xl shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <span className="text-2xl animate-pulse">⚔️</span>
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-tight">{t('navbar.activeGameAlert')}</div>
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{t('navbar.returnToBoard')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-lg">
                  {t('navbar.back')} <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7"></path></svg>
                </div>
              </Link>
            </div>
          )}
          <Suspense fallback={
            <div className="w-full mx-auto max-w-[1800px] px-2 pt-6 sm:px-6">
              <div className="mb-8 px-4 py-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-200 dark:text-white/10 uppercase tracking-tighter leading-none animate-pulse">
                  COTUONG<span className="opacity-50">.XYZ</span>
                </h1>
                <div className="h-3 w-48 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse mt-2 opacity-50" />
              </div>
              <div className="flex flex-col lg:flex-row gap-8 justify-center">
                <div className="w-full lg:w-[320px] h-[400px] xq-skeleton-pulse rounded-2xl order-2 lg:order-1" />
                <div className="flex-1 max-w-[600px] aspect-[9/10] xq-skeleton-pulse rounded-2xl order-1 lg:order-2" />
                <div className="hidden xl:block w-[300px] h-[600px] xq-skeleton-pulse rounded-2xl order-3" />
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>

        {/* Row 3: Footer - Deferred */}
        {!isAdminPage && (
          <Suspense fallback={<div className="h-[400px] w-full bg-black/5 dark:bg-white/5" />}>
            <Footer />
          </Suspense>
        )}
      </div>

      {/* Overlays (Outside Grid) - Deferred to prioritize LCP */}
      <Suspense fallback={null}>
        <GlobalChatWidget />
        <ChallengeManager />
        <GoogleOneTap />
        <UserProfileDialog />
      </Suspense>

      <SEO
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": `${t('navbar.brand')} ${t('navbar.online')}`,
          "url": getSiteOrigin(),
          "logo": getAbsoluteUrl('/logo.svg'),
          "sameAs": [
            "https://web.facebook.com/cotuong.xyz",
            "https://web.facebook.com/groups/cotuong.xyz",
            "https://www.youtube.com/@cotuongxyz"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "choicotuongtoday@gmail.com",
            "contactType": "customer service"
          }
        }}
      />
    </>
  );
}

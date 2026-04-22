import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../utils/logger';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from './NotificationBell';
import { CustomStatus, useOnlinePlayers } from '../hooks/useOnlinePlayers';
import { getSocket } from '../net/socket';
import { getEloRank } from '../utils/eloRanks';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { 
  Mail, 
  LogOut, 
  ChevronDown, 
  LogIn, 
  Trophy, 
  UserCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthBarProps {
  // compact header version
}

export function AuthBar({ }: AuthBarProps) {
  const { t } = useTranslation();
  const { state, loginWithGoogleCredential, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { presenceMap } = useOnlinePlayers();
  const settings = useSiteSettings();

  const myPresence = (state.status === 'auth' && state.user) ? presenceMap.get(state.user.uid) : null;
  const currentStatus: CustomStatus = myPresence?.customStatus || 'online';

  const handleChangeStatus = (status: CustomStatus) => {
    setShowMenu(false);
    const socket = getSocket();
    socket.emit('presence:custom_status', { status });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => {
      // Only open menu if user is NOT logged in
      if (state.status !== 'auth') {
        setShowMenu(true);
      }
    };
    window.addEventListener('open-login-modal', handleOpenLogin);
    return () => window.removeEventListener('open-login-modal', handleOpenLogin);
  }, [state.status]);

  const getStatusColor = (s: string) => {
    if (s === 'busy') return 'bg-amber-600 dark:bg-amber-500';
    if (s === 'invisible' || s === 'offline') return 'bg-black/20 dark:bg-white/20';
    if (s === 'free') return 'bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (s === 'idle') return 'bg-slate-400';
    return 'bg-emerald-600 dark:bg-green-500';
  };

  const getStatusLabel = (s: string) => {
    return t(`navbar.statuses.${s}`, { defaultValue: s });
  };

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || (window as any).__GOOGLE_CLIENT_ID__ || '').trim();
  const googleEnabled = Boolean(googleClientId);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded shrink-0" />
      </div>
    );
  }

  // --- LOGGED IN STATE ---
  if (state.status === 'auth' && state.user) {
    return (
      <div className="flex items-center gap-2" ref={menuRef}>
        <div className="flex items-center gap-1.5 mr-1">
          <NotificationBell />
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label={t('navbar.userMenu')}
          className="group relative flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/[0.03] border border-black/10 dark:border-white/10 hover:bg-slate-200 dark:bg-white/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 active:scale-95 shadow-lg shadow-black/20"
        >
          <div className="relative">
            {state.user.picture ? (
              <img
                src={state.user.picture}
                alt={state.user.name || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black text-slate-900 dark:text-white shadow-inner ring-2 ring-white/10">
                {(state.user.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0F19] ${getStatusColor(currentStatus)}`} />
          </div>
          
          <div className="hidden lg:flex flex-col items-start min-w-[60px] max-w-[120px]">
            <span className="text-xs font-black text-slate-800 dark:text-white/90 truncate w-full tracking-tight leading-tight">
              {state.user.name || t('navbar.guestName')}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] grayscale brightness-150">🪙</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500/80 leading-none">
                {state.user.inventory?.coins || 0}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:text-white/60 transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* User Hub Dropdown */}
        {showMenu && (
          <div className="absolute top-[70px] right-0 w-[calc(100vw-2rem)] max-w-64 sm:w-64 bg-white dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            {/* Header Info */}
            <div className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-black/10 dark:border-white/20 bg-slate-100 dark:bg-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                  {(state.user.picture && !imgError) ? (
                    <img 
                      src={state.user.picture} 
                      className="w-full h-full object-cover" 
                      alt={state.user.name || 'User'} 
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-slate-400 dark:text-white/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{state.user.name}</div>
                  <div className="text-[10px] font-bold text-slate-600 dark:text-white/40 truncate tracking-widest mt-0.5">{t('navbar.playerType')}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-2 border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 transition-colors">
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600/60 dark:text-amber-500/60 uppercase tracking-widest mb-1">
                      <span>🪙</span> {t('navbar.coins')}
                   </div>
                   <div className="text-sm font-black text-amber-600 dark:text-amber-400">{state.user.inventory?.coins || 0}</div>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-2 border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 transition-colors">
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600/60 dark:text-blue-500/60 uppercase tracking-widest mb-1">
                      <Trophy className="w-3 h-3" /> {t('navbar.rank')}
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400">
                      <span>{getEloRank(myPresence?.elo || 1200, settings['elo.ranks']).icon}</span>
                      <span className="truncate">{t(getEloRank(myPresence?.elo || 1200, settings['elo.ranks']).title)}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="p-3 space-y-2">
              <Link to="/settings" onClick={() => setShowMenu(false)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:bg-white/5 text-sm font-bold text-slate-800 dark:text-white/70 hover:text-slate-900 dark:text-white transition-all group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600/20 dark:group-hover:bg-blue-400/20 transition-colors">
                   <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                {t('navbar.profile')}
              </Link>
              
              {/* Status Section */}
              <div className="px-2.5 py-2">
                <div className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-2 px-1">{t('navbar.status')}</div>
                <div className="grid grid-cols-2 gap-1">
                   {(['online', 'free', 'busy', 'invisible'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleChangeStatus(s)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${currentStatus === s ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(s).split(' ')[0]}`} />
                        {getStatusLabel(s)}
                      </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Footer Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 p-6 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-black uppercase tracking-widest transition-all border-t border-black/5 dark:border-white/5"
            >
              <LogOut className="w-4 h-4" /> {t('navbar.logout')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" ref={menuRef}>
      <Link
        to="/login"
        aria-label={t('common.login')}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all group"
      >
        <LogIn className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">{t('common.login')}</span>
      </Link>

      {showMenu && (
        <div className="absolute top-[60px] right-0 w-[calc(100vw-2rem)] max-w-72 sm:w-72 bg-white dark:bg-[#0F172A]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="text-center mb-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('navbar.welcome')}</h3>
            <p className="text-[11px] text-slate-600 dark:text-white/40 font-medium tracking-tight mt-1">{t('navbar.loginToEarn')}</p>
          </div>

          <div className="space-y-3">
             {googleEnabled ? (
                <div className="w-full flex justify-center transform scale-95 overflow-hidden rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 transition-colors bg-white">
                  {(() => {
                    const currentHost = window.location.host;
                    const isAuthDomain = currentHost.startsWith('auth.');
                    
                    if (!isAuthDomain) {
                      const authBase = 'https://auth.cotuong.xyz';
                      const authUrl = `${authBase}/api/oauth/google/start?returnTo=${encodeURIComponent(window.location.origin)}`;
                      
                      return (
                        <a
                          href={authUrl}
                          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          {t('navbar.loginWithGoogle')}
                        </a>
                      );
                    }

                    return (
                      <GoogleLogin
                        onSuccess={(cred) => {
                          const token = (cred as any)?.credential;
                          if (!token) return;
                          void loginWithGoogleCredential(token);
                          setShowMenu(false);
                        }}
                        onError={() => logger.error("Login Failed")}
                        useOneTap={false}
                        theme="outline"
                        width={240}
                      />
                    );
                  })()}
                </div>
             ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-500 text-center uppercase tracking-widest">
                   {t('navbar.googleMaintenance')}
                </div>
             )}

             <Link
               to="/login"
               onClick={() => setShowMenu(false)}
               className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white/80 transition-all group"
             >
                <Mail className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">{t('navbar.useEmail')}</span>
             </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 text-center">
             <Link to="/how-to-play" onClick={() => setShowMenu(false)} className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest hover:text-slate-600 dark:text-white/40 transition-colors">
                {t('navbar.playAsGuest')}
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}

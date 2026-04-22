import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../ui/Card';
import { GoogleLogin } from '@react-oauth/google';
import { logger } from '../utils/logger';

export function LoginPage() {
  const { t } = useTranslation();
  const { state, loginWithEmailPassword, registerWithEmailPassword, loginWithGoogleCredential } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || (window as any).__GOOGLE_CLIENT_ID__ || '').trim();
  const googleEnabled = Boolean(googleClientId);

  if (state.status === 'auth') return <Navigate to="/profile" replace />;

  return (
    <div className="space-y-4">
      <Card 
        title={mode === 'login' ? t('common.login') : t('auth.registerTitle')} 
        subtitle={mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
      >
        {err && <div className="mb-2 text-sm text-red-300">{err}</div>}

        <div className="grid gap-4">
          {/* Google Auth Section */}
          {googleEnabled ? (
            <div className="flex justify-center pt-2 pb-1">
              {(() => {
                // Centralized Auth logic: Always go through auth.cotuong.xyz for Google login
                const currentHost = window.location.host;
                const isAuthDomain = currentHost.startsWith('auth.');
                
                // If we are NOT on the auth domain, redirect to it for Google OAuth
                if (!isAuthDomain) {
                  const authBase = 'https://auth.cotuong.xyz'; // Dedicated SSO hub
                  const authUrl = `${authBase}/api/oauth/google/start?returnTo=${encodeURIComponent(window.location.origin)}`;
                  
                  return (
                    <a
                      href={authUrl}
                      className="flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors w-[280px]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      {t('auth.loginWithGoogle')}
                    </a>
                  );
                }

                return (
                  <GoogleLogin
                    onSuccess={(cred) => {
                      const token = (cred as any)?.credential;
                      if (!token) return;
                      void loginWithGoogleCredential(token);
                    }}
                    onError={() => logger.error("Google Login Failed")}
                    useOneTap={false}
                    theme="outline"
                    width={280}
                  />
                );
              })()}
            </div>
          ) : null}

          {googleEnabled && (
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              <span className="text-xs text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest">{t('auth.orEmail')}</span>
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            </div>
          )}
          <label className="grid gap-1">
            <span className="text-xs text-slate-600 dark:text-white/60">{t('auth.emailLabel')}</span>
            <input
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {mode === 'register' && (
            <label className="grid gap-1">
              <span className="text-xs text-slate-600 dark:text-white/60">{t('auth.displayNameLabel')}</span>
              <input
                className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('game.rankGeneric')}
                autoComplete="nickname"
              />
            </label>
          )}

          <label className="grid gap-1">
            <span className="text-xs text-slate-600 dark:text-white/60">{t('auth.passwordLabel')}</span>
            <input
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {mode === 'register' && (
            <label className="flex items-start gap-2 cursor-pointer group py-2">
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 rounded border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-black"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="text-[11px] text-slate-600 dark:text-white/50 leading-relaxed group-hover:text-slate-800 dark:text-white/70 transition-colors">
                {t('auth.termsAgreementPrefix')}
                <Link to="/terms" className="text-blue-400 hover:underline">{t('auth.termsLink')}</Link>
                {` ${t('common.and')} `}
                <Link to="/privacy" className="text-blue-400 hover:underline">{t('auth.privacyLink')}</Link>
                {t('auth.termsAgreementSuffix')}
              </span>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-xq-accent/20 px-3 py-2 text-sm font-bold text-xq-accent"
              onClick={async () => {
                setErr(null);
                if (mode === 'register' && !acceptedTerms) {
                  setErr(t('auth.termsError'));
                  return;
                }
                try {
                  if (mode === 'login') await loginWithEmailPassword(email, password);
                  else await registerWithEmailPassword(email, password, name);
                } catch (e: any) {
                  setErr(String(e?.message || e || 'FAILED'));
                }
              }}
              disabled={state.status === 'loading'}
            >
              {state.status === 'loading' ? t('auth.processing') : mode === 'login' ? t('common.login') : t('auth.registerTitle')}
            </button>

            <button
              type="button"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-black/10 px-3 py-2 text-sm text-slate-800 dark:text-white/80"
              onClick={() => {
                setErr(null);
                setMode((m) => (m === 'login' ? 'register' : 'login'));
              }}
            >
              {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
            </button>

            <Link to="/" className="text-sm text-slate-600 dark:text-white/60 hover:underline">
              {t('auth.backToLobby')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

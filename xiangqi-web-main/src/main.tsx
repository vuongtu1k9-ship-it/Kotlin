import { logger } from './utils/logger';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './i18n';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { DialogProvider } from './components/ui/DialogContext';
import { ChallengeProvider } from './components/ChallengeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './theme/ThemeContext';
import { SocialProvider } from './state/SocialContext';
import './index.css';

// ── Global unhandled error catchers ──────────────────────────────────────────
window.onerror = (message, source, lineno, colno, error) => {
  logger.error('[GlobalError] Uncaught JS error:', message, { source, lineno, colno, error });
  if (/Failed to fetch dynamically imported module/.test(String(message))) {
    window.location.reload();
  }
};
window.onunhandledrejection = (event) => {
  logger.error('[GlobalError] Unhandled Promise rejection:', event.reason);
  if (/Failed to fetch dynamically imported module/.test(event.reason?.message || '')) {
    window.location.reload();
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || __GOOGLE_CLIENT_ID__ || '').trim();

if (!GOOGLE_CLIENT_ID && import.meta.env.DEV) {
  logger.warn('[Auth] Missing Google Client ID (checked VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID). Google login will be disabled.');
}

const AppTree = (
  <ErrorBoundary>
    <HelmetProvider>
      <BrowserRouter basename="/">
        <ThemeProvider defaultTheme="dark">
          <ToastProvider>
            <DialogProvider>
              <AuthProvider>
                <SocialProvider>
                  <ChallengeProvider>
                  {GOOGLE_CLIENT_ID ? (
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                      <App />
                    </GoogleOAuthProvider>
                  ) : (
                    <App />
                  )}
                </ChallengeProvider>
              </SocialProvider>
              </AuthProvider>
            </DialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </ErrorBoundary>
);

// High-performance mount: use requestIdleCallback if available, or a short timeout
const mount = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.Suspense fallback={null}>
      {AppTree}
    </React.Suspense>
  );
};

if (window.requestIdleCallback) {
  window.requestIdleCallback(mount);
} else {
  setTimeout(mount, 0);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => logger.debug('[SW] Registered:', reg.scope))
      .catch(err => logger.error('[SW] Registration failed:', err));
  });
}

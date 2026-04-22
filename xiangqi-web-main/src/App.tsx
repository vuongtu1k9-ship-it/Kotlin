import React, { lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { useInactivityTracking } from './hooks/useOnlinePlayers';
import { useAuth } from './auth/AuthContext';
import { logger } from './utils/logger';

const LobbyPage = lazy(() => import('./pages/LobbyPage').then(m => ({ default: m.LobbyPage })));

// Lazy load pages for code splitting
const GamePage = lazy(() => import('./pages/GamePage').then(m => ({ default: m.GamePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PlayersPage = lazy(() => import('./pages/PlayersPage').then(m => ({ default: m.PlayersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SetupPage = lazy(() => import('./pages/SetupPage').then(m => ({ default: m.SetupPage })));
const PuzzlesPage = lazy(() => import('./pages/PuzzlesPage').then(m => ({ default: m.PuzzlesPage })));
const PuzzleViewPage = lazy(() => import('./pages/PuzzleViewPage').then(m => ({ default: m.PuzzleViewPage })));
const AiGamePage = lazy(() => import('./pages/AiGamePage').then(m => ({ default: m.AiGamePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const HowToPlayPage = lazy(() => import('./pages/HowToPlayPage').then(m => ({ default: m.HowToPlayPage })));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage').then(m => ({ default: m.TournamentsPage })));
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage').then(m => ({ default: m.TournamentDetailPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const GamesPage = lazy(() => import('./pages/GamesPage').then(m => ({ default: m.GamesPage })));
const PracticePage = lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));

function GamesRedirect() {
  const { gameId } = useParams();
  return <Navigate to={`/game/${gameId}`} replace />;
}

const GlobalOneTap = lazy(() => import('./components/GlobalOneTap').then(m => ({ default: m.GlobalOneTap })));
export default function App() {
  useInactivityTracking();
  const { state: authState } = useAuth();
  const [showOneTap, setShowOneTap] = React.useState(false);
  
  useEffect(() => {
    // Load GSI only after CPU is idle AND React hydration is complete (min 8s)
    // Same strategy as GA: wait for idle, not just time
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setShowOneTap(true), { timeout: 3000 });
      } else {
        setShowOneTap(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showOneTap && <GlobalOneTap />}
      <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/game/local" element={<Navigate to="/" replace />} />
        <Route path="/game" element={<GamesPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/games" element={<Navigate to="/game" replace />} />
        <Route path="/games/:gameId" element={<GamesRedirect />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/player/:slug" element={<ProfilePage />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/setup" element={<Navigate to="/xep-co-the" replace />} />
        <Route path="/puzzles" element={<PuzzlesPage />} />
        <Route path="/xep-co-the" element={<SetupPage />} />
        <Route path="/puzzles/:slug" element={<PuzzleViewPage />} />
        <Route path="/ai" element={<AiGamePage />} />
        <Route path="/how-to-play" element={<HowToPlayPage />} />
        <Route path="/practice/:categorySlug/:lessonId" element={<PracticePage />} />
        <Route path="/practice/:lessonId" element={<PracticePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/admin/:tab?" element={<AdminPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/ky-thu" element={<Navigate to="/players" replace />} />
        <Route path="/nhung-tran-dau-hay" element={<Navigate to="/game" replace />} />
        <Route path="/choi-thu" element={<Navigate to="/ai" replace />} />
        <Route path="/ban-html" element={<Navigate to="/games" replace />} />
        <Route path="/member/Computer" element={<Navigate to="/ai" replace />} />
        <Route path="/Computer" element={<Navigate to="/ai" replace />} />
        <Route path="/rules" element={<Navigate to="/how-to-play" replace />} />
        <Route path="/xep-co-" element={<Navigate to="/xep-co-the" replace />} />
        <Route path="/co-the" element={<Navigate to="/puzzles" replace />} />
        <Route path="/page_:num" element={<Navigate to="/puzzles" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
}

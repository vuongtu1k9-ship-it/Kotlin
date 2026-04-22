import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Database } from 'lucide-react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminActions } from '../hooks/useAdminActions';
import { useTournamentForm } from '../hooks/useTournamentForm';
import { API_URL } from '../auth/auth';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminAiOview } from '../components/admin/AdminAiOview';
import { AdminUserTable } from '../components/AdminUserTable';
import { AdminMatchTable } from '../components/AdminMatchTable';
import { AdminPuzzleGrid } from '../components/AdminPuzzleGrid';
import { AdminAiPuzzleWorker } from '../components/admin/AdminAiPuzzleWorker';
import { AdminTournamentManager } from '../components/AdminTournamentManager';
import AdminSettingsSection from '../components/AdminSettingsSection';
import { AdminCacheSection } from '../components/AdminCacheSection';
import { AdminPagination } from '../components/AdminPagination';
import { AdminCommentTable } from '../components/AdminCommentTable';
import AdminPracticeManager from '../components/AdminPracticeManager';
import { AdminShopManager } from '../components/AdminShopManager';
import { AdminPushManager } from '../components/AdminPushManager';
import { AdminBotManager } from '../components/AdminBotManager';
import { AdminAiManager } from '../components/AdminAiManager';
import { AdminAnalyticsDashboard } from '../components/AdminAnalyticsDashboard';
import { AdminServerManager } from '../components/AdminServerManager';
import { AdminSocialManager } from '../components/admin/AdminSocialManager';
import { VisualBoardEditor } from '../components/VisualBoardEditor';
import { LanguageSelector } from '../components/LanguageSelector';

export function AdminPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { tab: tabParam } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab = (tabParam || 'dashboard') as any;

  const [boardEditorModal, setBoardEditorModal] = useState<{ open: boolean, onSave?: (d: any) => void }>({ open: false });

  useEffect(() => {
    (window as any).openVisualBoardEditor = (onSave: (data: { fen: string, moves: string }) => void) => {
      setBoardEditorModal({ open: true, onSave });
    };
  }, []);

  const setActiveTab = (tab: string) => {
    navigate(`/admin/${tab}`);
  };

  const {
    data, setData, loading, pagination, setPagination,
    search, setSearch, fetchData
  } = useAdminData(activeTab, authState);

  const setPage = (p: number | ((prev: number) => number)) => {
    setPagination((prev: any) => ({
      ...prev,
      page: typeof p === 'function' ? p(prev.page) : p
    }));
  };

  const {
    handleUpdateRole, handleUpdateElo, handleDeleteUser, handleDeleteMatch,
    handleClearCache, handleDeleteCacheKey, handleDeletePuzzle,
    handleStatusChange, handleDeleteTournament, handleDeleteComment,
    handleUpsertGift, handleDeleteGift
  } = useAdminActions(authState, fetchData);

  const tForm = useTournamentForm(authState, fetchData);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveAllSettings = async (settings: any) => {
    setSavingSettings(true);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ settings }),
      });
      if ((await res.json()).ok) {
        // Success
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePostEntity = async (type: 'game' | 'puzzle', id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/social/post-${type}/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authState.token}` },
        credentials: 'include'
      });
      const result = await res.json();
      if (result.ok) {
        alert('Đã kích hoạt quy trình đăng bài tự động!');
      } else {
        alert('Lỗi: ' + (result.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Lỗi kết nối server');
    }
  };

  if (authState.status === 'loading') return <div className="text-center py-20 text-slate-600 dark:text-white/40">{t('admin.checkingPermissions')}</div>;
  if (!authState.user) return <Navigate to="/login" replace />;
  if (authState.user.sysRole !== 'admin') {
    return <div className="text-center py-20 text-red-500 font-bold">{t('admin.noPermission')}</div>;
  }

  const PaginationUI = <AdminPagination page={pagination.page} totalPages={pagination.totalPages} setPage={setPage} />;

  return (
    <div className="flex bg-slate-50 dark:bg-black min-h-screen">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={authState.user} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

        <header className="h-24 flex items-center justify-between px-12 bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 relative z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.title')}</span>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[10px] text-slate-900 dark:text-white font-black uppercase tracking-[0.2em]">{activeTab}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 pr-8 border-r border-slate-200 dark:border-white/10">
              <LanguageSelector />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">System Core Live</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 mr-1">Latency: 24ms</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-30">
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {loading && (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                  <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500/20" size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{t('admin.syncingData')}</p>
              </div>
            )}

            {!loading && (
              <>
                {activeTab === 'dashboard' && <AdminAiOview authState={authState} />}

                {['users', 'matches', 'puzzles', 'tournaments', 'comments', 'bots'].includes(activeTab) && (
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/5">
                    <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="relative w-full md:w-96">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">🔍</div>
                      <input
                        type="text"
                        placeholder={t('admin.searchPlaceholder')}
                        className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl px-12 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </form>
                  </div>
                )}

                {activeTab === 'users' && <AdminUserTable users={data.users} onUpdateRole={handleUpdateRole} onUpdateElo={handleUpdateElo} onDelete={handleDeleteUser} totalCount={pagination.totalCount} paginationUI={PaginationUI} />}
                {activeTab === 'matches' && <AdminMatchTable matches={data.matches} onDelete={handleDeleteMatch} onPost={(id) => handlePostEntity('game', id)} totalCount={pagination.totalCount} paginationUI={PaginationUI} />}
                {activeTab === 'puzzles' && (
                  <div className="space-y-6">
                    <AdminAiPuzzleWorker authState={authState} />
                    <AdminPuzzleGrid puzzles={data.puzzles} onDelete={handleDeletePuzzle} onPost={(id) => handlePostEntity('puzzle', id)} totalCount={pagination.totalCount} paginationUI={PaginationUI} />
                  </div>
                )}
                {activeTab === 'tournaments' && (
                  <AdminTournamentManager 
                    tournaments={data.tournaments} totalCount={pagination.totalCount} showCreate={tForm.showCreate} setShowCreate={tForm.setShowCreate} creating={tForm.creating}
                    onStatusChange={handleStatusChange} onDelete={handleDeleteTournament} onCreate={tForm.handleCreateTournament} formState={tForm} formHandlers={tForm} paginationUI={PaginationUI}
                  />
                )}
                {activeTab === 'comments' && <AdminCommentTable comments={data.comments} onDelete={handleDeleteComment} totalCount={pagination.totalCount} paginationUI={PaginationUI} />}
                {activeTab === 'practice' && <AdminPracticeManager />}
                {activeTab === 'shop' && <AdminShopManager gifts={data.gifts} onUpsert={handleUpsertGift} onDelete={handleDeleteGift} />}
                {activeTab === 'push' && <AdminPushManager />}
                {activeTab === 'social' && <AdminSocialManager />}
                {activeTab === 'bots' && <AdminBotManager bots={data.bots} onRefresh={fetchData} />}
                {activeTab === 'cache' && <AdminCacheSection cacheStats={data.cacheStats} onClearAll={handleClearCache} onDeleteKey={handleDeleteCacheKey} onRefresh={fetchData} />}
                {activeTab === 'settings' && <AdminSettingsSection settings={data.settings} onSave={handleSaveAllSettings} saving={savingSettings} setLocalSettings={(s: any) => setData((prev: any) => ({ ...prev, settings: typeof s === 'function' ? s(prev.settings) : s }))} />}
                {activeTab === 'analytics' && <AdminAnalyticsDashboard authState={authState} />}
                {activeTab === 'ai' && <AdminAiManager authState={authState} />}
                {activeTab === 'server' && <AdminServerManager authState={authState} />}
              </>
            )}
          </div>
        </main>
      </div>

      {boardEditorModal.open && (
        <VisualBoardEditor 
          onSave={(data) => {
            boardEditorModal.onSave?.(data);
            setBoardEditorModal({ open: false });
          }}
          onClose={() => setBoardEditorModal({ open: false })}
        />
      )}
    </div>
  );
}

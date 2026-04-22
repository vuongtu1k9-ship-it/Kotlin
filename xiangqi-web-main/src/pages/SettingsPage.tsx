import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Cropper, { Area } from 'react-easy-crop';
import { subscribeToPush } from '../net/push';
import { logger } from '../utils/logger';
import { useAuth } from '../auth/AuthContext';
import { apiGet, apiPost, apiDelete, apiPatch } from '../api';
import { useToast } from '../components/ui/Toast';
import getCroppedImg from '../utils/cropImage';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { Confirm } from '../components/ui/Dialog';

import { DashboardHeader } from '../components/settings/DashboardHeader';
import { AchievementSection } from '../components/settings/AchievementSection';
import { InventorySection } from '../components/settings/InventorySection';
import { UserContentSection } from '../components/settings/UserContentSection';
import { RecentGamesSection } from '../components/settings/RecentGamesSection';
import { ProfileEditForm } from '../components/settings/ProfileEditForm';
import { PasswordChangeForm } from '../components/settings/PasswordChangeForm';
import { NotificationSettings } from '../components/settings/NotificationSettings';

type MyStats = {
  ok: true;
  user: { uid: string; name?: string; picture?: string | null };
  elo: number;
  gamesPlayed: number;
  followersCount?: number;
  followingCount?: number;
  inventory?: Record<string, number>;
};

type GameRow = {
  gameId: string;
  roomId?: string;
  timeMode?: string;
  status: string;
  finished: boolean;
  winner: 'red' | 'black' | null;
  players?: { redName?: string; blackName?: string; red?: { name?: string }; black?: { name?: string } };
  thumbBoard?: any;
  thumbPosition?: string[];
  board?: any;
  position?: string[];
};

type TournamentResult = {
  id: string;
  name: string;
  rank: number | null;
  points: number;
};

export function SettingsPage() {
  const { t } = useTranslation();
  const { state: authState, refresh } = useAuth();
  const { success, error: errorNotify } = useToast();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'account'>('dashboard');

  // Dashboard Data State
  const [stats, setStats] = useState<MyStats | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);
  const [likedPuzzles, setLikedPuzzles] = useState<any[]>([]);
  const [myPuzzles, setMyPuzzles] = useState<any[]>([]);
  const [likedGames, setLikedGames] = useState<GameRow[]>([]);
  const [tourResults, setTourResults] = useState<TournamentResult[]>([]);
  const [shopGifts, setShopGifts] = useState<Record<string, { id: string; name: string; icon: string }>>({});
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [puzzleToDelete, setPuzzleToDelete] = useState<any | null>(null);

  // Profile Edit State
  const [name, setName] = useState(authState.user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Avatar State
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security & Notification State
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [autoScroll, setAutoScroll] = useState(localStorage.getItem('xq:disable_auto_scroll') !== 'true');
  const [pieceStyle, setPieceStyle] = useState(localStorage.getItem('xq:piece_style') || 'traditional');
  const [voicePack, setVoicePack] = useState(localStorage.getItem('xq:voice_pack') || 'vi');

  useEffect(() => {
    if (authState.status === 'anon') navigate('/login');
  }, [authState.status, navigate]);

  useEffect(() => {
    if ('Notification' in window) setPushStatus(Notification.permission);
  }, []);

  useEffect(() => {
    if (authState.user?.name) setName(authState.user.name);
  }, [authState.user?.name]);

  // Fetch Dashboard Data
  useEffect(() => {
    if (authState.status !== 'auth' || !authState.user?.uid) return;
    setLoadingDashboard(true);
    const uid = authState.user.uid;

    Promise.allSettled([
      apiGet(`/users/${uid}/summary`, authState.token),
      apiGet(`/users/${uid}/games?limit=12`, authState.token),
      apiGet(`/tournaments/users/${uid}/tournaments`, authState.token),
      apiGet('/gifts/list', authState.token),
      apiGet('/setups/likes/mine', authState.token),
      apiGet('/games/likes/mine', authState.token),
      apiGet(`/setups/public?creatorUid=${uid}&limit=50`, authState.token)
    ]).then(([sum, gms, tours, gfts, pLks, gLks, myPz]) => {
      if (sum.status === 'fulfilled' && sum.value.ok) setStats(sum.value as MyStats);
      if (gms.status === 'fulfilled' && gms.value.ok) setGames(gms.value.games || []);
      if (tours.status === 'fulfilled' && tours.value.ok) setTourResults(tours.value.tournaments || []);
      if (gfts.status === 'fulfilled' && gfts.value.ok) setShopGifts(gfts.value.gifts || {});
      
      if (pLks.status === 'fulfilled' && pLks.value.ok && pLks.value.likes?.length > 0) {
        apiGet<{ ok: boolean, setups: any[] }>(`/setups/public?ids=${pLks.value.likes.join(',')}`, authState.token)
          .then(res => { if (res?.ok) setLikedPuzzles(res.setups); });
      }
      if (gLks.status === 'fulfilled' && gLks.value.ok && gLks.value.likes?.length > 0) {
        apiGet<{ ok: boolean, games: any[] }>(`/games?ids=${gLks.value.likes.join(',')}`, authState.token)
          .then(res => { if (res?.ok) setLikedGames(res.games); });
      }
      if (myPz.status === 'fulfilled' && myPz.value.ok) setMyPuzzles(myPz.value.setups || []);
      setLoadingDashboard(false);
    });
  }, [authState.status, authState.user?.uid, authState.token]);

  const handleTogglePush = async () => {
    try {
      if (pushStatus === 'granted') return;
      const res = await subscribeToPush();
      if (res?.ok) { 
        setPushStatus('granted'); 
        success(t('settings.notificationsEnabled')); 
      }
    } catch (e) { 
      logger.error('Setting push failed', e); 
      errorNotify(t('settings.notificationsError')); 
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || updatingProfile) return;
    setUpdatingProfile(true);
    try {
      const res = await apiPost('/profile', { name: name.trim() }, authState.token);
      if (res.ok) { 
        success(t('settings.updateNameSuccess')); 
        refresh(); 
      }
      else errorNotify(res.error || t('common.error'));
    } catch (err) { 
      logger.debug('handleUpdateProfile failed', err); 
      errorNotify(t('common.error')); 
    }
    finally { setUpdatingProfile(false); }
  };

  const onCropComplete = useCallback((_area: Area, pixels: Area) => { setCroppedAreaPixels(pixels); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { setImage(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!image || !croppedAreaPixels) return;
    setUploadingAvatar(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      if (!croppedBlob) throw new Error('CROP_FAILED');
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');
      const headers: Record<string, string> = {};
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/upload`, {
        method: 'POST', headers, body: formData, credentials: 'include',
      });
      const uploadData = await uploadRes.json();
      if (uploadData.location) {
        let finalPath = uploadData.location;
        if (finalPath.startsWith('/uploads/') && !finalPath.startsWith('/api/')) {
           finalPath = `/api${finalPath}`;
        }
        
        const updateRes = await apiPost('/profile', { picture: finalPath }, authState.token);
        if (updateRes.ok) { 
          success(t('settings.updateAvatarSuccess')); 
          refresh(); 
          setShowCropper(false); 
          setImage(null); 
        }
        else errorNotify(t('common.error'));
      } else errorNotify(uploadData.error || t('common.error'));
    } catch (err) { 
      logger.debug('handleUploadAvatar failed', err); 
      errorNotify(t('common.error')); 
    }
    finally { setUploadingAvatar(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { 
      errorNotify(t('auth.passwordsNotMatch')); // Assuming common auth keys exist or added
      return; 
    }
    if (newPassword.length < 6) { 
      errorNotify(t('auth.passwordTooShort')); 
      return; 
    }
    setUpdatingPassword(true);
    try {
      const res = await apiPost('/auth/password', { oldPassword, newPassword }, authState.token);
      if (res.ok) { 
        success(t('settings.changePasswordSuccess')); 
        setOldPassword(''); 
        setNewPassword(''); 
        setConfirmPassword(''); 
      }
      else errorNotify(res.error === 'INVALID_OLD_PASSWORD' ? t('auth.invalidOldPassword') : t('common.error'));
    } catch (err) { 
      logger.debug('handleChangePassword failed', err); 
      errorNotify(t('common.error')); 
    }
    finally { setUpdatingPassword(false); }
  };
  
  const handleDeletePuzzle = async () => {
    if (!puzzleToDelete) return;
    try {
      const res = await apiDelete(`/setups/${puzzleToDelete.id}`, authState.token);
      if (res.ok) { 
        success(t('settings.deletePuzzleSuccess')); 
        setMyPuzzles(prev => prev.filter(p => p.id !== puzzleToDelete.id)); 
      }
      else errorNotify(res.error || t('common.error'));
    } catch (e) { 
      logger.debug('handleDeletePuzzle failed', e); 
      errorNotify(t('common.error')); 
    }
    finally { setPuzzleToDelete(null); }
  };

  const [notificationSettings, setNotificationSettings] = useState({ roomInvitations: true });

  useEffect(() => {
    if (stats?.user && (stats.user as any).notificationSettings) {
      setNotificationSettings((stats.user as any).notificationSettings);
    }
  }, [stats]);

  const handleUpdateNotificationSettings = async (next: typeof notificationSettings) => {
    try {
      setNotificationSettings(next);
      const res = await apiPatch('/profile/settings', { notificationSettings: next }, authState.token);
      if (res.ok) success(t('common.saveSuccess') || 'Success');
      else errorNotify(t('common.error'));
    } catch (e) {
      errorNotify(t('common.error'));
    }
  };

  const resultLabel = (g: GameRow) => {
    if (!g.finished) return { text: t('profile.game.active'), color: 'text-emerald-400' };
    if (!g.winner) return { text: t('common.draw'), color: 'text-slate-600 dark:text-white/50' };
    return g.winner === 'red' ? { text: t('profile.game.redWin'), color: 'text-red-400' } : { text: t('profile.game.blackWin'), color: 'text-slate-800 dark:text-white/70' };
  };

  const isLocalUser = authState.user?.provider === 'local';

  return (
    <div className={`max-w-[1600px] mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-700 ${loadingDashboard ? 'opacity-50 pointer-events-none' : ''}`}>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/5 dark:border-white/5 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings.title')}</h1>
          <p className="text-sm font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">
            {activeTab === 'dashboard' ? t('settings.overview') : t('settings.customize')}
          </p>
        </div>
        <div className="flex p-1.5 bg-white/[0.03] rounded-[2rem] border border-black/5 dark:border-white/5 backdrop-blur-md">
          <button onClick={() => setActiveTab('dashboard')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-xl shadow-blue-600/20' : 'text-slate-600 dark:text-white/40 hover:text-slate-600 dark:text-white/60'}`}>🏠 {t('settings.dashboard')}</button>
          <button onClick={() => setActiveTab('account')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'account' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-xl shadow-blue-600/20' : 'text-slate-600 dark:text-white/40 hover:text-slate-600 dark:text-white/60'}`}>⚙️ {t('settings.account')}</button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
          <DashboardHeader user={authState.user as any} stats={stats} settings={settings} />
          <AchievementSection tourResults={tourResults} />
          <InventorySection stats={stats} shopGifts={shopGifts} />
          <UserContentSection 
            myPuzzles={myPuzzles} likedPuzzles={likedPuzzles} likedGames={likedGames}
            onEditPuzzle={(id) => navigate(`/xep-co-the?id=${id}`)}
            onDeletePuzzle={setPuzzleToDelete}
            resultLabel={resultLabel}
          />
          <RecentGamesSection games={games} resultLabel={resultLabel} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <ProfileEditForm 
              user={authState.user} name={name} setName={setName} 
              onUpdate={handleUpdateProfile} onFileChange={handleFileChange}
              updatingProfile={updatingProfile} fileInputRef={fileInputRef}
            />
            {isLocalUser && (
              <PasswordChangeForm 
                oldPassword={oldPassword} setOldPassword={setOldPassword}
                newPassword={newPassword} setNewPassword={setNewPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                onUpdate={handleChangePassword} updatingPassword={updatingPassword}
              />
            )}
          </div>
          <div className="space-y-8">
            <NotificationSettings 
              pushStatus={pushStatus} 
              onTogglePush={handleTogglePush} 
              settings={notificationSettings}
              onUpdateSettings={handleUpdateNotificationSettings}
            />
            <div className="rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-8 shadow-2xl space-y-6 relative overflow-hidden group">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-3xl">🧩</div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('settings.boardInterface')}</h3>
                  <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed font-medium">{t('settings.boardInterfaceDesc')}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('settings.autoScroll')}</div>
                    <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase">{t('settings.autoScrollDesc')}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const next = !autoScroll;
                      setAutoScroll(next);
                      localStorage.setItem('xq:disable_auto_scroll', String(!next));
                      success(t('settings.autoScrollSuccess'));
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${autoScroll ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoScroll ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('settings.pieceStyle')}</div>
                    <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase">{t('settings.pieceStyleDesc')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['traditional', 'international', 'simple'].map(s => (
                      <button 
                        key={s}
                        onClick={() => {
                          setPieceStyle(s);
                          localStorage.setItem('xq:piece_style', s);
                          success(t('common.saveSuccess'));
                        }}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${pieceStyle === s ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/30 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                      >
                        {t(`settings.pieceStyles.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('settings.voicePack')}</div>
                    <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase">{t('settings.voicePackDesc')}</p>
                  </div>
                  <select 
                    value={voicePack}
                    onChange={(e) => {
                      const v = e.target.value;
                      setVoicePack(v);
                      localStorage.setItem('xq:voice_pack', v);
                      success(t('common.saveSuccess'));
                    }}
                    className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer"
                  >
                    <option value="vi">{t('settings.voicePacks.vi')}</option>
                    <option value="en">{t('settings.voicePacks.en')}</option>
                    <option value="zh">{t('settings.voicePacks.zh')}</option>
                    <option value="ja">{t('settings.voicePacks.ja')}</option>
                    <option value="none">{t('settings.voicePacks.none')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Confirm 
        isOpen={!!puzzleToDelete} 
        onClose={() => setPuzzleToDelete(null)} 
        onConfirm={handleDeletePuzzle} 
        title={t('settings.deletePuzzleTitle')} 
        message={t('settings.deletePuzzleConfirm', { name: puzzleToDelete?.name })} 
        variant="danger" 
        confirmLabel={t('settings.deletePuzzleAction')} 
      />

      {showCropper && image && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-[#0B0F19] border border-black/10 dark:border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl scale-in-center">
              <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings.cropAvatar')}</h3>
                 <button onClick={() => setShowCropper(false)} className="text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white text-2xl">×</button>
              </div>
              <div className="relative h-[400px] w-full bg-white/90 dark:bg-black/40"><Cropper image={image} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={false} /></div>
              <div className="p-8 space-y-8">
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-white/40 uppercase"><span>{t('settings.zoom')}</span><span>{Math.round(zoom * 100)}%</span></div>
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={e => setZoom(Number(e.target.value))} className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full appearance-none accent-blue-500" />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setShowCropper(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 font-black text-xs uppercase">{t('common.cancel')}</button>
                    <button onClick={handleUploadAvatar} disabled={uploadingAvatar} className="flex-1 py-4 rounded-2xl bg-blue-600 text-slate-900 dark:text-white font-black text-xs uppercase shadow-xl">{uploadingAvatar ? '...' : t('settings.saveImage')}</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

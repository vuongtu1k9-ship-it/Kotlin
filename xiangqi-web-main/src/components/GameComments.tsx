import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useTranslation, Trans } from 'react-i18next';
import { API_URL } from '../auth/auth';
import { getSocket } from '../net/socket';

type GameComment = {
  _id?: string;
  uid: string;
  name: string;
  picture: string | null;
  text: string;
  createdAt: number;
};

type GameCommentsProps = {
  gameId: string;
  playerUids?: { red: string | null; black: string | null } | null;
  type?: 'game' | 'puzzle';
};

function getRelTime(ms: number, t: any, language: string) {
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return t('comments.reltime.justNow');
  if (diff < 3600) return t('comments.reltime.minutes', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('comments.reltime.hours', { count: Math.floor(diff / 3600) });
  return new Date(ms).toLocaleDateString(language);
}

export function GameComments({ gameId, playerUids, type = 'game' }: GameCommentsProps) {
  const { t, i18n } = useTranslation();
  const { state: auth } = useAuth();
  const currentUid = auth.user?.uid ?? null;

  const titleKey = type === 'puzzle' ? 'comments.titlePuzzle' : 'comments.titleDefault';
  const placeholderKey = type === 'puzzle' ? 'comments.placeholderPuzzle' : 'comments.placeholderDefault';

  const [comments, setComments] = useState<GameComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const commentsWrapRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(false);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (!gameId) return;
    
    // Load initial comments
    void apiGet<{ ok: boolean; comments?: GameComment[] }>(`/games/${encodeURIComponent(gameId)}/comments`)
      .then((r) => { 
        if (r?.ok && r.comments) {
          setComments(r.comments);
        }
      });
      
    // Listen for real-time comments
    const socket = getSocket();
    const handleNewComment = (payload: { gameId: string, comment: GameComment }) => {
      if (payload.gameId === gameId) {
        setComments((prev) => {
          // Prevent duplicates if we just sent it ourselves
          if (prev.some(c => c._id === payload.comment._id)) return prev;
          return [...prev, payload.comment];
        });
      }
    };
    
    socket.on('game_comment', handleNewComment);
    
    return () => {
      socket.off('game_comment', handleNewComment);
    };
  }, [gameId]);
  
  // Auto-scroll comments only when user is already near bottom.
  useEffect(() => {
    const el = commentsWrapRef.current;
    if (!el) return;

    if (firstLoadRef.current) {
      if (comments.length > 0) {
        firstLoadRef.current = false;
      }
      return;
    }

    // Autoscroll disabled per user request
    // if (!shouldStickToBottomRef.current) return;
    // el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [comments.length]);

  const handleComment = async () => {
    if (!commentText.trim() || !currentUid || !gameId) return;
    setCommentSending(true);
    const textToSend = commentText;
    setCommentText(''); // optimistic clear
    
    const r = await apiPost(`/games/${encodeURIComponent(gameId)}/comments`, { text: textToSend.trim() }, auth.token);
    if ((r as any).ok) {
      const newComment = (r as any).comment as GameComment;
      setComments((prev) => {
        if (prev.some(c => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
    } else {
      // Revert if failed
      setCommentText(textToSend);
    }
    setCommentSending(false);
  };

  const handleDelete = async (cid: string) => {
    if (!gameId || !cid || !confirm(t('comments.deleteMsg'))) return;
    try {
      const res = await fetch(`${API_URL}/admin/comments/game/${cid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` },
        credentials: 'include'
      });
      if ((await res.json()).ok) {
        setComments(prev => prev.filter(c => c._id !== cid));
      }
    } catch (e) {
      void e;
    }
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 pb-16 mt-4 pointer-events-auto">
      <div className="flex items-center gap-4 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 flex items-center gap-2">
          <span className="text-base">💬</span> {t(titleKey)} <span className="text-slate-400 dark:text-white/40">({comments.length})</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      <div
        ref={commentsWrapRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          shouldStickToBottomRef.current = distanceFromBottom < 40;
        }}
        className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
      >
        {comments.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-white/60 italic bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm dark:shadow-inner">
            {t('comments.emptyStateFirst')} {t('comments.emptyStateSecond')}
          </div>
        )}
        {comments.map((c, i) => {
          const isRedPlayer = playerUids?.red === c.uid;
          const isBlackPlayer = playerUids?.black === c.uid;

          return (
            <div key={c._id || i} className="flex gap-3 group">
              <div className={`shrink-0 w-10 h-10 rounded-[14px] overflow-hidden border shadow-inner ${isRedPlayer ? 'border-red-500/50 bg-red-500/10' : isBlackPlayer ? 'border-white/50 bg-slate-200 dark:bg-white/10' : 'border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40'}`}>
                {c.picture
                  ? <img src={c.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={c.name} />
                  : <div className={`w-full h-full flex items-center justify-center text-base font-black ${isRedPlayer ? 'text-red-400' : isBlackPlayer ? 'text-slate-800 dark:text-white/80' : 'text-slate-400 dark:text-white/60'}`}>{(c.name || '?')[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${isRedPlayer ? 'text-red-400' : isBlackPlayer ? 'text-slate-800 dark:text-white/90' : 'text-slate-600 dark:text-white/60'}`}>{c.name}</span>
                  {isRedPlayer && <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">{t('comments.redPlayer')}</span>}
                  {isBlackPlayer && <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-black/20 dark:bg-white/20 text-slate-900 dark:text-white border border-white/30">{t('comments.blackPlayer')}</span>}
                  <span className="text-[10px] text-slate-400 dark:text-white/40 group-hover:text-slate-600 dark:text-white/70 transition-colors">{getRelTime(c.createdAt, t, i18n.language)}</span>
                </div>
                <div className={`text-sm leading-[1.6] whitespace-pre-wrap break-words rounded-[20px] rounded-tl-md px-4 py-3 border shadow-sm relative ${isRedPlayer ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-500/5 dark:border-red-500/20 dark:text-red-50' : isBlackPlayer ? 'bg-slate-100 dark:bg-white/5 border-black/20 dark:border-white/20 text-slate-800 dark:text-white/90' : 'bg-white/90 dark:bg-black/40 border-black/5 dark:border-white/5 text-slate-800 dark:text-white/70 backdrop-blur-md'}`}>
                  {c.text}
                  {(auth.user?.sysRole === 'admin' || auth.user?.sysRole === 'moderator') && (
                    <button
                      onClick={() => c._id && handleDelete(c._id)}
                      className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-red-600 text-slate-900 dark:text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500 z-10"
                      title={t('comments.deleteTooltip')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={commentsEndRef} />
      </div>

      {currentUid ? (
        <div className="flex gap-3 mt-2 items-start shrink-0">
          <div className="shrink-0 w-10 h-10 rounded-[14px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base text-blue-400 font-black shadow-inner">
            {(auth.user?.name || '?')[0]}
          </div>
          <div className="flex-1 relative group">
            <textarea
              value={commentText} onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              placeholder={t(placeholderKey)} rows={2} maxLength={2000}
              className="w-full rounded-[24px] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-md px-5 py-3.5 pr-20 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/[0.02] transition-all resize-none shadow-sm dark:shadow-inner"
            />
            <button onClick={handleComment} disabled={commentSending || !commentText.trim()}
              className="absolute right-2 bottom-2 h-10 px-5 rounded-2xl bg-blue-600 text-slate-900 dark:text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-md active:scale-95">
              {commentSending ? t('comments.sending') : t('common.send')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-slate-600 dark:text-white/70 py-6 mt-2 rounded-3xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] backdrop-blur-sm shadow-sm dark:shadow-inner shrink-0">
          <Trans i18nKey="comments.loginPrompt">
            Bạn cần <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">Đăng nhập</Link> để tham gia thảo luận
          </Trans>
        </div>
      )}
    </div>
  );
}

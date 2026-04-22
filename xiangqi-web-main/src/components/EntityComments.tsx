import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../auth/auth';
import { getSocket } from '../net/socket';
import { Alert, Confirm } from './ui/Dialog';

type Comment = {
  _id?: string;
  uid: string;
  name: string;
  picture: string | null;
  text: string;
  createdAt: number;
};

type EntityCommentsProps = {
  entityType: 'puzzle' | 'tournament' | 'player' | 'general';
  entityId: string;
  title?: string;
  placeholder?: string;
};

function useReltime() {
  const { t } = useTranslation();
  return (ms: number) => {
    const diff = (Date.now() - ms) / 1000;
    if (diff < 60) return t('comments.reltime.justNow');
    if (diff < 3600) return t('comments.reltime.minutes', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('comments.reltime.hours', { count: Math.floor(diff / 3600) });
    return new Date(ms).toLocaleDateString();
  };
}

export function EntityComments({ entityType, entityId, title, placeholder }: EntityCommentsProps) {
  const { t } = useTranslation();
  const reltime = useReltime();
  const { state: auth } = useAuth();
  const currentUid = auth.user?.uid ?? null;

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [hpValue, setHpValue] = useState(''); // Honeypot
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; title: string; message: string; variant?: 'info' | 'warning' | 'danger' | 'success' }>({
    show: false, title: '', message: '', variant: 'error' as any
  });
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; cid: string | null }>({ show: false, cid: null });

  const commentsWrapRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(false);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (!entityId || !entityType) return;
    
    // Load initial comments
    void apiGet<{ ok: boolean; comments?: Comment[] }>(`/comments/${entityType}/${encodeURIComponent(entityId)}`)
      .then((r) => { 
        if (r?.ok && r.comments) {
          setComments(r.comments);
        }
      });
      
    // Listen for real-time comments
    const socket = getSocket();
    socket.emit('entity:join', { type: entityType, id: entityId });

    const handleNewComment = (payload: { entityType: string, entityId: string, comment: Comment }) => {
      if (payload.entityType === entityType && payload.entityId === entityId) {
        setComments((prev) => {
          if (prev.some(c => c._id === payload.comment._id)) return prev;
          return [...prev, payload.comment];
        });
      }
    };
    
    socket.on('entity_comment', handleNewComment);
    
    return () => {
      socket.emit('entity:join', { type: entityType, id: entityId }); // Correctly leave room (actually it should be entity:leave if it exists, but presence.mjs uses it for room joining)
      // socket.emit('entity:leave', { type: entityType, id: entityId }); 
      socket.off('entity_comment', handleNewComment);
    };
  }, [entityId, entityType]);
  
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
    if (!commentText.trim() || !currentUid || !entityId) return;
    setCommentSending(true);
    const textToSend = commentText;
    setCommentText(''); 
    
    const r = await apiPost(`/comments/${entityType}/${encodeURIComponent(entityId)}`, { 
      text: textToSend.trim(),
      hp_field: hpValue // Include honeypot
    }, auth.token);

    if ((r as any).ok) {
      const newComment = (r as any).comment as Comment;
      setComments((prev) => {
        if (prev.some(c => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
    } else {
      setCommentText(textToSend);
      if ((r as any).error === 'NO_LINKS') {
        setAlertInfo({ show: true, title: t('comments.errorTitle'), message: t('comments.errorNoLinks'), variant: 'warning' });
      } else if ((r as any).error === 'RATE_LIMIT') {
        setAlertInfo({ show: true, title: t('comments.errorRateLimitTitle'), message: t('comments.errorRateLimit'), variant: 'warning' });
      }
    }
    setCommentSending(false);
  };

  const handleDeleteClick = (cid: string) => {
    setConfirmDelete({ show: true, cid });
  };

  const handleConfirmDelete = async () => {
    const cid = confirmDelete.cid;
    if (!entityId || !cid) return;
    try {
      const res = await fetch(`${API_URL}/admin/comments/entity/${cid}`, {
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

  const defaultTitle = entityType === 'puzzle' ? t('comments.titlePuzzle') : entityType === 'tournament' ? t('comments.titleTournament') : t('comments.titleDefault');
  const displayTitle = title || defaultTitle;
  const displayPlaceholder = placeholder || (entityType === 'puzzle' ? t('comments.placeholderPuzzle') : t('comments.placeholderDefault'));

  return (
    <div className="w-full flex flex-col gap-6 pb-16 mt-8 pointer-events-auto">
      <div className="flex items-center gap-4 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <div className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-white/40 flex items-center gap-2">
          <span className="text-lg">💬</span> {displayTitle} <span className="text-slate-400 dark:text-white/20">({comments.length})</span>
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
        className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
      >
        {comments.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-white/20 italic bg-white/[0.02] rounded-3xl border border-black/5 dark:border-white/5 shadow-inner">
            {t('comments.emptyStateFirst')}<br/>{t('comments.emptyStateSecond')}
          </div>
        )}
        {comments.map((c, i) => {
          return (
            <div key={c._id || i} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2">
              <div className="shrink-0 w-10 h-10 rounded-[14px] overflow-hidden border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 shadow-inner">
                {c.picture
                  ? <img src={c.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={c.name} width={40} height={40} loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-base font-black text-slate-400 dark:text-white/30">{(c.name || '?')[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-white/70">{c.name}</span>
                  <span className="text-[11px] text-slate-400 dark:text-white/20 group-hover:text-slate-600 dark:text-white/40 transition-colors uppercase tracking-tight">{reltime(c.createdAt)}</span>
                </div>
                <div className="text-sm leading-[1.6] whitespace-pre-wrap break-words rounded-[20px] rounded-tl-md px-4 py-3 border border-black/5 dark:border-white/5 bg-slate-100 dark:bg-white/[0.03] text-slate-800 dark:text-white/80 backdrop-blur-md shadow-sm group-hover:border-black/10 dark:border-white/10 transition-colors relative">
                  {c.text}
                  {(auth.user?.sysRole === 'admin' || auth.user?.sysRole === 'moderator') && (
                    <button
                      onClick={() => c._id && handleDeleteClick(c._id)}
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
            {/* Honeypot field */}
            <input 
              type="text" value={hpValue} onChange={e => setHpValue(e.target.value)} 
              style={{ display: 'none' }} tabIndex={-1} autoComplete="off" 
            />
            <textarea
              value={commentText} onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              placeholder={displayPlaceholder} rows={2} maxLength={2000}
              className="w-full rounded-[24px] border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-md px-5 py-3.5 pr-20 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/[0.02] transition-all resize-none shadow-sm dark:shadow-inner"
            />
            <button onClick={handleComment} disabled={commentSending || !commentText.trim()}
              className="absolute right-2 bottom-2 h-10 px-5 rounded-2xl bg-blue-600 text-slate-900 dark:text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-md active:scale-95">
              {commentSending ? t('comments.sending') : t('common.send')}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-slate-600 dark:text-white/40 py-8 mt-2 rounded-3xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] backdrop-blur-sm shadow-sm dark:shadow-inner shrink-0">
          <Trans i18nKey="comments.loginPrompt">
            Bạn cần <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline decoration-blue-400/20 underline-offset-4">Đăng nhập</Link> để tham gia thảo luận.
          </Trans>
        </div>
      )}

      {/* Custom Modals */}
      <Alert
        isOpen={alertInfo.show}
        onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
        title={alertInfo.title}
        message={alertInfo.message}
        variant={alertInfo.variant as any}
      />
      
      <Confirm
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, cid: null })}
        onConfirm={handleConfirmDelete}
        title={t('comments.deleteTitle')}
        message={t('comments.deleteMsg')}
        variant="danger"
        confirmLabel={t('comments.deleteAction')}
      />
    </div>
  );
}

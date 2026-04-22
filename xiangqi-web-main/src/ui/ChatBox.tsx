import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '../net/socket';
import { onChatMessage, sendChat } from '../net/chat';

export function ChatBox({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    setItems([]);
    setErr('');
    if (!roomId) return;
    return onChatMessage((m) => {
      if (m.roomId !== roomId) return;
      setItems((prev) => prev.concat(m).slice(-100));
    });
  }, [roomId]);

  useEffect(() => {
    // Autoscroll disabled per user request
    // const el = listRef.current;
    // if (!el || !shouldStickToBottomRef.current) return;
    // el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [items.length]);

  const submit = async () => {
    setErr('');
    const msg = text.trim();
    if (!msg) return;
    setText('');
    const ack = await sendChat(roomId, msg);
    if (!(ack as any)?.ok) setErr((ack as any)?.error || 'SEND_FAILED');
  };

  return (
    <div className="mt-3 w-full max-w-[min(540px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20">
      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-3 py-2">
        <div className="text-sm font-extrabold text-white/85">{t('chat.title')}</div>
        {err && <div className="text-xs text-rose-300">{err}</div>}
      </div>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          shouldStickToBottomRef.current = distanceFromBottom < 24;
        }}
        className="max-h-44 overflow-auto px-3 py-2 text-sm"
      >
        {items.length === 0 ? (
          <div className="text-slate-600 dark:text-white/50">{t('chat.noMessages')}</div>
        ) : (
          items.map((m, i) => (
            <div key={`${m.createdAt}-${m.senderUid || m.senderName}-${i}`} className="mb-1">
              <span className="text-slate-600 dark:text-white/60">{m.senderName}: </span>
              <span className="text-white/85">{m.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-black/10 dark:border-white/10 px-3 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          className="h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-black/20 px-3 text-sm text-white/85 outline-none focus:ring-2 focus:ring-xq-accent/30"
          placeholder={t('chat.placeholder')}
        />
        <button
          type="button"
          onClick={() => void submit()}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-xq-gold px-3 text-xs font-extrabold text-black hover:opacity-90"
        >
          {t('common.send')}
        </button>
      </div>
    </div>
  );
}

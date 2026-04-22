import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../net/socket';
import { sendChat, onChatMessage } from '../net/chat';
import { logger } from '../utils/logger';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '../net/socket';

interface ChatProps {
  roomId: string;
  className?: string;
  hideHeader?: boolean;
  autoScroll?: boolean;
}

export function Chat({ 
  roomId, 
  className = '', 
  hideHeader = false,
  autoScroll = true
}: ChatProps) {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [playerUids, setPlayerUids] = useState<{ red: string | null; black: string | null }>({ red: null, black: null });
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();
    
    // Handle history - server now sends { roomId, messages } to avoid cross-tab contamination
    const handleHistory = (payload: ChatMessage[] | { roomId: string; messages: ChatMessage[] }) => {
      let history: ChatMessage[];
      if (Array.isArray(payload)) {
        // Legacy format
        history = payload;
        if (history.length > 0 && history[0].roomId !== roomId && history[0].roomId) return;
      } else {
        // New tagged format - only accept if it matches our subscribed roomId
        if (payload.roomId !== roomId) return;
        history = payload.messages;
      }
      setMessages(history);
    };

    const handlePlayers = (p: any) => {
      if (p.roomId === roomId && p.playerUids) {
        setPlayerUids(p.playerUids);
      }
    };

    socket.on('chat:history', handleHistory);
    socket.on('room:players', handlePlayers);
    socket.emit('chat:join', { roomId });

    // Handle new messages
    const removeListener = onChatMessage((msg: ChatMessage) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    
    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('room:players', handlePlayers);
      removeListener();
    };
  }, [roomId]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    
    setText('');
    const res = await sendChat(roomId, t);
    if (res.ok === false) {
      logger.error('Chat failed:', res.error);
    }
  };



  const handleUserClick = (user: { uid: string; name: string; picture?: string | null }) => {
    if (!user.uid || user.uid === authState.user?.uid) return;
    window.dispatchEvent(new CustomEvent('open-user-profile', { 
      detail: { 
        uid: user.uid
      } 
    }));
  };

  const isGuest = !authState.user || authState.user.provider === 'guest';

  return (
    <div className={`flex flex-col h-full bg-slate-100 dark:bg-slate-900 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="px-4 py-2 bg-slate-200 dark:bg-white/10 border-b border-black/10 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-white/70">
          {t('chat.title')}
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center text-slate-400 dark:text-white/30 text-xs py-10 italic">
            {t('chat.noMessagesWelcome')}
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.senderUid === authState.user?.uid;
          const isRed = m.senderUid === playerUids.red;
          const isBlack = m.senderUid === playerUids.black;
          const isPlayer = isRed || isBlack;
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start animate-in fade-in slide-in-from-left-2 duration-200'}`}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isMe && m.senderPicture && (
                  <img 
                    src={m.senderPicture} 
                    alt={m.senderName || ""} 
                    onClick={() => handleUserClick({ uid: m.senderUid!, name: m.senderName!, picture: m.senderPicture })}
                    className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity" 
                    referrerPolicy="no-referrer" 
                  />
                )}
                <span 
                  onClick={() => !isMe && handleUserClick({ uid: m.senderUid!, name: m.senderName!, picture: m.senderPicture })}
                  className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 transition-colors ${
                  isRed ? 'text-red-400' : isBlack ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/40'
                } ${!isMe ? 'cursor-pointer hover:text-xq-accent' : ''}`}>
                  {isMe ? t('common.you') : m.senderName}
                  {isPlayer && (
                    <span className={`text-[8px] px-1 rounded ${isRed ? 'bg-red-500/20 text-red-300' : 'bg-black/20 dark:bg-white/20 text-slate-900 dark:text-white'}`}>
                      {t('chat.player')}
                    </span>
                  )}
                </span>
              </div>
              
              {m.type === 'new_follower' ? (
                <div className={`w-full flex justify-center py-2`}>
                  <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] text-slate-600 dark:text-white/50 uppercase tracking-widest font-bold">
                    {isMe ? t('chat.followed') : t('chat.wasFollowed')}
                  </div>
                </div>
              ) : (
                <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-sm break-words transition-all ${
                  isMe 
                    ? 'bg-blue-600 text-slate-900 dark:text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                    : (isPlayer ? 'bg-black/20 dark:bg-white/20 border border-black/20 dark:border-white/20 text-slate-900 dark:text-white rounded-tl-none shadow-lg shadow-white/5' : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white/90 rounded-tl-none')
                }`}>
                  {m.text}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-200 dark:bg-slate-900/80 border-t border-black/10 dark:border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isGuest ? t('chat.guestPlaceholder') : t('chat.placeholder')}
            disabled={isGuest}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-xq-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={isGuest || !text.trim()}
            className="bg-xq-accent hover:bg-xq-accent/80 disabled:opacity-50 disabled:hover:bg-xq-accent text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed"
          >
            {t('common.send')}
          </button>
        </div>
      </form>
    </div>
  );
}

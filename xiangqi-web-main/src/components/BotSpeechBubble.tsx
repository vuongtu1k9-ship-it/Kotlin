import React, { useEffect, useRef, useState } from 'react';

interface BotSpeechBubbleProps {
  message: string | null;
  personality?: string;
  side: 'red' | 'black'; // which side the bot plays
  humanSide: 'red' | 'black'; // which side the human plays
}

const PERSONALITY_STYLE: Record<string, { border: string; text: string; bg: string; tail: string }> = {
  aggressive: {
    border: 'border-red-500/50',
    text: 'text-red-300',
    bg: 'bg-red-950/80',
    tail: 'border-t-red-950/80',
  },
  defensive: {
    border: 'border-slate-500/40',
    text: 'text-slate-300',
    bg: 'bg-slate-900/90',
    tail: 'border-t-slate-900/90',
  },
  chaotic: {
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    bg: 'bg-purple-950/85',
    tail: 'border-t-purple-950/85',
  },
  steady: {
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    bg: 'bg-blue-950/85',
    tail: 'border-t-blue-950/85',
  },
};

const PERSONALITY_EMOJI: Record<string, string> = {
  aggressive: '😤',
  defensive: '🧘',
  chaotic: '🎭',
  steady: '🏔️',
};

/**
 * Animated speech bubble that appears above the bot's player card.
 * Auto-dismisses after ~6s, supports typing-out animation.
 */
export const BotSpeechBubble: React.FC<BotSpeechBubbleProps> = ({
  message,
  personality = 'steady',
  side,
  humanSide,
}) => {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const style = PERSONALITY_STYLE[personality] || PERSONALITY_STYLE.steady;
  const emoji = PERSONALITY_EMOJI[personality] || '🤖';

  useEffect(() => {
    if (!message) return;

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typingRef.current) clearInterval(typingRef.current);

    setDisplayed('');
    setFadeOut(false);
    setVisible(true);

    // Typing animation
    let i = 0;
    typingRef.current = setInterval(() => {
      i++;
      setDisplayed(message.substring(0, i));
      if (i >= message.length) {
        if (typingRef.current) clearInterval(typingRef.current);
      }
    }, 40);

    // Auto-dismiss after 6s
    timerRef.current = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 500);
    }, 6500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [message]);

  if (!visible || !message) return null;

  // Determine tail direction based on where bot panel sits
  // The bot is always opposite the human side
  const isTop = side !== humanSide; // bot is at the top when human plays red (bot is black)

  return (
    <div
      className={`
        absolute z-50 max-w-[220px] min-w-[120px]
        transition-all duration-500
        ${fadeOut ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100'}
        ${isTop ? 'bottom-full mb-3 right-0' : 'top-full mt-3 right-0'}
      `}
    >
      {/* Bubble */}
      <div
        className={`
          relative px-4 py-2.5 rounded-2xl border backdrop-blur-xl
          ${style.bg} ${style.border} shadow-2xl
        `}
      >
        {/* Emoji badge */}
        <span className="absolute -top-2.5 -left-2.5 text-base bg-black/60 border border-white/10 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
          {emoji}
        </span>

        {/* Message text */}
        <p className={`text-[11px] font-bold leading-snug ${style.text} tracking-tight`}>
          {displayed}
          {displayed.length < message.length && (
            <span className="inline-block w-1.5 h-3 bg-current ml-0.5 animate-pulse rounded-sm opacity-70" />
          )}
        </p>

        {/* Tail arrow */}
        <div
          className={`
            absolute w-0 h-0
            border-l-[6px] border-l-transparent
            border-r-[6px] border-r-transparent
            border-t-[8px]
            ${style.tail}
            ${isTop ? '-bottom-2 right-6' : '-top-2 right-6 rotate-180'}
          `}
        />
      </div>
    </div>
  );
};

import React from 'react';

interface AiThinkingOverlayProps {
  isAiThinking: boolean;
}

export const AiThinkingOverlay: React.FC<AiThinkingOverlayProps> = ({ isAiThinking }) => {
  if (!isAiThinking) return null;
  
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none animate-in fade-in duration-500 rounded-lg">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 bg-indigo-500/20 rounded-full animate-ping" />
        <div className="absolute w-16 h-16 bg-indigo-500/30 rounded-full animate-pulse" />
        <div className="relative bg-white/10 dark:bg-black/40 p-4 rounded-full border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <svg className="animate-bounce h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

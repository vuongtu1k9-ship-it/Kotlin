import React from 'react';
import { useTranslation } from 'react-i18next';
import { SHARE_URLS } from '../constants/social';

interface SocialShareProps {
  url: string;
  title: string;
  className?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({ url, title, className = '' }) => {
  const { t } = useTranslation();

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    // You could trigger a toast here if available
    window.dispatchEvent(new CustomEvent('toast', { 
      detail: { message: t('common.linkCopied'), type: 'success' } 
    }));
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
        {t('common.share')}:
      </span>
      
      <a 
        href={SHARE_URLS.facebook(url)}
        target="_blank"
        rel="noreferrer"
        className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
        title="Share on Facebook"
      >
        <span className="text-sm">f</span>
      </a>

      <button 
        onClick={handleCopy}
        className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/40 hover:bg-xq-gold hover:text-white transition-all"
      >
        {t('common.copyLink')}
      </button>
    </div>
  );
};

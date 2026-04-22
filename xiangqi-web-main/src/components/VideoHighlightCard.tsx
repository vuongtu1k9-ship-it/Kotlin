import { useTranslation } from 'react-i18next';
import { YouTubeEmbed } from './ui/YouTubeEmbed';
import { SOCIAL_LINKS } from '../constants/social';
import { useSiteSettings } from '../hooks/useSiteSettings';

export const VideoHighlightCard: React.FC = () => {
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const videoId = settings['lobby.videoHighlightId'] || '8EyAKlcfQr4';

  return (
    <div className="w-full bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-xl overflow-hidden group transition-all hover:shadow-2xl hover:border-blue-500/20">
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-full md:w-1/2 aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 ring-8 ring-black/5 dark:ring-white/5">
          <YouTubeEmbed videoId={videoId} />
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
             <span className="w-2 h-2 rounded-full bg-red-500" /> {t('lobby.videoHighlight.hot')}
          </div>
          
          <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {t('lobby.videoHighlight.title')}
          </h3>
          
          <p className="text-sm text-slate-500 dark:text-white/50 leading-relaxed font-medium">
            {t('lobby.videoHighlight.description')}
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
            <a 
              href={SOCIAL_LINKS.youtube.channel} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <span className="text-lg">📺</span> {t('lobby.videoHighlight.watchMore')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

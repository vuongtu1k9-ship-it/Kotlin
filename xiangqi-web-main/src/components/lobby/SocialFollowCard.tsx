import React from 'react';
import { useTranslation } from 'react-i18next';
import { SOCIAL_LINKS } from '../../constants/social';

export const SocialFollowCard: React.FC = () => {
  const { t } = useTranslation();

  const socialItems = [
    { 
      name: 'Facebook', 
      label: t('lobby.social.labels.fanpage'), 
      url: SOCIAL_LINKS.facebook.page, 
      icon: 'f', 
      color: 'bg-[#1877F2]', 
      shadow: 'shadow-[#1877F2]/20' 
    },
    { 
      name: 'Facebook Group', 
      label: t('lobby.social.labels.community'), 
      url: SOCIAL_LINKS.facebook.group, 
      icon: '👥', 
      color: 'bg-[#1877F2]', 
      shadow: 'shadow-[#1877F2]/20' 
    },
    { 
      name: 'YouTube', 
      label: t('lobby.social.labels.channel'), 
      url: SOCIAL_LINKS.youtube.channel, 
      icon: '▶', 
      color: 'bg-[#FF0000]', 
      shadow: 'shadow-[#FF0000]/20' 
    },
    { 
      name: 'TikTok', 
      label: t('lobby.social.labels.tiktok', 'TikTok'), 
      url: SOCIAL_LINKS.tiktok.profile, 
      icon: '♪', 
      color: 'bg-[#000000] border border-white/20', 
      shadow: 'shadow-white/5' 
    },
    { 
      name: 'Instagram', 
      label: t('lobby.social.labels.instagram', 'Instagram'), 
      url: SOCIAL_LINKS.instagram.profile, 
      icon: '📷', 
      color: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]', 
      shadow: 'shadow-[#bc1888]/20' 
    },
    { 
      name: 'X', 
      label: t('lobby.social.labels.x', 'X'), 
      url: SOCIAL_LINKS.x.profile, 
      icon: '𝕏', 
      color: 'bg-black border border-white/20', 
      shadow: 'shadow-white/5' 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4 py-2">
      {socialItems.map((item) => (
        <a 
          key={item.name}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className={`group relative overflow-hidden p-4 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 shadow-xl ${item.shadow}`}
        >
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-2xl ${item.color} flex items-center justify-center text-white font-black text-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
              {item.icon}
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50">{item.label}</div>
              <div className="text-[11px] font-black uppercase tracking-tighter text-white group-hover:text-xq-gold">{item.name}</div>
            </div>
          </div>
          
          {/* Subtle background icon */}
          <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity font-black select-none pointer-events-none">
            {item.icon}
          </div>
        </a>
      ))}
    </div>
  );
};

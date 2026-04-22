import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PlayerInfo, resolveStatusBadge } from '../hooks/useOnlinePlayers';
import { getEloRank } from '../utils/eloRanks';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { makeSlug } from '../utils/slug';

interface UserPresenceBundleProps {
  player: Partial<PlayerInfo> & { uid: string; name: string };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showRank?: boolean;
  showStatusLabel?: boolean;
  className?: string;
  linkToProfile?: boolean;
  linkType?: 'page' | 'dialog';
  flipped?: boolean;
  showDot?: boolean;
  dotColor?: string;
  isFollowed?: boolean;
}

export const UserPresenceBundle: React.FC<UserPresenceBundleProps> = React.memo(({
  player,
  size = 'md',
  showRank = true,
  showStatusLabel = true,
  className = "",
  linkToProfile = true,
  linkType = 'dialog',
  flipped = false,
  showDot = true,
  dotColor,
  isFollowed = false
}) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const settings = useSiteSettings();
  const badge = resolveStatusBadge(player as PlayerInfo);
  const rank = getEloRank(player.elo, settings['elo.ranks']);

  // Decouple dot from online status if dotColor is provided
  const effectiveDotColor = dotColor || badge.color.replace('text-', 'bg-');
  const isDotVisible = showDot && (player.online === true || !!dotColor);

  const sizeClasses = {
    xs: { avatar: 'w-6 h-6', text: 'text-[10px]', sub: 'hidden', gap: 'gap-1.5', statusDot: 'w-2 h-2' },
    sm: { avatar: 'w-8 h-8', text: 'text-xs', sub: 'text-[9px]', gap: 'gap-2', statusDot: 'w-2.5 h-2.5' },
    md: { avatar: 'w-10 h-10', text: 'text-sm', sub: 'text-[10px]', gap: 'gap-2.5', statusDot: 'w-3 h-3' },
    lg: { avatar: 'w-14 h-14', text: 'text-lg', sub: 'text-sm', gap: 'gap-3', statusDot: 'w-4 h-4' },
  };

  const currentSize = sizeClasses[size];

  const AvatarWrapper = (linkToProfile && linkType === 'page') ? Link : 'div';
  const avatarProps = (linkToProfile && linkType === 'page') ? { to: `/player/${makeSlug(player.name || '', player.uid)}` } : {};

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!linkToProfile || linkType !== 'dialog') return;
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-user-profile', { detail: { uid: player.uid } }));
  };

  return (
    <div className={`flex items-center ${currentSize.gap} ${flipped ? 'flex-row-reverse text-right' : ''} ${className}`}>
      {/* Avatar with Status Ring */}
      <div className={`relative flex-shrink-0 ${currentSize.avatar}`}>
        <AvatarWrapper
          {...(avatarProps as any)}
          onClick={handleProfileClick}
          className={`block w-full h-full rounded-full overflow-hidden border ${player.customStatus === 'free' ? 'border-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'border-black/10 dark:border-white/10'} shadow-lg relative group/avatar ${linkToProfile ? 'cursor-pointer' : ''}`}
        >
          {(player.picture && !imgError) ? (
            <img
              src={player.picture.includes('/api/avatars/') ? `${player.picture}?s=${{ xs: 48, sm: 48, md: 96, lg: 150 }[size]}` : player.picture}
              className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110"
              alt={player.name || t('game.rankGeneric')}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              width={{ xs: 24, sm: 32, md: 40, lg: 56 }[size]}
              height={{ xs: 24, sm: 32, md: 40, lg: 56 }[size]}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-slate-100 dark:text-white uppercase">
              {player.name?.[0] || '?'}
            </div>
          )}
          {/* Overlay for hover */}
          <div className="absolute inset-0 bg-slate-100 dark:bg-white/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
        </AvatarWrapper>

        {/* Status Indicator Dot */}
        {isDotVisible && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 ${currentSize.statusDot} rounded-full border-2 border-slate-900 shadow-xl ${effectiveDotColor} transition-colors duration-500`}
            title={badge.label}
          />
        )}
      </div>

      {/* Info Bundle */}
      <div className={`flex flex-col min-w-0 flex-1 shrink ${flipped ? 'items-end' : ''}`}>
        <div className={`flex items-center gap-1.5 min-w-0 w-full leading-tight ${flipped ? 'flex-row-reverse' : ''}`}>
          <span
            onClick={handleProfileClick}
            className={`font-bold text-slate-900 dark:text-white truncate min-w-0 flex-1 ${currentSize.text} ${linkToProfile ? 'cursor-pointer hover:text-blue-500 transition-colors' : ''}`}
            title={player.name}
          >
            {player.name}
          </span>
          {isFollowed && <span className="text-rose-500 text-[10px] animate-pulse">❤️</span>}
          {/* Status Label */}
          {showStatusLabel && size !== 'xs' && (
            <span className={`text-[8px] uppercase font-black tracking-tighter ${badge.color} bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded border ${player.customStatus === 'free' ? 'border-emerald-500/50 animate-pulse' : 'border-black/10 dark:border-white/10'} whitespace-nowrap shrink-0`}>
              {badge.label}
            </span>
          )}
        </div>
        {showRank && size !== 'xs' && (
          <div className={`flex items-center gap-1 text-slate-600 dark:text-white/40 leading-none mt-1 w-full ${currentSize.sub} ${flipped ? 'flex-row-reverse' : ''}`}>
            <span className="flex-shrink-0 opacity-80" title={t(rank.title)}>{rank.icon}</span>
            <span className="font-semibold truncate min-w-0 flex-1 opacity-80">{t(rank.title)}</span>
            {/* <span className="h-2 w-[1px] bg-slate-200 dark:bg-white/10 flex-shrink-0 opacity-40 mx-0.5" /> */}
            <span className="font-black text-amber-600 dark:text-amber-400/90 tracking-tighter bg-amber-600/5 dark:bg-amber-400/5 px-1 rounded-sm shrink-0">{player.elo ?? 1200}</span>
          </div>
        )}
      </div>
    </div>
  );
});

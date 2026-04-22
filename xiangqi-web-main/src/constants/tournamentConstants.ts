/**
 * Single Source of Truth for game time controls.
 * Blitz: 5m total, 30s/move
 * Rapid: 15m total, 1m/move
 * Standard: 30m total, 3m/move
 * Slow: 60m total, 5m/move
 */
export const TIME_CONTROL_CONFIG = {
  blitz: {
    label: 'Cờ Chớp',
    icon: '⚡',
    totalMs: 5 * 60 * 1000,
    perMoveMs: 30 * 1000,
    display: '5p | 30s'
  },
  rapid: {
    label: 'Cờ Nhanh',
    icon: '🏃',
    totalMs: 15 * 60 * 1000,
    perMoveMs: 60 * 1000,
    display: '15p | 1p'
  },
  standard: {
    label: 'Tiêu Chuẩn',
    icon: '⏱',
    totalMs: 30 * 60 * 1000,
    perMoveMs: 3 * 60 * 1000,
    display: '30p | 3p'
  },
  slow: {
    label: 'Cờ Dài',
    icon: '🎯',
    totalMs: 60 * 60 * 1000,
    perMoveMs: 5 * 60 * 1000,
    display: '60p | 5p'
  }
} as const;

export type TimeMode = keyof typeof TIME_CONTROL_CONFIG;

export const getTimeControlLabel = (mode: string) => {
  const m = mode as TimeMode;
  if (TIME_CONTROL_CONFIG[m]) {
    return `${TIME_CONTROL_CONFIG[m].icon} ${TIME_CONTROL_CONFIG[m].label} (${TIME_CONTROL_CONFIG[m].display})`;
  }
  return mode;
};

export const TOURNAMENT_FORMATS = {
  swiss: { label: 'Hệ Thụy Sĩ (Swiss)', icon: '🔄' },
  roundrobin: { label: 'Vòng Tròn (Round Robin)', icon: '🔁' },
  single_elimination: { label: 'Loại Trực Tiếp (Single)', icon: '⚔️' },
  double_elimination: { label: 'Loại Trực Tiếp (Double)', icon: '🛡️' },
  arena: { label: 'Đấu Trường (Arena)', icon: '🏟️' }
} as const;

export type TournamentFormat = keyof typeof TOURNAMENT_FORMATS;

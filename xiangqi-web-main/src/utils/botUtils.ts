import { TFunction } from 'i18next';

export interface BotProfile {
  id: string;
  name: string;
  picture: string | null;
  elo: number;
  rank: string | null;
  isBot?: boolean;
}

/**
 * Maps a raw Bot object from the DB/API to a professional PlayerProfile
 * suitable for the BoardHeader and lobby-style display.
 */
export function mapBotToProfile(bot: any, t: TFunction): BotProfile {
  if (!bot) return { id: 'bot', name: t('game.aiPlayer'), picture: null, elo: 1200, rank: null, isBot: true };

  return {
    id: bot.uid || bot._id || 'bot',
    name: bot.name,
    picture: bot.avatar || `/api/avatars/${bot.uid || bot._id}.webp`,
    // Use real ELO and Rank from the database record exclusively
    elo: bot.elo || 1200,
    rank: bot.rank || null,
    isBot: true
  };
}

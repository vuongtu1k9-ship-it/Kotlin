import botsData from '../../bots.json';

export interface BotIdentity {
  uid: string;
  name: string;
  level: number;
}

export const BOT_LEVEL_MAPPING: Record<number, BotIdentity> = botsData.reduce((acc: any, bot: any) => {
  acc[bot.level] = bot;
  return acc;
}, {});

export const getBotByLevel = (level: number): BotIdentity => {
  return BOT_LEVEL_MAPPING[level] || BOT_LEVEL_MAPPING[4]; // Default to level 4
};

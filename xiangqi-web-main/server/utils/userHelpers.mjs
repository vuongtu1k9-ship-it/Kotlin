import { getUsersCol, getBotsCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';

/**
 * Resolves a user identifier (UID or slug) to a full user document.
 * SSOT: Centralizes user lookup logic used across multiple routes.
 */
export async function resolveUser(id) {
  if (!id) return null;
  const safeId = String(id).toLowerCase();
  
  // 1. Try Users collection (Humans)
  const usersCol = await getUsersCol();
  const potentialUid = safeId.split('-')[0];

  const user = await usersCol.findOne({
    $or: [
      { uid: safeId },
      { slug: safeId },
      { uid: potentialUid }
    ]
  });

  if (user) return user;

  // 2. Try Bots collection (AI Agents)
  try {
    const botsCol = await getBotsCol();
    const bot = await botsCol.findOne({
      $or: [
        { uid: safeId },
        { uid: potentialUid },
        { name: safeId }
      ]
    });

    if (bot) {
      return { 
        ...bot, 
        role: 'bot', 
        isBot: true,
        // Ensure standard fields are mapped for UI components
        picture: bot.avatar || null
      };
    }
  } catch (err) {
    logger.error(`[resolveUser] Bot lookup failed for ${safeId}: ${err.message}`);
  }

  return null;
}

/**
 * Standardizes the picture URL for a user.
 */
export function getAvatarUrl(user) {
  if (!user) return null;
  if (!user.picture) return null;
  // Always proxy avatars through our API to handle caching and validation
  return `/api/avatars/${user.uid}.webp`;
}

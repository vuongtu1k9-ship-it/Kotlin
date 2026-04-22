import { getUsersCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { GAME_STATUS } from '../constants.mjs';

/**
 * Standard logic to determine game status.
 * SSOT: Centralizes status calculation across routes and services.
 */
export function getGameStatus(doc) {
  if (!doc) return GAME_STATUS.UNKNOWN;
  if (doc.status) return doc.status;
  const st = doc.state || {};
  if (st.finished || doc.finished) return GAME_STATUS.FINISHED;
  if (st.started || doc.started) return GAME_STATUS.STARTED;
  return GAME_STATUS.OPEN;
}

/**
 * Standard logic to retrieve player UIDs from various document structures.
 * SSOT: Handles legacy and current schema for player identification.
 */
export function getPlayerUids(doc) {
  if (!doc) return { red: null, black: null };
  return doc.playerUids || doc.state?.playerUids || { red: null, black: null };
}

/**
 * Standard logic to retrieve player names.
 */
export function getPlayerNames(doc) {
  if (!doc) return { red: null, black: null };
  return doc.playerNames || doc.state?.playerNames || doc.players || { red: null, black: null };
}

/**
 * Generates a MongoDB filter for games where a user participated.
 * DRY: Shared between user history and statistics routes.
 */
export function getParticipantFilter(uid, isPrivateVisible = false) {
  const filter = {
    $or: [
      { 'playerUids.red': uid },
      { 'playerUids.black': uid },
      { 'state.playerUids.red': uid },
      { 'state.playerUids.black': uid }
    ]
  };
  if (!isPrivateVisible) {
    filter.isPrivate = { $ne: true };
  }
  return filter;
}

/**
 * Fetches user summaries (name, picture, elo) for a set of UIDs.
 * DRY: Used when listing games to display player details.
 */
export async function fetchPlayerSummaries(uids) {
  const summaries = new Map();
  const uidArray = Array.from(new Set(uids)).filter(Boolean).map(String);
  if (uidArray.length === 0) return summaries;

  try {
    const usersCol = await getUsersCol();
    const users = await usersCol.find(
      { uid: { $in: uidArray } },
      { projection: { uid: 1, name: 1, picture: 1, elo: 1 } }
    ).toArray();
    for (const u of users) {
      summaries.set(String(u.uid), u);
    }
  } catch (e) {
    logger.error('fetchPlayerSummaries failed', e);
  }
  return summaries;
}

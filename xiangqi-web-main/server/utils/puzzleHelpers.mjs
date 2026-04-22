import { logger } from '../logger.mjs';
import { getPuzzlesCol } from '../mongo.mjs';
import { getLocalized } from './i18n.mjs';

/**
 * Resolves a puzzle identifier (UID or Legacy ID) to a full puzzle document.
 * SSOT: Centralizes puzzle lookup logic used across multiple routes.
 */
export async function resolvePuzzle(id) {
  if (!id) return null;
  const safeId = String(id).trim();
  const col = await getPuzzlesCol();

  // Support composite slugs: uid-some-name → extract uid from first segment
  const slugParts = safeId.split('-');
  const extractedUid = slugParts[0];
  const candidateIds = [safeId];
  if (extractedUid !== safeId && extractedUid.length >= 4 && extractedUid.length <= 13) {
    candidateIds.push(extractedUid);
  }

  // Try UID first
  let doc = await col.findOne({ uid: { $in: candidateIds } });
  if (!doc) {
    // Then try Legacy ID
    doc = await col.findOne({ "importedFrom.legacy13CharId": { $in: candidateIds } });
  }

  return doc;
}

/**
 * Standardizes puzzle summary for listings.
 */
export function formatPuzzleSummary(doc, lng) {
  if (!doc) return null;
  return {
    id: doc.uid || String(doc._id),
    uid: doc.uid || null,
    name: getLocalized(doc.name, lng),
    description: getLocalized(doc.description, lng),
    hint: getLocalized(doc.hint, lng),
    level: doc.level ?? null,
    fen: doc.fen || null,
    thumbBoard: Array.isArray(doc.board) ? doc.board : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdByName: doc.createdByName || null,
    pieceCount: doc.pieceCount || 0,
    likeCount: doc.likeCount || 0,
    solveCount: doc.solveCount || 0,
    viewCount: doc.viewCount || 0,
    attemptCount: doc.attemptCount || 0,
  };
}

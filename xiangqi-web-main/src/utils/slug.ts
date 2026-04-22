export function makeSlug(name: string | null | undefined, idOrUid: string | null | undefined) {
  const safeName = String(name || '');
  const safeId = String(idOrUid || '');
  if (!safeName) return safeId;

  const slug = safeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  
  if (slug === safeId.toLowerCase()) return safeId;
  return slug ? `${safeId}-${slug}` : safeId;
}

/**
 * Extracts the ID or UID from a slug like "abcde-some-name" or "mongodbId-some-name"
 */
export function extractIdFromSlug(slug: string | undefined): string {
  if (!slug) return '';
  const parts = slug.split('-');
  const first = parts[0];
  // MongoDB ObjectId (24 hex chars) or short UID (4-10 alphanumeric chars)
  if (first && (first.length === 24 || (first.length >= 4 && first.length <= 10))) {
    return first;
  }
  return slug;
}

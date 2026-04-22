export function makeSlug(name, idOrUid) {
  const safeName = String(name || '');
  const safeId = String(idOrUid || '');
  if (!safeName) return safeId;

  const slug = safeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  
  if (slug === safeId.toLowerCase()) return safeId;
  return slug ? `${safeId}-${slug}` : safeId;
}

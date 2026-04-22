export function makeSlug(name, idOrUid) {
  if (!name) return idOrUid;
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  
  if (slug === idOrUid.toLowerCase()) return idOrUid;
  return slug ? `${idOrUid}-${slug}` : idOrUid;
}

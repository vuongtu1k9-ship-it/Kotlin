/**
 * Utility for database-level internationalization (i18n).
 * Assumes translatable fields are objects: { en: "...", vi: "...", zh: "...", ja: "..." }
 */

export const SUPPORTED_LANGS = ['en', 'vi', 'zh', 'ja', 'ko', 'th', 'de', 'ru', 'fr', 'es', 'km', 'id', 'ms', 'it', 'nl', 'fi', 'zh-TW', 'ar', 'my'];
export const DEFAULT_LANG = 'en';

/**
 * extracts the localized string from a field object.
 * @param {Object|String} field - The field to localize.
 * @param {string} lng - The requested language code.
 * @returns {string} - The localized string or fallback.
 */
export function getLocalized(field, lng = DEFAULT_LANG) {
  if (!field) return '';
  
  // If it's already a string (not yet migrated or simple field), return as is
  if (typeof field === 'string') return field;
  
  if (typeof field === 'object') {
    // Try requested language
    if (field[lng]) return field[lng];
    
    // Fallback to default
    if (field[DEFAULT_LANG]) return field[DEFAULT_LANG];
    
    // Last resort: any available language
    const firstAvailable = Object.keys(field).find(key => SUPPORTED_LANGS.includes(key) && field[key]);
    if (firstAvailable) return field[firstAvailable];
  }
  
  return '';
}

/**
 * Middleware to detect language from request.
 */
export function languageDetector(req, res, next) {
  let lng = req.query.lng;
  
  // 1. Check Subdomain (en.cotuong.xyz, ja.localhost, etc.)
  const host = req.hostname || '';
  const parts = host.split('.');
  if (parts.length > 1) {
    const subdomain = parts[0].toLowerCase();
    if (SUPPORTED_LANGS.includes(subdomain)) {
      lng = subdomain;
    }
  }

  // 2. Fallbacks: Query Params -> Headers -> Default
  if (!lng) {
    lng = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  }

  req.lng = SUPPORTED_LANGS.includes(lng) ? lng : DEFAULT_LANG;
  next();
}

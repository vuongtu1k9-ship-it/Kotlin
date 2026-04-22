export const PROD_ORIGIN = 'https://cotuong.xyz';
export const STATIC_BASE_URL = 'https://static.cotuong.xyz';

/**
 * Returns the current site origin (e.g., https://dev.cotuong.xyz or https://cotuong.xyz)
 * Falls back to production origin if window is not available (SSR context)
 */
export function getSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.origin !== 'null' && window.location.origin !== '') {
      return window.location.origin;
    }
  }
  return PROD_ORIGIN;
}

/**
 * Constructs an absolute URL for a given path using the centralized static hub if applicable
 */
export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Prefer static hub for assets in production
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('cotuong.xyz')) {
    return `${STATIC_BASE_URL}${cleanPath}`;
  }
  return `${getSiteOrigin()}${cleanPath}`;
}

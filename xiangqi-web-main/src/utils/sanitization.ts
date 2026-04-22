import DOMPurify from 'isomorphic-dompurify';

/**
 * Strips all HTML tags from a string to prevent XSS.
 * Useful for fields like puzzle names, descriptions, or comments.
 */
export const sanitizeText = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No tags allowed
    ALLOWED_ATTR: []  // No attributes allowed
  }).trim();
};

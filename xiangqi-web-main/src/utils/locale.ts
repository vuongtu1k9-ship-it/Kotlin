import i18n from '../i18n';

/**
 * Centrally formats a date based on the current active language.
 * Falls back to 'vi-VN' if it's the apex domain or 'vi' language.
 */
export function formatDate(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '---';

  const lng = i18n.language || 'vi';
  const locale = lng === 'vi' ? 'vi-VN' : lng;

  return d.toLocaleDateString(locale, options);
}

/**
 * Centrally formats a number based on the current active language.
 */
export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  const lng = i18n.language || 'vi';
  const locale = lng === 'vi' ? 'vi-VN' : lng;
  
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Centrally formats currency/coins.
 */
export function formatCurrency(num: number): string {
  // Currently coins are just numbers with a icon, but we may want specific formatting later.
  return formatNumber(num);
}

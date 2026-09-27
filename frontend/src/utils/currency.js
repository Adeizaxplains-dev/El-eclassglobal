/**
 * Centralized currency formatter.
 *
 * Keeps currency display reusable across different client stores.
 * The store currency should be supplied by the caller.
 */

export function formatCurrency(amount, currency = 'NGN', locale = 'en-NG') {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
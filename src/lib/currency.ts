// Single Currency Configuration for VEYRO Luxury Streetwear
export const CURRENCY_CONFIG = {
  currency: 'INR',
  symbol: '₹',
  code: 'INR',
  locale: 'en-IN',
  name: 'Indian Rupee'
} as const;

/**
 * Reusable Price Formatting Function using Indian Numbering System (en-IN)
 * Examples:
 *   999 -> ₹999
 *   1499 -> ₹1,499
 *   4999 -> ₹4,999
 *   9999 -> ₹9,999
 *   14999 -> ₹14,999
 */
export const formatPrice = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${CURRENCY_CONFIG.symbol}0`;
  }
  
  const numericAmount = Math.round(Number(amount));
  
  // Format using Indian English locale ('en-IN')
  const formattedNumber = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    maximumFractionDigits: 0,
  }).format(numericAmount);

  return `${CURRENCY_CONFIG.symbol}${formattedNumber}`;
};

/**
 * Format price without symbol if needed
 */
export const formatPriceRaw = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0';
  }
  const numericAmount = Math.round(Number(amount));
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

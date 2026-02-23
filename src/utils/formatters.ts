/**
 * @fileoverview Formatting utilities for common data transformations.
 * Provides human-readable formatting for wallet addresses, file sizes,
 * dates, currencies, numbers, and percentages.
 */

/**
 * Truncates a wallet address to show the beginning and end with ellipsis.
 *
 * @param address - The full wallet address string
 * @param startChars - Number of characters to show from the start (default: 6)
 * @param endChars - Number of characters to show from the end (default: 4)
 * @returns The truncated address (e.g., "0x742d...bd0d") or empty string if no address
 */
const formatWalletAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Formats a byte count into a human-readable file size string.
 *
 * @param bytes - The file size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "0 Bytes")
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formats a Date object into a display string based on the requested format.
 *
 * @param date - The date to format
 * @param format - Output format: "relative" (e.g., "5m ago"), "full" (locale string), or "short" (e.g., "Jan 15")
 * @returns Formatted date string
 */
const formatEmailDate = (
  date: Date,
  format: 'relative' | 'full' | 'short' = 'relative'
): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (format === 'relative') {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffInSeconds > 31536000 ? 'numeric' : undefined,
    });
  }

  return date.toLocaleString();
};

/**
 * Formats a numeric amount as a localized currency string.
 *
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (default: "USD")
 * @param locale - BCP 47 locale string (default: "en-US")
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formats a number using Intl.NumberFormat for locale-aware display.
 *
 * @param value - The number to format
 * @param options - Optional Intl.NumberFormatOptions for customization
 * @returns Formatted number string (e.g., "1,234.56")
 */
const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-US', options).format(value);
};

/**
 * Formats a decimal value as a percentage string.
 *
 * @param value - The decimal value to format (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "75.00%")
 */
const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export {
  formatWalletAddress,
  formatFileSize,
  formatEmailDate,
  formatCurrency,
  formatNumber,
  formatPercentage,
};

/**
 * useReferralShare Hook
 * Observes referral code and generates a shareable URL with referral parameter
 */

import { useMemo } from 'react';
import { Optional } from '@sudobility/types';
import { useReferralCode } from './useReferralCode';

/**
 * Return type for useReferralShare hook
 */
export interface UseReferralShareReturn {
  /** The URL with referral code appended (or original URL if no referral code) */
  referralUrl: string;
  /** The referral code being used */
  referralCode: Optional<string>;
  /** Whether the referral code is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
}

/**
 * Hook to generate a shareable URL with referral code
 *
 * Observes referral code from useReferralCode and:
 * - Returns original URL if referral code is invalid (null/empty)
 * - Returns URL with referral code as query parameter if valid
 * - Handles URLs that already have query parameters
 * - Memoizes the result to prevent unnecessary updates
 *
 * @param url - The base URL to share
 * @param endpointUrl - Indexer API endpoint URL
 * @param devMode - Whether to use mock data on errors
 * @param paramName - The query parameter name for the referral code (default: 'ref')
 * @returns Object containing referralUrl, referralCode, isLoading, and error
 *
 * @example
 * ```tsx
 * function ShareButton() {
 *   const { referralUrl, isLoading } = useReferralShare(
 *     'https://example.com/signup',
 *     'https://indexer.example.com',
 *     false
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <button onClick={() => navigator.clipboard.writeText(referralUrl)}>
 *       Share: {referralUrl}
 *     </button>
 *   );
 * }
 * ```
 */
export function useReferralShare(
  url: string,
  endpointUrl: string,
  devMode: boolean = false,
  paramName: string = 'ref'
): UseReferralShareReturn {
  const { referralCode, isLoading, error } = useReferralCode(
    endpointUrl,
    devMode
  );

  // Memoize the referral URL generation
  const referralUrl = useMemo(() => {
    // If referral code is invalid (null, undefined, or empty), return original URL
    if (!referralCode || referralCode.trim().length === 0) {
      return url;
    }

    try {
      // Parse the URL to properly handle existing query parameters
      const urlObj = new URL(url);

      // Add the referral code as a query parameter
      urlObj.searchParams.set(paramName, referralCode);

      // Return the complete URL with referral code
      return urlObj.toString();
    } catch (err) {
      // If URL parsing fails, log the error and return original URL
      console.error('Error parsing URL in useReferralShare:', err);
      return url;
    }
  }, [url, referralCode, paramName]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo<UseReferralShareReturn>(
    () => ({
      referralUrl,
      referralCode,
      isLoading,
      error,
    }),
    [referralUrl, referralCode, isLoading, error]
  );
}

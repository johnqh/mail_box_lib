import { useCallback } from 'react';
import { useReferralCode } from './useReferralCode';

/**
 * Hook for managing referral code sharing
 * Combines referral code fetching with URL generation
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and share URL generator
 *
 * @example
 * ```typescript
 * const { getShareUrl, isLoading, error } = useReferralShare(
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * // Generate share URL with referral code
 * const shareUrl = await getShareUrl(
 *   'https://0xmail.box',
 *   walletAddress,
 *   signature,
 *   message
 * );
 * // Returns: "https://0xmail.box?referral=ABC123DEF"
 * ```
 */
export const useReferralShare = (endpointUrl: string, dev: boolean) => {
  const { referralCode, isLoading, error, fetchReferralCode } = useReferralCode(endpointUrl, dev);

  /**
   * Get referral code and append to share URL
   * @param baseUrl - The URL to share
   * @param walletAddress - User's wallet address
   * @param signature - Wallet signature
   * @param message - Signed message
   * @returns URL with referral code appended
   */
  const getShareUrl = useCallback(
    async (
      baseUrl: string,
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<string> => {
      const response = await fetchReferralCode(walletAddress, signature, message);
      const url = new URL(baseUrl);
      url.searchParams.set('referral', response.data.referralCode);
      return url.toString();
    },
    [fetchReferralCode]
  );

  return {
    referralCode: referralCode?.data?.referralCode,
    isLoading,
    error,
    getShareUrl,
  };
};

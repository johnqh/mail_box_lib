import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { IndexerClient, ReferralCodeResponse } from '../../../network/clients/indexer';

/**
 * Hook for getting or creating referral code for a wallet
 * GET /wallets/:walletAddress/referral
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and fetch function
 *
 * @example
 * ```typescript
 * const { referralCode, isLoading, error, fetchReferralCode } = useReferralCode(
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * // Get or create referral code
 * await fetchReferralCode(walletAddress, signature, message);
 * console.log(referralCode?.referralCode); // "ABC123DEF"
 * ```
 */
export const useReferralCode = (endpointUrl: string, dev: boolean) => {
  const [referralCode, setReferralCode] = useState<Optional<ReferralCodeResponse>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const client = new IndexerClient(endpointUrl, dev);

  const fetchReferralCode = useCallback(
    async (walletAddress: string, signature: string, message: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getReferralCode(walletAddress, signature, message);
        setReferralCode(response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get referral code';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setReferralCode(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    referralCode,
    isLoading,
    error,
    fetchReferralCode,
    clearError,
    reset,
  };
};

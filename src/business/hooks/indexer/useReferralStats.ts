import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { IndexerClient, ReferralStatsResponse } from '../../../network/clients/indexer';

/**
 * Hook for getting referral statistics by referral code (public endpoint)
 * POST /referrals/:referralCode/stats
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and fetch function
 *
 * @example
 * ```typescript
 * const { stats, isLoading, error, fetchStats } = useReferralStats(
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * // Get referral statistics by code
 * await fetchStats('ABC123DEF');
 * console.log(stats?.data.totalReferred); // Number of referrals
 * console.log(stats?.data.referredWallets); // Array of referred wallets
 * ```
 */
export const useReferralStats = (endpointUrl: string, dev: boolean) => {
  const [stats, setStats] = useState<Optional<ReferralStatsResponse>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const client = new IndexerClient(endpointUrl, dev);

  const fetchStats = useCallback(
    async (referralCode: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getReferralStats(referralCode);
        setStats(response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get referral stats';
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
    setStats(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    clearError,
    reset,
  };
};

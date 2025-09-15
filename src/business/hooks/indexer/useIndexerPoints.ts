/**
 * Platform-agnostic React hook for indexer points operations
 * Uses actual IndexerClient to interact with real API endpoints
 */

import { useCallback, useState } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import type {
  PointsLeaderboardResponse,
  SiteStatsResponse,
  UserPointsResponse,
} from '../../../types/api/indexer-responses';

/**
 * React hook for Indexer Points API operations using actual API endpoints
 */
function useIndexerPoints(endpointUrl: string, dev: boolean = false) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const indexerClient = new IndexerClient(endpointUrl, dev);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getPointsBalance = useCallback(
    async (walletAddress: string, signature: string, message: string): Promise<UserPointsResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getPointsBalance(
          walletAddress,
          signature,
          message
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get points balance';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getPointsLeaderboard = useCallback(
    async (count: number = 10): Promise<PointsLeaderboardResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getPointsLeaderboard(count);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getPointsSiteStats = useCallback(async (): Promise<SiteStatsResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await indexerClient.getPointsSiteStats();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get site stats';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [indexerClient]);

  return {
    // Actual API endpoints
    getPointsBalance,
    getPointsLeaderboard,
    getPointsSiteStats,
    // State
    isLoading,
    error,
    clearError,
  };
}

export { useIndexerPoints };
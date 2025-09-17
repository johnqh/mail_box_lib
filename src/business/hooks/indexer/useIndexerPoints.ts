/**
 * Platform-agnostic React hook for indexer points operations
 * Uses actual IndexerClient to interact with real API endpoints
 */

import { useCallback, useMemo, useState } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import type {
  LeaderboardResponse,
  PointsResponse,
  SiteStatsResponse,
} from '@johnqh/types';
import { IndexerMockData } from './mocks';

/**
 * React hook for Indexer Points API operations using actual API endpoints
 */
function useIndexerPoints(endpointUrl: string, dev: boolean = false, devMode: boolean = false) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create stable client instance to prevent unnecessary re-renders
  const indexerClient = useMemo(() => {
    return new IndexerClient(endpointUrl, dev);
  }, [endpointUrl, dev]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getPointsBalance = useCallback(
    async (walletAddress: string, signature: string, message: string): Promise<PointsResponse> => {
      setIsLoading(true);
      setError(null);

      // In devMode, try API with short timeout, then fall back to mock data quickly
      if (devMode) {
        try {
          // Quick attempt with 2 second timeout in devMode
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const result = await Promise.race([
            indexerClient.getPointsBalance(walletAddress, signature, message),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('DevMode timeout')), 2000);
            })
          ]);
          
          clearTimeout(timeoutId);
          return result;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to get points balance';
          console.warn('[DevMode] getPointsBalance failed quickly, returning mock data:', errorMessage);
          setError(null); // Don't show error in devMode
          return IndexerMockData.getPointsBalance(walletAddress);
        } finally {
          setIsLoading(false);
        }
      }

      // Normal mode - full timeout and throw errors
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
    [indexerClient, devMode]
  );

  const getPointsLeaderboard = useCallback(
    async (count: number = 10): Promise<LeaderboardResponse> => {
      setIsLoading(true);
      setError(null);

      // In devMode, try API with short timeout, then fall back to mock data quickly
      if (devMode) {
        try {
          // Quick attempt with 2 second timeout in devMode
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const result = await Promise.race([
            indexerClient.getPointsLeaderboard(count),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('DevMode timeout')), 2000);
            })
          ]);
          
          clearTimeout(timeoutId);
          return result;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to get leaderboard';
          console.warn('[DevMode] getPointsLeaderboard failed quickly, returning mock data:', errorMessage);
          setError(null); // Don't show error in devMode
          return IndexerMockData.getPointsLeaderboard(count);
        } finally {
          setIsLoading(false);
        }
      }

      // Normal mode - full timeout and throw errors
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
    [indexerClient, devMode]
  );

  const getPointsSiteStats = useCallback(async (): Promise<SiteStatsResponse> => {
    setIsLoading(true);
    setError(null);

    // In devMode, try API with short timeout, then fall back to mock data quickly
    if (devMode) {
      try {
        // Quick attempt with 2 second timeout in devMode
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const result = await Promise.race([
          indexerClient.getPointsSiteStats(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('DevMode timeout')), 2000);
          })
        ]);
        
        clearTimeout(timeoutId);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get site stats';
        console.warn('[DevMode] getPointsSiteStats failed quickly, returning mock data:', errorMessage);
        setError(null); // Don't show error in devMode
        return IndexerMockData.getSiteStats();
      } finally {
        setIsLoading(false);
      }
    }

    // Normal mode - full timeout and throw errors
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
  }, [indexerClient, devMode]);

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
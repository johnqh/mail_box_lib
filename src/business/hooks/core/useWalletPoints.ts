/**
 * useWalletPoints Hook
 * Fetches points balance for a specific wallet address
 */

import { useCallback, useMemo } from 'react';
import { useIndexerGetPointsBalance } from '@sudobility/indexer_client';
import type { NetworkClient, Optional } from '@sudobility/types';
import { useWalletStatus } from './useWalletStatus';

/**
 * Configuration for useWalletPoints hook
 */
export interface UseWalletPointsConfig {
  /** Network client for API calls */
  networkClient: NetworkClient;
  /** Indexer endpoint URL */
  endpointUrl: string;
  /** Wallet address to fetch points for */
  walletAddress: Optional<string>;
  /** Whether to use dev mode (default: false) */
  dev?: boolean;
}

/**
 * Wallet points balance data
 */
export interface WalletPointsBalance {
  /** Total points earned by the wallet */
  pointsEarned: number;
  /** Total number of activities */
  totalActivities: number;
  /** Leaderboard rank (null if not ranked) */
  leaderboardRank: number | null;
  /** Wallet address */
  walletAddress: string;
  /** Last activity date (optional) */
  lastActivityDate?: Optional<string>;
}

/**
 * Return type for useWalletPoints hook
 */
export interface UseWalletPointsReturn {
  /** Points balance data (undefined if not loaded) */
  balance: Optional<WalletPointsBalance>;
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Error if the request failed */
  error: Optional<Error>;
  /** Error message string */
  errorMessage: Optional<string>;
  /** Refetch the points balance */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch points balance for a specific wallet address
 *
 * This hook fetches the points balance for a given wallet address from the indexer.
 * It requires authentication from useWalletStatus. If no wallet address is provided
 * or authentication is not available, it will not fetch data.
 *
 * @param config - Configuration object
 * @returns WalletPointsBalance data with loading and error states
 *
 * @example
 * ```typescript
 * const { balance, isLoading, error, refetch } = useWalletPoints({
 *   endpointUrl: 'https://indexer.0xmail.box',
 *   walletAddress: '0x123...',
 *   dev: false,
 * });
 *
 * if (isLoading) {
 *   return <div>Loading points...</div>;
 * }
 *
 * if (error) {
 *   return <div>Error: {error.message}</div>;
 * }
 *
 * if (balance) {
 *   console.log(`Points: ${balance.pointsEarned}`);
 * }
 * ```
 */
export const useWalletPoints = (
  config: UseWalletPointsConfig
): UseWalletPointsReturn => {
  const { networkClient, endpointUrl, walletAddress, dev = false } = config;

  // Get indexer authentication from wallet status
  const { indexerAuth } = useWalletStatus();

  // Determine if we should fetch data
  const shouldFetch = !!walletAddress && !!indexerAuth;

  // Fetch points balance from indexer
  const {
    data: pointsData,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useIndexerGetPointsBalance(
    networkClient,
    endpointUrl,
    dev,
    shouldFetch && walletAddress ? walletAddress : '',
    shouldFetch && indexerAuth
      ? indexerAuth
      : { message: '', signature: '', signer: '' }
  );

  // Process the points balance data
  const balance: Optional<WalletPointsBalance> = useMemo(() => {
    if (!pointsData?.data) {
      return undefined;
    }

    return {
      pointsEarned: parseInt(pointsData.data.pointsEarned || '0'),
      totalActivities: pointsData.data.totalActivities || 0,
      leaderboardRank: pointsData.data.leaderboardRank,
      walletAddress: pointsData.data.walletAddress,
      lastActivityDate: pointsData.data.lastActivityDate,
    };
  }, [pointsData]);

  // Error message
  const errorMessage: Optional<string> = useMemo(() => {
    if (error) {
      return error instanceof Error ? error.message : 'Failed to load points';
    }
    return null;
  }, [error]);

  // Refetch wrapper
  const refetch = useCallback(async (): Promise<void> => {
    if (shouldFetch) {
      await refetchQuery();
    }
  }, [shouldFetch, refetchQuery]);

  return useMemo(
    () => ({
      balance,
      isLoading,
      error: error || null,
      errorMessage,
      refetch,
    }),
    [balance, isLoading, error, errorMessage, refetch]
  );
};

/**
 * React hook for managing points data
 * Combines useIndexerPointsLeaderboard, useIndexerPointsSiteStats, and useIndexerGetPointsBalance
 * Provides unified interface for points dashboard
 * Automatically fetches user's points balance when wallet is verified
 */

import { useCallback, useMemo } from 'react';
import {
  useIndexerGetPointsBalance,
  useIndexerPointsLeaderboard,
  useIndexerPointsSiteStats,
} from '@sudobility/indexer_client';
import type {
  IndexerLeaderboardResponse,
  IndexerSiteStatsResponse,
  Optional,
} from '@sudobility/types';
import type { UseQueryResult } from '@tanstack/react-query';
import { useWalletStatus } from './useWalletStatus';

/**
 * Processed leaderboard entry
 */
export interface LeaderboardEntry {
  walletAddress: string;
  pointsEarned: number;
  rank: number;
  percentage: number;
}

/**
 * Site statistics data
 */
export interface SiteStats {
  totalPoints: number;
  totalUsers: number;
  lastUpdated?: Optional<string>;
}

/**
 * Configuration for usePoints hook
 */
export interface UsePointsConfig {
  /** Indexer endpoint URL */
  endpointUrl: string;
  /** Whether to use dev mode */
  dev?: boolean;
  /** Number of leaderboard entries to fetch (default: 50) */
  leaderboardCount?: number;
}

/**
 * User points balance data
 */
export interface UserPointsBalance {
  pointsEarned: number;
  walletAddress: string;
  lastActivityDate?: Optional<string>;
}

/**
 * Return type for usePoints hook
 */
export interface UsePointsReturn {
  /** Leaderboard data */
  leaderboard: LeaderboardEntry[];
  /** Site statistics */
  siteStats: SiteStats;
  /** User's points balance (undefined if not verified or not available) */
  userBalance: Optional<UserPointsBalance>;
  /** Whether leaderboard is loading */
  isLoadingLeaderboard: boolean;
  /** Whether site stats is loading */
  isLoadingSiteStats: boolean;
  /** Whether user balance is loading */
  isLoadingUserBalance: boolean;
  /** Combined loading state */
  isLoading: boolean;
  /** Leaderboard error */
  leaderboardError: Optional<Error>;
  /** Site stats error */
  siteStatsError: Optional<Error>;
  /** User balance error */
  userBalanceError: Optional<Error>;
  /** Combined error message */
  error: Optional<string>;
  /** Refetch leaderboard data */
  refetchLeaderboard: () => Promise<UseQueryResult<IndexerLeaderboardResponse>>;
  /** Refetch site stats data */
  refetchSiteStats: () => Promise<UseQueryResult<IndexerSiteStatsResponse>>;
  /** Refetch user balance data */
  refetchUserBalance: () => Promise<void>;
  /** Refetch all data */
  refetchAll: () => Promise<void>;
}

/**
 * Hook for managing points data
 *
 * This hook combines leaderboard, site statistics, and user balance data from the indexer
 * into a unified interface suitable for points dashboards. Automatically fetches the
 * connected wallet's points balance when available.
 *
 * @param config - Configuration for the hook
 * @returns UsePointsReturn with leaderboard, site stats, and user balance data
 *
 * @example
 * ```typescript
 * const {
 *   leaderboard,
 *   siteStats,
 *   userBalance,
 *   isLoading,
 *   refetchAll
 * } = usePoints({
 *   endpointUrl: 'https://api.example.com',
 *   leaderboardCount: 50
 * });
 *
 * // Display leaderboard
 * leaderboard.forEach(entry => {
 *   console.log(`${entry.rank}. ${entry.walletAddress}: ${entry.pointsEarned} points (${entry.percentage}%)`);
 * });
 *
 * // Display site stats
 * console.log(`Total: ${siteStats.totalPoints} points from ${siteStats.totalUsers} users`);
 *
 * // Display user's balance (if wallet is verified)
 * if (userBalance) {
 *   console.log(`Your balance: ${userBalance.pointsEarned} points`);
 * }
 * ```
 */
export const usePoints = (config: UsePointsConfig): UsePointsReturn => {
  const { endpointUrl, dev = false, leaderboardCount = 50 } = config;

  // Get wallet status
  const { walletAddress, indexerAuth, isVerified } = useWalletStatus();

  // Fetch leaderboard data
  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useIndexerPointsLeaderboard(endpointUrl, dev, leaderboardCount);

  // Fetch site stats data
  const {
    data: siteStatsData,
    isLoading: isLoadingSiteStats,
    error: siteStatsError,
    refetch: refetchSiteStats,
  } = useIndexerPointsSiteStats(endpointUrl, dev);

  // Fetch user's points balance (only when wallet is verified)
  const shouldFetchBalance = isVerified && !!walletAddress && !!indexerAuth;
  const {
    data: userBalanceData,
    isLoading: isLoadingUserBalance,
    error: userBalanceError,
    refetch: refetchUserBalanceQuery,
  } = useIndexerGetPointsBalance(
    endpointUrl,
    dev,
    shouldFetchBalance && walletAddress ? walletAddress : '',
    shouldFetchBalance && indexerAuth
      ? indexerAuth
      : { message: '', signature: '', signer: '' }
  );

  // Wrapper function for refetching user balance
  const refetchUserBalance = useCallback(async (): Promise<void> => {
    if (shouldFetchBalance) {
      await refetchUserBalanceQuery();
    }
  }, [shouldFetchBalance, refetchUserBalanceQuery]);

  // Process site stats
  const siteStats: SiteStats = useMemo(() => {
    const totalPoints = siteStatsData?.data?.totalPoints
      ? parseInt(siteStatsData.data.totalPoints)
      : 0;
    const totalUsers = siteStatsData?.data?.totalUsers || 0;
    const lastUpdated = siteStatsData?.data?.lastUpdated;

    return {
      totalPoints,
      totalUsers,
      lastUpdated,
    };
  }, [siteStatsData]);

  // Process user balance data
  const userBalance: Optional<UserPointsBalance> = useMemo(() => {
    if (!userBalanceData?.data) {
      return undefined;
    }

    return {
      pointsEarned: parseInt(userBalanceData.data.pointsEarned || '0'),
      walletAddress: userBalanceData.data.walletAddress,
      lastActivityDate: userBalanceData.data.lastActivityDate,
    };
  }, [userBalanceData]);

  // Process leaderboard data
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const rawData =
      (leaderboardData as any)?.data?.leaderboard ||
      (leaderboardData as any)?.leaderboard ||
      [];

    const totalPoints = siteStats.totalPoints;

    return rawData.map((entry: any, index: number) => ({
      walletAddress: entry.walletAddress || entry.address || '',
      pointsEarned: parseInt(entry.pointsEarned || entry.points || '0'),
      rank: entry.rank || index + 1,
      percentage:
        totalPoints > 0
          ? (parseInt(entry.pointsEarned || entry.points || '0') /
              totalPoints) *
            100
          : 0,
    }));
  }, [leaderboardData, siteStats.totalPoints]);

  // Combined loading state
  const isLoading =
    isLoadingLeaderboard || isLoadingSiteStats || isLoadingUserBalance;

  // Combined error message
  const error: Optional<string> = useMemo(() => {
    if (leaderboardError) {
      return leaderboardError instanceof Error
        ? leaderboardError.message
        : 'Failed to load leaderboard';
    }
    if (siteStatsError) {
      return siteStatsError instanceof Error
        ? siteStatsError.message
        : 'Failed to load site statistics';
    }
    if (userBalanceError) {
      return userBalanceError instanceof Error
        ? userBalanceError.message
        : 'Failed to load user balance';
    }
    return null;
  }, [leaderboardError, siteStatsError, userBalanceError]);

  // Refetch all data
  const refetchAll = useCallback(async (): Promise<void> => {
    const promises: Promise<any>[] = [refetchLeaderboard(), refetchSiteStats()];
    // Only refetch user balance if wallet is verified
    if (isVerified && walletAddress && indexerAuth) {
      promises.push(refetchUserBalance());
    }
    await Promise.all(promises);
  }, [
    refetchLeaderboard,
    refetchSiteStats,
    refetchUserBalance,
    isVerified,
    walletAddress,
    indexerAuth,
  ]);

  return useMemo(
    () => ({
      leaderboard,
      siteStats,
      userBalance,
      isLoadingLeaderboard,
      isLoadingSiteStats,
      isLoadingUserBalance,
      isLoading,
      leaderboardError: leaderboardError || null,
      siteStatsError: siteStatsError || null,
      userBalanceError: userBalanceError || null,
      error,
      refetchLeaderboard,
      refetchSiteStats,
      refetchUserBalance,
      refetchAll,
    }),
    [
      leaderboard,
      siteStats,
      userBalance,
      isLoadingLeaderboard,
      isLoadingSiteStats,
      isLoadingUserBalance,
      isLoading,
      leaderboardError,
      siteStatsError,
      userBalanceError,
      error,
      refetchLeaderboard,
      refetchSiteStats,
      refetchUserBalance,
      refetchAll,
    ]
  );
};

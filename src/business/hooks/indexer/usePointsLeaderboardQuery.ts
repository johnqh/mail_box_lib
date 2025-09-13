/**
 * @fileoverview Points Leaderboard Hook with TanStack Query
 * @description Simplified leaderboard hook using TanStack Query for caching and background updates
 */

import {
  useIndexerPointsLeaderboard as usePointsLeaderboardQuery,
  useSiteStats,
} from '../indexer/useIndexerQueries';
import { UseQueryOptions } from '@tanstack/react-query';
import type {
  PointsLeaderboardResponse,
  SiteStatsResponse,
} from '../indexer/useIndexerQueries';

// Re-export types for backward compatibility
interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

// Transform the API response to match the expected format
const transformLeaderboardData = (
  apiResponse: any
): { topUsers: LeaderboardEntry[]; totalUsers: number } => {
  if (!apiResponse?.success || !apiResponse?.data?.leaderboard) {
    return { topUsers: [], totalUsers: 0 };
  }

  const topUsers = apiResponse.data.leaderboard.map(
    (entry: any, index: number) => ({
      rank: entry.rank || index + 1,
      walletAddress: entry.walletAddress,
      totalPoints: parseInt(entry.pointsEarned) || 0,
      currentStreak: 0, // Not provided by new API
      longestStreak: 0, // Not provided by new API
      lastActivityDate: null, // Not provided by new API
    })
  );

  return {
    topUsers,
    totalUsers: apiResponse.data.count || topUsers.length,
  };
};

/**
 * Hook for getting top users with TanStack Query caching
 *
 * Features:
 * - Automatic caching with stale-while-revalidate
 * - Background refetching when data becomes stale
 * - Immediate return of cached data
 * - Error handling with retry logic
 */
function useTopUsers(
  endpointUrl: string,
  dev: boolean,
  count: number = 10,
  options?: Partial<UseQueryOptions<PointsLeaderboardResponse>>
) {
  // Use TanStack Query hook for points leaderboard
  const query = usePointsLeaderboardQuery(endpointUrl, dev, count, {
    // Return cached data immediately, then fetch in background
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000, // 30 seconds - data is fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    ...options,
  } as UseQueryOptions<PointsLeaderboardResponse>);

  // Transform the data to match expected format
  const transformedData = query.data
    ? transformLeaderboardData(query.data)
    : { topUsers: [], totalUsers: 0 };

  // Return interface compatible with existing usage
  return {
    topUsers: transformedData.topUsers,
    totalUsers: transformedData.totalUsers,
    loading: query.isLoading,
    error: query.error?.message || null,
    isStale: query.isStale,
    isFetching: query.isFetching,
    lastUpdated: query.dataUpdatedAt,

    // Methods for manual control
    refetch: query.refetch,

    // Raw query object for advanced usage
    query,
  };
}

/**
 * Hook for site-wide statistics with TanStack Query
 */
function usePointsSiteStats(
  endpointUrl: string,
  dev: boolean,
  options?: Partial<UseQueryOptions<SiteStatsResponse>>
) {
  const query = useSiteStats(endpointUrl, dev, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  } as UseQueryOptions<SiteStatsResponse>);

  // Transform the data
  const stats = query.data?.success ? query.data.data : null;

  return {
    totalPoints: stats?.totalPoints || '0',
    totalUsers: stats?.totalUsers || 0,
    lastUpdated: stats?.lastUpdated ? new Date(stats.lastUpdated) : null,
    loading: query.isLoading,
    error: query.error?.message || null,
    isStale: query.isStale,
    isFetching: query.isFetching,

    // Methods
    refetch: query.refetch,

    // Raw query
    query,
  };
}

/**
 * Comprehensive leaderboard hook with pagination support
 * This replaces the complex usePointsLeaderboard hook
 */
function usePointsLeaderboard(
  endpointUrl: string,
  dev: boolean,
  initialCount: number = 50,
  options?: Partial<UseQueryOptions<PointsLeaderboardResponse>>
) {
  const query = usePointsLeaderboardQuery(endpointUrl, dev, initialCount, {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  } as UseQueryOptions<PointsLeaderboardResponse>);

  const transformedData = query.data
    ? transformLeaderboardData(query.data)
    : { topUsers: [], totalUsers: 0 };

  // Simplified interface - TanStack Query handles the complexity
  return {
    // Data
    leaderboard: transformedData.topUsers,
    totalUsers: transformedData.totalUsers,

    // State
    loading: query.isLoading,
    error: query.error?.message || null,
    isStale: query.isStale,
    isFetching: query.isFetching,

    // Pagination would need to be implemented with useInfiniteQuery for true pagination
    // For now, we just support different count values

    // Methods
    refetch: query.refetch,

    // Utility
    lastUpdated: query.dataUpdatedAt,
    query,
  };
}

/**
 * Legacy compatibility wrapper
 * Provides the same interface as the old useTopUsers for backward compatibility
 */
function useTopUsersLegacy(endpointUrl: string, dev: boolean, count: number = 10) {
  const result = useTopUsers(endpointUrl, dev, count);

  // Add methods expected by legacy code
  return {
    ...result,
    clearError: () => {
      // With TanStack Query, errors are automatically managed
      // We can refetch to clear error state
      result.refetch();
    },
    refresh: () => {
      return result.refetch();
    },
  };
}

export {
  useTopUsers,
  usePointsSiteStats,
  usePointsLeaderboard,
  useTopUsersLegacy,
  type LeaderboardEntry,
};

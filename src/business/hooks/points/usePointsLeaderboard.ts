/**
 * @fileoverview Points Leaderboard Hook
 * @description React hook for managing points leaderboard data (no authentication required)
 */

import { useCallback, useEffect, useState } from 'react';
import { useIndexerPoints } from '../indexer/useIndexerPoints';
import { IndexerCampaign, IndexerLeaderboardEntry } from '../../../types';

// Service interface for legacy points API (uses DI)
interface PointsApiService {
  getLeaderboard(
    page: number,
    limit: number,
    timeframe?: string
  ): Promise<{
    data: {
      leaderboard: LeaderboardEntry[];
      pagination: {
        page: number;
        limit: number;
        totalUsers: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
      };
    };
  }>;
  getActiveCampaigns(): Promise<{
    data: {
      campaigns: Campaign[];
    };
  }>;
}

// Types for legacy API compatibility
export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

export interface Campaign {
  id: string;
  campaignName: string;
  campaignType: string;
  pointsPerClaim: number;
  maxClaimsPerUser: number;
  totalClaimsLimit: number | null;
  startTime: number;
  endTime: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: number;
}

// Helper functions to convert between indexer types and existing types
const convertIndexerLeaderboardEntry = (
  entry: IndexerLeaderboardEntry
): LeaderboardEntry => ({
  rank: entry.rank,
  walletAddress: entry.walletAddress,
  totalPoints: parseInt(entry.totalPoints, 10) || 0,
  currentStreak: entry.currentStreak,
  longestStreak: entry.longestStreak,
  lastActivityDate: entry.lastActivityDate
    ? new Date(entry.lastActivityDate)
    : null,
});

const convertIndexerCampaign = (campaign: IndexerCampaign): Campaign => ({
  id: campaign.id,
  campaignName: campaign.campaignName,
  campaignType: 'event', // Default type since indexer has different enum values
  pointsPerClaim: campaign.pointsPerClaim,
  maxClaimsPerUser: campaign.maxClaimsPerUser,
  totalClaimsLimit: campaign.totalClaimsLimit || null,
  startTime: campaign.startTime,
  endTime: campaign.endTime,
  isActive: campaign.isActive,
  createdBy: campaign.createdBy || null,
  createdAt: campaign.createdAt,
});

export interface UsePointsLeaderboardState {
  leaderboard: LeaderboardEntry[];
  campaigns: Campaign[];
  totalUsers: number;
  loading: boolean;
  campaignsLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface UsePointsLeaderboardActions {
  fetchLeaderboard: (
    page?: number,
    limit?: number,
    timeframe?: 'all_time' | 'weekly' | 'monthly'
  ) => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

interface PointsLeaderboardHookDependencies {
  pointsApiService?: PointsApiService;
}

export function usePointsLeaderboard(
  dependencies?: PointsLeaderboardHookDependencies
): UsePointsLeaderboardState & UsePointsLeaderboardActions {
  const [state, setState] = useState<UsePointsLeaderboardState>({
    leaderboard: [],
    campaigns: [],
    totalUsers: 0,
    loading: false,
    campaignsLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    },
  });

  // Use the indexer points hook and legacy API service
  const {
    getLeaderboard: getIndexerLeaderboard,
    getActiveCampaigns: getIndexerCampaigns,
  } = useIndexerPoints();

  // Legacy points API service (injected via DI or mock for development)
  const pointsApiService =
    dependencies?.pointsApiService || createMockPointsApiService();

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchLeaderboard = useCallback(
    async (
      page = 1,
      limit = 50,
      timeframe: 'all_time' | 'weekly' | 'monthly' = 'all_time'
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // First try to use the indexer hook
        const indexerResponse = await getIndexerLeaderboard(
          timeframe,
          page,
          limit
        );

        setState(prev => ({
          ...prev,
          leaderboard: indexerResponse.leaderboard.map(
            convertIndexerLeaderboardEntry
          ),
          totalUsers: indexerResponse.pagination.totalUsers,
          pagination: {
            page: indexerResponse.pagination.page,
            limit: indexerResponse.pagination.limit,
            totalPages: indexerResponse.pagination.totalPages,
            hasNext: indexerResponse.pagination.hasNext,
            hasPrevious: indexerResponse.pagination.hasPrevious,
          },
          loading: false,
        }));
      } catch {
        try {
          // Fallback to legacy points API
          const response = await pointsApiService.getLeaderboard(
            page,
            limit,
            timeframe
          );

          setState(prev => ({
            ...prev,
            leaderboard: response.data.leaderboard,
            totalUsers: response.data.pagination.totalUsers,
            pagination: {
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              totalPages: response.data.pagination.totalPages,
              hasNext: response.data.pagination.hasNext,
              hasPrevious: response.data.pagination.hasPrevious,
            },
            loading: false,
          }));
        } catch {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch leaderboard',
          }));
        }
      }
    },
    [getIndexerLeaderboard]
  );

  const fetchCampaigns = useCallback(async () => {
    setState(prev => ({ ...prev, campaignsLoading: true }));

    try {
      // First try to use the indexer hook
      const indexerCampaigns = await getIndexerCampaigns();
      setState(prev => ({
        ...prev,
        campaigns: indexerCampaigns.map(convertIndexerCampaign),
        campaignsLoading: false,
      }));
    } catch {
      try {
        // Fallback to legacy points API
        const response = await pointsApiService.getActiveCampaigns();
        setState(prev => ({
          ...prev,
          campaigns: response.data.campaigns,
          campaignsLoading: false,
        }));
      } catch {
        setState(prev => ({
          ...prev,
          campaignsLoading: false,
          // Don't set error for campaigns as it's not critical
        }));
      }
    }
  }, [getIndexerCampaigns]);

  const nextPage = useCallback(async () => {
    if (state.pagination.hasNext) {
      await fetchLeaderboard(state.pagination.page + 1, state.pagination.limit);
    }
  }, [state.pagination, fetchLeaderboard]);

  const prevPage = useCallback(async () => {
    if (state.pagination.hasPrevious) {
      await fetchLeaderboard(state.pagination.page - 1, state.pagination.limit);
    }
  }, [state.pagination, fetchLeaderboard]);

  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= state.pagination.totalPages) {
        await fetchLeaderboard(page, state.pagination.limit);
      }
    },
    [state.pagination, fetchLeaderboard]
  );

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchLeaderboard(state.pagination.page, state.pagination.limit),
      fetchCampaigns(),
    ]);
  }, [state.pagination, fetchLeaderboard, fetchCampaigns]);

  // Load initial data on mount
  useEffect(() => {
    fetchLeaderboard(1, 50);
    fetchCampaigns();
  }, [fetchLeaderboard, fetchCampaigns]);

  return {
    ...state,
    fetchLeaderboard,
    fetchCampaigns,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    clearError,
  };
}

// Simple hook for just getting top users (for overview components)
export function useTopUsers(
  count: number = 10,
  dependencies?: PointsLeaderboardHookDependencies
) {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the indexer points hook and legacy API service
  const { getLeaderboard: getIndexerLeaderboard } = useIndexerPoints();
  const pointsApiService =
    dependencies?.pointsApiService || createMockPointsApiService();

  const fetchTopUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to use the indexer hook
      const indexerResponse = await getIndexerLeaderboard('all_time', 1, count);
      setTopUsers(
        indexerResponse.leaderboard.map(convertIndexerLeaderboardEntry)
      );
      setTotalUsers(indexerResponse.pagination.totalUsers);
    } catch {
      try {
        // Fallback to legacy points API
        const response = await pointsApiService.getLeaderboard(1, count);
        setTopUsers(response.data.leaderboard);
        setTotalUsers(response.data.pagination.totalUsers);
      } catch (fallbackErr) {
        setError(
          fallbackErr instanceof Error
            ? fallbackErr.message
            : 'Failed to fetch top users'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [count, getIndexerLeaderboard, pointsApiService]);

  useEffect(() => {
    fetchTopUsers();
  }, [fetchTopUsers]);

  return {
    topUsers,
    totalUsers,
    loading,
    error,
    refresh: fetchTopUsers,
  };
}

// Mock implementation for legacy points API service
function createMockPointsApiService(): PointsApiService {
  return {
    async getLeaderboard(page: number, limit: number, _timeframe?: string) {
      return {
        data: {
          leaderboard: [],
          pagination: {
            page,
            limit,
            totalUsers: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        },
      };
    },

    async getActiveCampaigns() {
      return {
        data: {
          campaigns: [],
        },
      };
    },
  };
}

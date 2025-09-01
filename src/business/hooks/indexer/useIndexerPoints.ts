/**
 * Platform-agnostic React hook for indexer points operations
 * Uses dependency injection to interact with indexer API
 */

import { useCallback, useState } from 'react';
import {
  AppConfig as _AppConfig,
  IndexerCampaign,
  IndexerHowToEarnResponse,
  IndexerLeaderboardEntry,
  IndexerPointsHistoryEntry,
  IndexerPointsSummary,
  IndexerPublicStatsResponse,
} from '../../../types';

// Service interface for indexer operations (uses DI)
interface IndexerService {
  getLeaderboard(
    limit?: number,
    offset?: number
  ): Promise<{
    leaderboard: IndexerLeaderboardEntry[];
    pagination: {
      page: number;
      limit: number;
      totalUsers: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }>;
  getCampaigns(): Promise<IndexerCampaign[]>;
  getPointsSummary(
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<IndexerPointsSummary>;
  getPointsHistory(
    walletAddress: string,
    signature: string,
    message?: string,
    limit?: number,
    offset?: number
  ): Promise<IndexerPointsHistoryEntry[]>;
  getHowToEarnPoints(): Promise<IndexerHowToEarnResponse>;
  getPublicStats(): Promise<IndexerPublicStatsResponse>;
}

// Hook dependencies (injected via context or parameter)
interface IndexerHookDependencies {
  indexerService: IndexerService;
}

export interface IndexerHowToEarn {
  title: string;
  description: string;
  earnMethods: Array<{
    id: string;
    title: string;
    description: string;
    pointsValue: number | string;
    pointsUnit: string;
    secondaryValue?: number;
    secondaryUnit?: string;
    icon: string;
    difficulty: string;
    category: string;
    tips: string;
  }>;
  quickStart: {
    title: string;
    steps: Array<{
      step: number;
      title: string;
      description: string;
      action: string;
    }>;
  };
  totalPossiblePoints: string;
  lastUpdated: number;
}

export interface IndexerPublicStats {
  totalUsers: number;
  totalPointsDistributed: string;
  topEarningMethods: Array<{
    method: string;
    percentage: number;
  }>;
  recentActivity: {
    emailsSentToday: number;
    newUsersToday: number;
    pointsAwardedToday: number;
  };
  announcement: {
    title: string;
    message: string;
    type: string;
  };
  message: string;
}

/**
 * Platform-agnostic hook for indexer points operations
 * Uses dependency injection pattern - the implementation is injected by the platform
 */
export function useIndexerPoints(dependencies?: IndexerHookDependencies) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, this would be injected via a service locator or context
  // For now, we'll use a mock implementation until proper DI is set up
  const indexerService =
    dependencies?.indexerService || createMockIndexerService();

  const getLeaderboard = useCallback(
    async (
      _timeframe: 'all_time' | 'weekly' | 'monthly' = 'all_time',
      page: number = 1,
      limit: number = 50
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const offset = (page - 1) * limit;
        const result = await indexerService.getLeaderboard(limit, offset);

        return {
          leaderboard: result.leaderboard,
          pagination: result.pagination,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerService]
  );

  const getActiveCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const campaigns = await indexerService.getCampaigns();
      return campaigns.filter(campaign => campaign.isActive);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get campaigns';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [indexerService]);

  const getPointsSummary = useCallback(
    async (walletAddress: string, signature: string, message?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        return await indexerService.getPointsSummary(
          walletAddress,
          signature,
          message
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get points summary';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerService]
  );

  const getPointsHistory = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message?: string,
      limit?: number,
      offset?: number
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        return await indexerService.getPointsHistory(
          walletAddress,
          signature,
          message,
          limit,
          offset
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get points history';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerService]
  );

  const getHowToEarnPoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      return await indexerService.getHowToEarnPoints();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get how-to-earn info';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [indexerService]);

  const getPublicStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      return await indexerService.getPublicStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get public stats';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [indexerService]);

  return {
    getLeaderboard,
    getActiveCampaigns,
    getPointsSummary,
    getPointsHistory,
    getHowToEarnPoints,
    getPublicStats,
    isLoading,
    error,
  };
}

// Mock implementation for development/testing
function createMockIndexerService(): IndexerService {
  return {
    async getLeaderboard(limit = 50, offset = 0) {
      // Mock implementation
      return {
        leaderboard: [],
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          totalUsers: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
    },

    async getCampaigns() {
      return [];
    },

    async getPointsSummary(
      walletAddress: string,
      _signature: string,
      _message?: string
    ) {
      return {
        walletAddress,
        totalPoints: '0',
        availablePoints: '0',
        lifetimeEarned: '0',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        rank: null,
        tier: 'Bronze',
        nextTierThreshold: '100',
        recentActivities: [],
        achievements: [],
        referralStats: {
          totalReferrals: 0,
          successfulReferrals: 0,
          referralPointsEarned: '0',
          referralCode: '',
        },
      };
    },

    async getPointsHistory() {
      return [];
    },

    async getHowToEarnPoints() {
      return {
        success: true,
        data: {
          title: 'How to Earn Points',
          description: 'Learn how to earn points in the 0xmail ecosystem',
          earnMethods: [],
          quickStart: {
            title: 'Quick Start',
            steps: [],
          },
          totalMethods: 0,
          estimatedEarningsPerDay: {
            casual: 10,
            regular: 50,
            power: 200,
          },
        },
      };
    },

    async getPublicStats() {
      return {
        success: true,
        data: {
          totalUsers: 0,
          totalPointsAwarded: '0',
          topUsersThisWeek: 0,
          activeCampaigns: 0,
          totalEmailsSent: 0,
          totalReferrals: 0,
          averagePointsPerUser: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    },
  };
}

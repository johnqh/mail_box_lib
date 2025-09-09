/**
 * Utility helper class for Indexer Admin API operations
 * These functions are designed for admin panel usage and require special permissions
 */

import { NetworkClient } from '../../types/infrastructure/network';

// Configuration interface for indexer admin endpoints
export interface IndexerAdminConfig {
  indexerBackendUrl: string;
  networkClient: NetworkClient;
}

export interface AdminCampaignConfig {
  name: string;
  description: string;
  type: 'single_use' | 'multi_use' | 'timed';
  pointsPerClaim: number;
  maxClaims?: number;
  maxUsesPerUser?: number;
  startTime: string | Date;
  endTime: string | Date;
  targetRecipient?: string;
  metadata?: any;
}

export interface AdminPointsAward {
  targetAddress: string;
  points: number;
  reason: string;
}

export interface AdminUserFlag {
  targetAddress: string;
  flagged: boolean;
  reason?: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalPoints: string;
  totalTransactions: number;
  activeCampaigns: number;
  flaggedUsers: number;
  totalAchievements: number;
  topUsers: Array<{
    walletAddress: string;
    totalPoints: string;
    currentStreak: number;
    longestStreak: number;
  }>;
  activityBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    walletAddress: string;
    activityType: string;
    pointsAmount: number;
    balanceBefore: string;
    balanceAfter: string;
    createdAt: number;
  }>;
}

export interface AdminFlaggedUser {
  walletAddress: string;
  totalPoints: string;
  lifetimeEarned: string;
  flagReason: string;
  lastActivityDate: number | null;
  updatedAt: number;
}

export interface AdminFlaggedUsers {
  users: AdminFlaggedUser[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AdminBulkCodesResponse {
  message: string;
  campaignId: string;
  codes: string[];
  count: number;
}

const getIndexerBaseUrl = (config: IndexerAdminConfig): string => {
  return config.indexerBackendUrl;
};

/**
 * Indexer Admin API Helper Class
 * Contains methods for administrative operations that modify data
 */
export class IndexerAdminHelper {
  private config: IndexerAdminConfig;
  private client: NetworkClient;
  
  constructor(config: IndexerAdminConfig) {
    this.config = config;
    this.client = config.networkClient;
  }
  /**
   * Create a new promotional campaign
   */
  async createCampaign(
    campaign: AdminCampaignConfig,
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<{ campaignId: string; message: string }> {
    const response = await this.client.post(`${getIndexerBaseUrl(this.config)}/admin/campaigns/create`, {
      campaign,
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }

  /**
   * Deactivate a promotional campaign
   */
  async deactivateCampaign(
    campaignId: string,
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<{ message: string }> {
    const response = await this.client.post(`${getIndexerBaseUrl(this.config)}/admin/campaigns/${encodeURIComponent(campaignId)}/deactivate`, {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }

  /**
   * Manually award points to a user
   */
  async awardPoints(
    award: AdminPointsAward,
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<{
    message: string;
    targetAddress: string;
    points: number;
    reason: string;
  }> {
    const response = await this.client.post(`${getIndexerBaseUrl(this.config)}/admin/points/award`, {
      ...award,
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }

  /**
   * Flag or unflag a user
   */
  async flagUser(
    userFlag: AdminUserFlag,
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<{
    message: string;
    targetAddress: string;
    flagged: boolean;
    reason: string | null;
  }> {
    const response = await this.client.post(`${getIndexerBaseUrl(this.config)}/admin/points/flag-user`, {
      ...userFlag,
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }

  /**
   * Get system overview statistics (requires admin signature in header)
   */
  async getOverviewStats(adminSignature: string): Promise<AdminOverviewStats> {
    const response = await this.client.get(`${getIndexerBaseUrl(this.config)}/admin/stats/overview`, {
      headers: {
        'x-admin-signature': adminSignature,
      },
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }

  /**
   * Get flagged users (requires admin signature in header)
   */
  async getFlaggedUsers(
    adminSignature: string,
    page: number = 1,
    limit: number = 50
  ): Promise<AdminFlaggedUsers> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.client.get(`${getIndexerBaseUrl(this.config)}/admin/users/flagged?${params}`, {
      headers: {
        'x-admin-signature': adminSignature,
      },
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }

  /**
   * Generate bulk promotional codes for a campaign
   */
  async generateBulkCodes(
    campaignId: string,
    count: number,
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<AdminBulkCodesResponse> {
    if (count <= 0 || count > 1000) {
      throw new Error('Count must be between 1 and 1000');
    }

    const response = await this.client.post(`${getIndexerBaseUrl(this.config)}/admin/campaigns/bulk-codes`, {
      campaignId,
      count,
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
    }

    return response.data.data;
  }
}

/**
 * Factory function to create IndexerAdminHelper with network client
 */
export const createIndexerAdminHelper = (
  indexerBackendUrl: string, 
  networkClient: NetworkClient
): IndexerAdminHelper => {
  return new IndexerAdminHelper({
    indexerBackendUrl,
    networkClient
  });
};
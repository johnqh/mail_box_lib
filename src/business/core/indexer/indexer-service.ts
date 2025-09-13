/**
 * Business service for indexer operations
 * Provides high-level methods for interacting with the mail_box_indexer API
 */

import { IndexerClient } from '../../../network/clients/indexer';
import type { AppConfig } from '../../../types/environment';

// Response types for indexer operations
interface IndexerEmailResponse {
  success: boolean;
  emails?: any[];
  message?: string;
}

interface IndexerLeaderboardResponse {
  success: boolean;
  leaderboard?: any[];
  message?: string;
}

// Currently unused interfaces - kept for future API expansion
interface _IndexerCampaignsResponse {
  success: boolean;
  campaigns?: any[];
  message?: string;
}

interface IndexerPointsSummaryResponse {
  success: boolean;
  points?: number;
  message?: string;
}

interface _IndexerPointsHistoryResponse {
  success: boolean;
  history?: any[];
  message?: string;
}

interface IndexerHowToEarnResponse {
  success: boolean;
  methods?: any[];
  message?: string;
}

interface IndexerPublicStatsResponse {
  success: boolean;
  stats?: any;
  message?: string;
}

interface _IndexerCampaignStatsResponse {
  success: boolean;
  stats?: any;
  message?: string;
}

interface _IndexerPromoCodeResponse {
  success: boolean;
  message?: string;
}

interface _IndexerPromoValidationResponse {
  success: boolean;
  valid?: boolean;
  message?: string;
}

interface _IndexerReferralResponse {
  success: boolean;
  message?: string;
}

interface _IndexerRefereeLoginResponse {
  success: boolean;
  message?: string;
}

/**
 * Business service for indexer operations
 * Provides high-level methods for interacting with the mail_box_indexer API
 */
class IndexerService {
  private static instance: IndexerService;
  private indexerClient: IndexerClient;
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: AppConfig) {
    this.indexerClient = new IndexerClient(
      config.indexerBackendUrl || 'https://indexer.0xmail.box',
      config.devMode
    );
  }

  public static getInstance(config: AppConfig): IndexerService {
    if (!IndexerService.instance) {
      IndexerService.instance = new IndexerService(config);
    }
    return IndexerService.instance;
  }

  // =============================================================================
  // PRIVATE CACHE METHODS
  // =============================================================================

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });
  }

  private clearCacheForUser(walletAddress: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(walletAddress)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // =============================================================================
  // EMAIL AND AUTHENTICATION METHODS
  // =============================================================================

  /**
   * Get email addresses for a wallet with caching
   */
  public async getEmailAddresses(
    walletAddress: string,
    limit?: string,
    offset?: string
  ): Promise<IndexerEmailResponse> {
    const cacheKey = this.getCacheKey('getEmailAddresses', { walletAddress });
    const cached = this.getFromCache<IndexerEmailResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.indexerClient.getEmailAddresses(
        walletAddress,
        limit || '10',
        offset || '0'
      );

      const result = {
        success: true,
        emails: response.emails || [],
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get email addresses:', error);
      return { success: false, message: 'Failed to get email addresses' };
    }
  }

  /**
   * Get user points summary
   */
  public async getPointsSummary(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<IndexerPointsSummaryResponse> {
    try {
      const response = await this.indexerClient.getPointsBalance(
        walletAddress,
        signature,
        message
      );
      
      return {
        success: response.success || true,
        points: parseInt(response.data?.pointsEarned || '0'),
      };
    } catch (error) {
      console.error('Failed to get points summary:', error);
      return { success: false, message: 'Failed to get points summary' };
    }
  }

  /**
   * Get leaderboard
   */
  public async getLeaderboard(
    limit?: number,
    offset?: number
  ): Promise<IndexerLeaderboardResponse> {
    const cacheKey = this.getCacheKey('getLeaderboard', { limit, offset });
    const cached = this.getFromCache<IndexerLeaderboardResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.indexerClient.getPointsLeaderboard(limit || 10);
      
      const result = {
        success: response.success || true,
        leaderboard: response.data?.leaderboard || [],
      };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return { success: false, message: 'Failed to get leaderboard' };
    }
  }

  /**
   * Get how to earn points information
   */
  public async getHowToEarnPoints(): Promise<IndexerHowToEarnResponse> {
    const cacheKey = this.getCacheKey('getHowToEarnPoints', {});
    const cached = this.getFromCache<IndexerHowToEarnResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // This endpoint no longer exists in the indexer, return placeholder data
      const result = {
        success: true,
        methods: [],
      };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get how to earn points:', error);
      return { success: false, message: 'Failed to get how to earn points' };
    }
  }

  /**
   * Get public statistics
   */
  public async getPublicStats(): Promise<IndexerPublicStatsResponse> {
    const cacheKey = this.getCacheKey('getPublicStats', {});
    const cached = this.getFromCache<IndexerPublicStatsResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.indexerClient.getPointsSiteStats();
      
      const result = {
        success: response.success || true,
        stats: response.data,
      };
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get public stats:', error);
      return { success: false, message: 'Failed to get public stats' };
    }
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific user
   */
  public clearUserCache(walletAddress: string): void {
    this.clearCacheForUser(walletAddress);
  }

  /**
   * Get cache stats
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Factory function to create an IndexerService instance
 */
const createIndexerService = (config: AppConfig): IndexerService => {
  return IndexerService.getInstance(config);
};

export {
  createIndexerService,
  IndexerService
};
/**
 * Business service for indexer operations (public endpoints only)
 * Provides high-level methods for interacting with public mail_box_indexer API endpoints
 *
 * Note: Signature-protected and IP-restricted endpoints have been removed as they're not usable by client applications
 */

import { IndexerClient } from '../../../network/clients/indexer';
import type { AppConfig } from '../../../types/environment';
import type {
  LeaderboardResponse,
  SiteStatsResponse,
} from '@johnqh/types';

// Legacy response types for backward compatibility
interface IndexerLeaderboardResponse {
  success: boolean;
  leaderboard?: any[];
  message?: string;
}

interface IndexerPublicStatsResponse {
  success: boolean;
  stats?: any;
  message?: string;
}

/**
 * Business service for indexer operations (public endpoints only)
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

  private getCacheKey(...args: any[]): string {
    return args.join(':');
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });
  }

  // =============================================================================
  // PUBLIC API METHODS (Only public endpoints - no signature verification required)
  // =============================================================================

  /**
   * Get points leaderboard
   */
  public async getLeaderboard(count: number = 10): Promise<IndexerLeaderboardResponse> {
    const cacheKey = this.getCacheKey('leaderboard', count);
    const cached = this.getCache<IndexerLeaderboardResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response: LeaderboardResponse = await this.indexerClient.getPointsLeaderboard(count);

      const result = {
        success: true,
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
   * Get public statistics
   */
  public async getPublicStats(): Promise<IndexerPublicStatsResponse> {
    const cacheKey = this.getCacheKey('public-stats');
    const cached = this.getCache<IndexerPublicStatsResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response: SiteStatsResponse = await this.indexerClient.getPointsSiteStats();

      const result = {
        success: true,
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
   * Clear the internal cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // Note: The following methods have been removed as they require signature verification
  // or are IP-restricted and cannot be used by client applications:
  // - getEmailAddresses (requires signature verification)
  // - getPointsSummary (requires signature verification)
  // - getDelegatedAddress (requires signature verification)
  // - getEntitlement (requires signature verification)
  // - createNonce/getNonce (requires signature verification)
  // - addRewardPoints (IP-restricted to WildDuck server)
  // - authenticate (IP-restricted to WildDuck server)
}

export { IndexerService };
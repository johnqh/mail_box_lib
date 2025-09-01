// Temporary types until full integration with @johnqh/lib
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

interface IndexerCampaignsResponse {
  success: boolean;
  campaigns?: any[];
  message?: string;
}

interface IndexerPointsSummaryResponse {
  success: boolean;
  points?: number;
  message?: string;
}

interface IndexerPointsHistoryResponse {
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

interface IndexerCampaignStatsResponse {
  success: boolean;
  stats?: any;
  message?: string;
}

interface IndexerPromoCodeResponse {
  success: boolean;
  message?: string;
}

interface IndexerPromoValidationResponse {
  success: boolean;
  valid?: boolean;
  message?: string;
}

interface IndexerReferralResponse {
  success: boolean;
  message?: string;
}

interface IndexerRefereeLoginResponse {
  success: boolean;
  message?: string;
}

// Basic config interface for now
interface AppConfig {
  indexer?: {
    baseUrl?: string;
    apiKey?: string;
  };
}

// Define types that might not be exported from @johnqh/lib yet
interface IndexerClient {
  getEmailAddresses: (
    address: string,
    signature: string,
    message?: string
  ) => Promise<IndexerEmailResponse>;
  getPointsSummary: (
    address: string,
    signature: string,
    message?: string
  ) => Promise<IndexerPointsSummaryResponse>;
  getPointsHistory: (
    address: string,
    signature: string,
    message?: string,
    limit?: number,
    offset?: number
  ) => Promise<IndexerPointsHistoryResponse>;
  getLeaderboard: (
    limit?: number,
    offset?: number
  ) => Promise<IndexerLeaderboardResponse>;
  getCampaigns: () => Promise<IndexerCampaignsResponse>;
  verifySignature: (
    address: string,
    signature: string,
    message: string
  ) => Promise<any>;
  getMessage: (
    chainId: number,
    address: string,
    domain: string,
    url: string
  ) => Promise<any>;
  getDelegated: (
    address: string,
    signature: string,
    message?: string
  ) => Promise<any>;
  getDelegatedTo: (address: string) => Promise<any>;
  getHowToEarnPoints: () => Promise<IndexerHowToEarnResponse>;
  getPublicStats: () => Promise<IndexerPublicStatsResponse>;
  getCampaignStats: (
    campaignId: string
  ) => Promise<IndexerCampaignStatsResponse>;
  claimPromoCode: (
    address: string,
    code: string,
    signature: string,
    message?: string
  ) => Promise<IndexerPromoCodeResponse>;
  validatePromoCode: (
    address: string,
    code: string,
    signature: string,
    message?: string
  ) => Promise<IndexerPromoValidationResponse>;
  registerReferral: (
    address: string,
    code: string,
    signature: string,
    message?: string
  ) => Promise<IndexerReferralResponse>;
  reportRefereeLogin: (
    address: string,
    signature: string,
    message?: string
  ) => Promise<IndexerRefereeLoginResponse>;
  webhookEmailSent: (data: any) => Promise<any>;
  webhookRecipientLogin: (data: any) => Promise<any>;
  webhookLogin: (data: any) => Promise<any>;
  checkNameServiceEntitlement: (address: string) => Promise<any>;
}

// Mock client factory for now
const createIndexerClient = (_config: AppConfig): IndexerClient => ({
  getEmailAddresses: async (_address: string) => ({
    success: true,
    emails: [],
  }),
  getPointsSummary: async (_address: string) => ({ success: true, points: 0 }),
  getPointsHistory: async (_address: string) => ({
    success: true,
    history: [],
  }),
  getLeaderboard: async () => ({ success: true, leaderboard: [] }),
  getCampaigns: async () => ({ success: true, campaigns: [] }),
  verifySignature: async () => ({ success: true }),
  getMessage: async () => ({ messages: { simple: 'Test message' } }),
  getDelegated: async () => ({ success: true }),
  getDelegatedTo: async () => ({ success: true }),
  getHowToEarnPoints: async () => ({ success: true, methods: [] }),
  getPublicStats: async () => ({ success: true, stats: {} }),
  getCampaignStats: async () => ({ success: true, stats: {} }),
  claimPromoCode: async () => ({ success: true }),
  validatePromoCode: async () => ({ success: true, valid: false }),
  registerReferral: async () => ({ success: true }),
  reportRefereeLogin: async () => ({ success: true }),
  webhookEmailSent: async () => ({ success: true }),
  webhookRecipientLogin: async () => ({ success: true }),
  webhookLogin: async () => ({ success: true }),
  checkNameServiceEntitlement: async () => ({ success: true }),
});

/**
 * Business service for indexer operations
 * Provides high-level methods for interacting with the mail_box_indexer API
 */
export class IndexerService {
  private static instance: IndexerService;
  private indexerClient: IndexerClient;
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: AppConfig) {
    this.indexerClient = createIndexerClient(config);
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
    signature?: string,
    message?: string
  ): Promise<IndexerEmailResponse> {
    const cacheKey = this.getCacheKey('getEmailAddresses', { walletAddress });
    const cached = this.getFromCache<IndexerEmailResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.indexerClient.getEmailAddresses(
        walletAddress,
        signature || '',
        message
      );

      this.setCache(cacheKey, response);
      return response;
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
    signature?: string,
    message?: string
  ): Promise<IndexerPointsSummaryResponse> {
    try {
      return await this.indexerClient.getPointsSummary(
        walletAddress,
        signature || '',
        message
      );
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
      const response = await this.indexerClient.getLeaderboard(limit, offset);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return { success: false, message: 'Failed to get leaderboard' };
    }
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
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
export const createIndexerService = (config: AppConfig): IndexerService => {
  return IndexerService.getInstance(config);
};

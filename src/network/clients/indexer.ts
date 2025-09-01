import {
  AppConfig,
  NetworkClient,
  NetworkRequestOptions,
  NetworkResponse,
} from '../../types';
import type {
  SignatureProtectedRequest,
  GetEmailsRequest,
  GetEmailsResponse,
  GetDelegatedRequest,
  GetDelegatedResponse,
  GetDelegatedToRequest,
  GetPointsSummaryRequest,
  GetPointsHistoryRequest,
  ClaimPromoCodeRequest,
  RegisterReferralRequest,
} from '../../types/api';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

/**
 * Indexer API client for interacting with mail_box_indexer v2.2.0
 * Supports all the latest endpoints including email generation, points system, and admin functions.
 */
export class IndexerClient implements NetworkClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: AppConfig, timeout: number = 30000) {
    this.baseUrl = config.indexerBackendUrl || 'https://indexer.0xmail.box';
    this.timeout = timeout;
  }

  /**
   * Make a network request (NetworkClient interface implementation)
   */
  async request<T = any>(
    url: string,
    options?: NetworkRequestOptions
  ): Promise<NetworkResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fullUrl, {
        method: options?.method || 'GET',
        headers: requestHeaders,
        body: options?.body,
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: response.headers
          ? Object.fromEntries(Array.from((response.headers as any).entries()))
          : {},
      };
    } catch (error) {
      throw new Error(
        `Indexer API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  // =============================================================================
  // MAIL API ENDPOINTS
  // =============================================================================

  /**
   * Get email addresses for a wallet address (requires signature verification)
   * POST /emails
   */
  async getEmailAddresses(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/emails', {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get email addresses: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get delegation information for a wallet (requires signature verification)
   * POST /delegated
   */
  async getDelegated(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/delegated', {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get delegation info: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get all addresses that have delegated TO a specific wallet address (requires signature verification)
   * POST /delegatedTo
   */
  async getDelegatedTo(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/delegatedTo', {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get delegated addresses: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get deterministic message for signing
   * GET /message/:chainId/:walletAddress/:domain/:url
   */
  async getMessage(
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ) {
    const response = await this.get(
      `/message/${chainId}/${encodeURIComponent(walletAddress)}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get message: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Create/update nonce for wallet address
   * POST /nonce/:walletAddress/create
   */
  async createNonce(walletAddress: string, signature: string, message: string) {
    const response = await this.post(
      `/nonce/${encodeURIComponent(walletAddress)}/create`,
      {
        signature,
        message,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Retrieve nonce for wallet address
   * POST /nonce/:walletAddress
   */
  async getNonce(walletAddress: string, signature: string, message: string) {
    const response = await this.post(
      `/nonce/${encodeURIComponent(walletAddress)}`,
      {
        signature,
        message,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Verify wallet signature
   * POST /verify
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/verify', {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Signature verification failed: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Check nameservice entitlement for a wallet address (public)
   * GET /:walletAddress/entitlement/nameservice
   */
  async checkNameServiceEntitlement(walletAddress: string) {
    const response = await this.get(
      `/${encodeURIComponent(walletAddress)}/entitlement/nameservice`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check entitlement: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  // =============================================================================
  // POINTS API ENDPOINTS
  // =============================================================================

  /**
   * Get "How to Earn Points" information (public)
   * GET /points/how-to-earn
   */
  async getHowToEarnPoints() {
    const response = await this.get('/points/how-to-earn');

    if (!response.ok) {
      throw new Error(
        `Failed to get how-to-earn info: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get public stats (public)
   * GET /points/public-stats
   */
  async getPublicStats() {
    const response = await this.get('/points/public-stats');

    if (!response.ok) {
      throw new Error(
        `Failed to get public stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get user points summary (requires signature verification)
   * POST /points/summary
   */
  async getPointsSummary(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/points/summary', {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get points summary: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get user points history (requires signature verification)
   * POST /points/history
   */
  async getPointsHistory(
    walletAddress: string,
    signature: string,
    message: string,
    limit?: number,
    offset?: number
  ) {
    const response = await this.post('/points/history', {
      walletAddress,
      signature,
      message,
      limit,
      offset,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get points history: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Claim promotional code points (requires signature verification)
   * POST /points/claim-promo
   */
  async claimPromoCode(
    walletAddress: string,
    promoCode: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/points/claim-promo', {
      walletAddress,
      promoCode,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to claim promo code: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Validate promotional code without claiming (requires signature verification)
   * POST /points/validate-promo
   */
  async validatePromoCode(
    walletAddress: string,
    promoCode: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/points/validate-promo', {
      walletAddress,
      promoCode,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to validate promo code: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Register referral (requires signature verification)
   * POST /points/register-referral
   */
  async registerReferral(
    walletAddress: string,
    referralCode: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/points/register-referral', {
      walletAddress,
      referralCode,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to register referral: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Report referee login (requires signature verification)
   * POST /points/referee-login
   */
  async reportRefereeLogin(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post('/points/referee-login', {
      walletAddress,
      signature,
      message,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to report referee login: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get leaderboard (public)
   * GET /leaderboard
   */
  async getLeaderboard(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await this.get(
      `/leaderboard${params.toString() ? `?${params.toString()}` : ''}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get leaderboard: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get campaigns (public)
   * GET /campaigns
   */
  async getCampaigns() {
    const response = await this.get('/campaigns');

    if (!response.ok) {
      throw new Error(
        `Failed to get campaigns: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get campaign stats (public)
   * GET /campaigns/:campaignId/stats
   */
  async getCampaignStats(campaignId: string) {
    const response = await this.get(
      `/campaigns/${encodeURIComponent(campaignId)}/stats`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get campaign stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  // =============================================================================
  // WEBHOOK ENDPOINTS (for internal use by email backend)
  // =============================================================================

  /**
   * Email sent webhook (internal)
   * POST /webhook/email-sent
   */
  async webhookEmailSent(data: {
    senderWallet: string;
    recipientEmails: string[];
    transactionHash?: string;
    chainId?: number;
    blockNumber?: string;
  }) {
    const response = await this.post('/webhook/email-sent', data);

    if (!response.ok) {
      throw new Error(
        `Failed to send email webhook: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Recipient login webhook (internal)
   * POST /webhook/recipient-login
   */
  async webhookRecipientLogin(data: {
    recipientWallet: string;
    senderWallets: string[];
  }) {
    const response = await this.post('/webhook/recipient-login', data);

    if (!response.ok) {
      throw new Error(
        `Failed to send recipient login webhook: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Login webhook (internal)
   * POST /webhook/login
   */
  async webhookLogin(data: { walletAddress: string; referralCode?: string }) {
    const response = await this.post('/webhook/login', data);

    if (!response.ok) {
      throw new Error(
        `Failed to send login webhook: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  // =============================================================================
  // ADMIN API ENDPOINTS (require admin privileges)
  // =============================================================================

  /**
   * Create campaign (admin)
   * POST /admin/campaigns/create
   */
  async adminCreateCampaign(
    campaignData: {
      campaignName: string;
      campaignType: string;
      pointsPerClaim: number;
      maxClaimsPerUser: number;
      totalClaimsLimit?: number;
      startTime: number;
      endTime: number;
      description?: string;
    },
    adminWallet: string,
    adminSignature: string,
    adminMessage: string
  ) {
    const response = await this.post('/admin/campaigns/create', {
      ...campaignData,
      adminWallet,
      adminSignature,
      adminMessage,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create campaign: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Award points manually (admin)
   * POST /admin/points/award
   */
  async adminAwardPoints(
    targetWallet: string,
    points: number,
    reason: string,
    adminWallet: string,
    adminSignature: string,
    adminMessage: string
  ) {
    const response = await this.post('/admin/points/award', {
      targetWallet,
      points,
      reason,
      adminWallet,
      adminSignature,
      adminMessage,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to award points: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Flag user (admin)
   * POST /admin/points/flag-user
   */
  async adminFlagUser(
    targetWallet: string,
    reason: string,
    adminWallet: string,
    adminSignature: string,
    adminMessage: string
  ) {
    const response = await this.post('/admin/points/flag-user', {
      targetWallet,
      reason,
      adminWallet,
      adminSignature,
      adminMessage,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to flag user: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get admin stats overview (admin)
   * GET /admin/stats/overview
   */
  async adminGetStatsOverview() {
    const response = await this.get('/admin/stats/overview');

    if (!response.ok) {
      throw new Error(
        `Failed to get admin stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get flagged users (admin)
   * GET /admin/users/flagged
   */
  async adminGetFlaggedUsers(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await this.get(
      `/admin/users/flagged${params.toString() ? `?${params.toString()}` : ''}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get flagged users: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Create bulk promotional codes (admin)
   * POST /admin/campaigns/bulk-codes
   */
  async adminCreateBulkCodes(
    campaignId: string,
    quantity: number,
    adminWallet: string,
    adminSignature: string,
    adminMessage: string
  ) {
    const response = await this.post('/admin/campaigns/bulk-codes', {
      campaignId,
      quantity,
      adminWallet,
      adminSignature,
      adminMessage,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create bulk codes: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }
}

/**
 * Factory function to create an IndexerClient instance
 */
export const createIndexerClient = (config: AppConfig): IndexerClient => {
  return new IndexerClient(config);
};

/**
 * Default indexer client configuration
 */
export const createIndexerApiConfig = (config: AppConfig) => ({
  BASE_URL: config.indexerBackendUrl || 'https://indexer.0xmail.box',
  VERSION: '2.2.0',
  ENDPOINTS: {
    // Mail endpoints
    EMAILS: '/emails',
    DELEGATED: '/delegated',
    DELEGATED_TO: '/delegatedTo',
    MESSAGE: (
      chainId: number,
      walletAddress: string,
      domain: string,
      url: string
    ) =>
      `/message/${chainId}/${encodeURIComponent(walletAddress)}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`,
    NONCE_CREATE: (walletAddress: string) =>
      `/nonce/${encodeURIComponent(walletAddress)}/create`,
    NONCE_GET: (walletAddress: string) =>
      `/nonce/${encodeURIComponent(walletAddress)}`,
    VERIFY: '/verify',
    NAME_SERVICE_ENTITLEMENT: (walletAddress: string) =>
      `/${encodeURIComponent(walletAddress)}/entitlement/nameservice`,

    // Points endpoints
    POINTS_HOW_TO_EARN: '/points/how-to-earn',
    POINTS_PUBLIC_STATS: '/points/public-stats',
    POINTS_SUMMARY: '/points/summary',
    POINTS_HISTORY: '/points/history',
    POINTS_CLAIM_PROMO: '/points/claim-promo',
    POINTS_VALIDATE_PROMO: '/points/validate-promo',
    POINTS_REGISTER_REFERRAL: '/points/register-referral',
    POINTS_REFEREE_LOGIN: '/points/referee-login',

    // Public endpoints
    LEADERBOARD: '/leaderboard',
    CAMPAIGNS: '/campaigns',
    CAMPAIGN_STATS: (campaignId: string) =>
      `/campaigns/${encodeURIComponent(campaignId)}/stats`,

    // Webhook endpoints
    WEBHOOK_EMAIL_SENT: '/webhook/email-sent',
    WEBHOOK_RECIPIENT_LOGIN: '/webhook/recipient-login',
    WEBHOOK_LOGIN: '/webhook/login',

    // Admin endpoints
    ADMIN_CREATE_CAMPAIGN: '/admin/campaigns/create',
    ADMIN_DEACTIVATE_CAMPAIGN: (campaignId: string) =>
      `/admin/campaigns/${campaignId}/deactivate`,
    ADMIN_AWARD_POINTS: '/admin/points/award',
    ADMIN_FLAG_USER: '/admin/points/flag-user',
    ADMIN_STATS: '/admin/stats/overview',
    ADMIN_FLAGGED_USERS: '/admin/users/flagged',
    ADMIN_BULK_CODES: '/admin/campaigns/bulk-codes',
  },
});

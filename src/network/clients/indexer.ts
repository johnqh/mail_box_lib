import axios from 'axios';
import {
  NetworkClient,
  NetworkRequestOptions,
  NetworkResponse,
} from '../../di';
import type { AppConfig } from '../../types/environment';
import type {
  AddressValidationResponse,
  ChainType,
  DelegatedFromResponse,
  DelegatedToResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  LeaderboardResponse,
  NonceResponse,
  Optional,
  PointsResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';

/**
 * Referral code data
 */
export interface ReferralCodeData {
  walletAddress: string;
  chainType: ChainType;
  referralCode: string;
  totalRedemptions: number;
  lastUsedAt?: string;
  createdAt: string;
}

/**
 * Referral code response
 */
export interface ReferralCodeResponse {
  success: boolean;
  data: ReferralCodeData;
  error: Optional<string>;
  timestamp: string;
}

/**
 * Referred wallet data
 */
export interface ReferredWallet {
  walletAddress: string;
  chainType: ChainType;
  createdAt: string;
  ipAddress?: string;
}

/**
 * Referral statistics data
 */
export interface ReferralStatsData {
  walletAddress: string;
  chainType: ChainType;
  referralCode: string;
  totalReferred: number;
  referredWallets: ReferredWallet[];
}

/**
 * Referral statistics response
 */
export interface ReferralStatsResponse {
  success: boolean;
  data: ReferralStatsData;
  error: Optional<string>;
  timestamp: string;
}

/**
 * Indexer API client for public endpoints only
 * Only includes endpoints that client applications can actually use without server-side authentication
 */
class IndexerClient implements NetworkClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly dev: boolean;

  constructor(config: AppConfig, timeout?: number);
  constructor(endpointUrl: string, dev?: boolean, timeout?: number);
  constructor(
    configOrUrl: AppConfig | string,
    timeoutOrDev: number | boolean = false,
    timeout: number = 30000
  ) {
    if (typeof configOrUrl === 'string') {
      // New constructor: (endpointUrl, dev, timeout)
      this.baseUrl = configOrUrl;
      this.dev = typeof timeoutOrDev === 'boolean' ? timeoutOrDev : false;
      this.timeout = timeout;
    } else {
      // Legacy constructor: (config, timeout)
      this.baseUrl =
        configOrUrl.indexerBackendUrl || 'https://indexer.0xmail.box';
      this.dev = configOrUrl.devMode || false;
      this.timeout = typeof timeoutOrDev === 'number' ? timeoutOrDev : 30000;
    }
  }

  async get<T>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
  }

  async put<T>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  async delete<T>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  async request<T>(
    url: string,
    options?: NetworkRequestOptions
  ): Promise<NetworkResponse<T>> {
    const fullUrl = `${this.baseUrl}${url}`;

    const axiosConfig: any = {
      method: options?.method || 'GET',
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.dev && { 'x-dev': 'true' }),
        ...options?.headers,
      },
      timeout: this.timeout,
      signal: options?.signal,
      withCredentials: false, // Ensure CORS doesn't require credentials
    };

    console.log('[IndexerClient] Making request:', {
      url: fullUrl,
      method: axiosConfig.method,
      headers: axiosConfig.headers,
    });

    if (options?.body) {
      if (typeof options.body === 'string') {
        try {
          axiosConfig.data = JSON.parse(options.body);
        } catch {
          axiosConfig.data = options.body;
        }
      } else {
        axiosConfig.data = options.body;
      }
    }

    try {
      const response = await axios(axiosConfig);

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        data: response.data as T,
        headers: response.headers as Record<string, string>,
        success: response.status >= 200 && response.status < 300,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Check if it's an axios error by checking for response property
      if (error.response || error.request) {
        // If we got a response, return it even if it's an error status
        if (error.response) {
          return {
            ok: false,
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data as T,
            headers: error.response.headers as Record<string, string>,
            success: false,
            timestamp: new Date().toISOString(),
          };
        }

        // Network or other error without a response
        console.error('[IndexerClient] Network error details:', {
          message: error.message,
          code: error.code,
          url: fullUrl,
          method: axiosConfig.method,
        });
        throw new Error(`Indexer API request failed: ${error.message}`);
      }

      throw new Error(
        `Indexer API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // =============================================================================
  // PUBLIC API ENDPOINTS (No authentication required)
  // =============================================================================

  /**
   * Validate username format (public endpoint)
   * GET /users/:username/validate
   */
  async validateUsername(username: string): Promise<AddressValidationResponse> {
    const response = await this.get<AddressValidationResponse>(
      `/users/${encodeURIComponent(username)}/validate`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate username: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as AddressValidationResponse;
  }

  /**
   * Get deterministic message for signing (public endpoint)
   * GET /wallets/:walletAddress/message?chainId=...&domain=...&url=...
   */
  async getMessage(
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ): Promise<SignInMessageResponse> {
    const queryParams = new URLSearchParams({
      chainId: chainId.toString(),
      domain,
      url,
    });

    const response = await this.get<SignInMessageResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/message?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get message: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as SignInMessageResponse;
  }

  /**
   * Get points leaderboard (public endpoint)
   * GET /points/leaderboard/:count
   */
  async getPointsLeaderboard(count: number = 10): Promise<LeaderboardResponse> {
    const response = await this.get<LeaderboardResponse>(
      `/points/leaderboard/${count}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get points leaderboard: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as LeaderboardResponse;
  }

  /**
   * Get site-wide statistics (public endpoint)
   * GET /points/site-stats
   */
  async getPointsSiteStats(): Promise<SiteStatsResponse> {
    const response = await this.get<SiteStatsResponse>('/points/site-stats');

    if (!response.ok) {
      throw new Error(
        `Failed to get site stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as SiteStatsResponse;
  }

  // =============================================================================
  // SIGNATURE-PROTECTED ENDPOINTS (Require wallet signature)
  // =============================================================================

  /**
   * Helper method to create authentication headers for signature-protected endpoints
   * Encodes the message using encodeURIComponent for HTTP header transmission
   * The indexer will decode it using decodeURIComponent
   */
  private createAuthHeaders(
    signature: string,
    message: string
  ): Record<string, string> {
    return {
      'x-signature': signature.replace(/[\r\n]/g, ''), // Remove any newlines from signature
      'x-message': encodeURIComponent(message), // Encode message for HTTP header
    };
  }

  /**
   * Get email addresses for a wallet (requires signature)
   * GET /wallets/:walletAddress/accounts
   */
  async getWalletAccounts(
    walletAddress: string,
    signature: string,
    message: string,
    referralCode?: string
  ): Promise<EmailAccountsResponse> {
    console.log('[IndexerClient] getWalletAccounts called with:', {
      walletAddress,
      signatureLength: signature?.length,
      messageLength: message?.length,
      referralCode,
      baseUrl: this.baseUrl,
      endpoint: `/wallets/${encodeURIComponent(walletAddress)}/accounts`,
    });

    const headers = this.createAuthHeaders(signature, message);

    // Add referral code header if provided
    if (referralCode) {
      headers['x-referral'] = referralCode;
    }

    const response = await this.get<EmailAccountsResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/accounts`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get wallet accounts: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as EmailAccountsResponse;
  }

  /**
   * Get latest delegated address for a wallet (requires signature)
   * GET /delegations/from/:walletAddress
   */
  async getDelegatedTo(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<DelegatedToResponse> {
    const response = await this.get<DelegatedToResponse>(
      `/delegations/from/${encodeURIComponent(walletAddress)}`,
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegation: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as DelegatedToResponse;
  }

  /**
   * Get all addresses that have delegated TO a wallet (requires signature)
   * GET /delegations/to/:walletAddress
   */
  async getDelegatedFrom(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<DelegatedFromResponse> {
    const response = await this.get<DelegatedFromResponse>(
      `/delegations/to/${encodeURIComponent(walletAddress)}`,
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegators: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as DelegatedFromResponse;
  }

  /**
   * Create new nonce for username (requires signature)
   * POST /users/:username/nonce
   */
  async createNonce(
    username: string,
    signature: string,
    message: string
  ): Promise<NonceResponse> {
    const response = await this.post<NonceResponse>(
      `/users/${encodeURIComponent(username)}/nonce`,
      {},
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as NonceResponse;
  }

  /**
   * Get nonce for username (requires signature)
   * GET /users/:username/nonce
   */
  async getNonce(
    username: string,
    signature: string,
    message: string
  ): Promise<NonceResponse> {
    const response = await this.get<NonceResponse>(
      `/users/${encodeURIComponent(username)}/nonce`,
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as NonceResponse;
  }

  /**
   * Check entitlement for a wallet (requires signature)
   * GET /wallets/:walletAddress/entitlements/
   */
  async getEntitlement(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<EntitlementResponse> {
    const response = await this.get<EntitlementResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/entitlements/`,
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get entitlement: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as EntitlementResponse;
  }

  /**
   * Get user points balance (requires signature)
   * GET /wallets/:walletAddress/points
   */
  async getPointsBalance(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<PointsResponse> {
    const response = await this.get<PointsResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/points`,
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get points balance: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as PointsResponse;
  }

  /**
   * Get or create referral code for a wallet (requires signature)
   * POST /wallets/:walletAddress/referral
   */
  async getReferralCode(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<ReferralCodeResponse> {
    console.log('[IndexerClient] getReferralCode called with:', {
      walletAddress,
      signatureLength: signature?.length,
      messageLength: message?.length,
      endpoint: `/wallets/${encodeURIComponent(walletAddress)}/referral`,
    });

    const response = await this.post<ReferralCodeResponse>(
      `/wallets/${encodeURIComponent(walletAddress)}/referral`,
      {},
      {
        headers: this.createAuthHeaders(signature, message),
      }
    );

    console.log('[IndexerClient] getReferralCode response:', {
      ok: response.ok,
      status: response.status,
      data: response.data,
    });

    if (!response.ok) {
      const errorMessage =
        (response.data as any)?.error ||
        (response.data as any)?.message ||
        JSON.stringify(response.data) ||
        `HTTP ${response.status}`;
      console.error('[IndexerClient] getReferralCode failed:', errorMessage);
      throw new Error(`Failed to get referral code: ${errorMessage}`);
    }

    return response.data as ReferralCodeResponse;
  }

  /**
   * Get referral statistics by referral code (public endpoint)
   * POST /referrals/:referralCode/stats
   */
  async getReferralStats(referralCode: string): Promise<ReferralStatsResponse> {
    const response = await this.post<ReferralStatsResponse>(
      `/referrals/${encodeURIComponent(referralCode)}/stats`,
      {}
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get referral stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as ReferralStatsResponse;
  }

  // Note: The following endpoints are IP-restricted and only accessible from WildDuck server:
  // - POST /wallets/:walletAddress/points/add (IPHelper validation)
  // - POST /authenticate (IPHelper validation)
  // - POST /addresses/:address/verify (IPHelper validation)
}

/**
 * Factory function to create an IndexerClient instance
 */
const createIndexerClient = (config: AppConfig): IndexerClient => {
  return new IndexerClient(
    config.indexerBackendUrl || 'https://indexer.0xmail.box',
    config.devMode
  );
};

/**
 * Default indexer client configuration
 */
const createIndexerApiConfig = (config: AppConfig) => ({
  BASE_URL: config.indexerBackendUrl || 'https://indexer.0xmail.box',
  VERSION: '2.2.0',
  ENDPOINTS: {
    // Public endpoints only
    USERS_VALIDATE: (username: string) =>
      `/users/${encodeURIComponent(username)}/validate`,
    MESSAGE: (
      walletAddress: string,
      chainId: number,
      domain: string,
      url: string
    ) => {
      const queryParams = new URLSearchParams({
        chainId: chainId.toString(),
        domain,
        url,
      });
      return `/wallets/${encodeURIComponent(walletAddress)}/message?${queryParams.toString()}`;
    },
    POINTS_LEADERBOARD: (count: number) => `/points/leaderboard/${count}`,
    POINTS_SITE_STATS: '/points/site-stats',
  },
});

export { createIndexerClient, createIndexerApiConfig, IndexerClient };

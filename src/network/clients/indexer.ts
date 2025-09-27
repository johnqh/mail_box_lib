import {
  NetworkClient,
  NetworkRequestOptions,
  NetworkResponse,
} from '../../di';
import type { AppConfig } from '../../types/environment';
import type {
  AddressValidationResponse,
  DelegatedFromResponse,
  DelegatedToResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  LeaderboardResponse,
  NonceResponse,
  PointsResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

/**
 * Indexer API client for interacting with mail_box_indexer v2.2.0
 * Supports all the latest endpoints including email generation, points system, and admin functions.
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
      this.dev = false;
      this.timeout = typeof timeoutOrDev === 'number' ? timeoutOrDev : 30000;
    }
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
      ...(this.dev && { 'x-dev': 'true' }),
      ...(options?.headers || {}),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const fetchOptions: RequestInit = {
        method: options?.method || 'GET',
        headers: requestHeaders,
        signal: options?.signal || controller.signal,
      };

      // Only add body if it exists and method supports it
      if (
        options?.body &&
        (options.method === 'POST' ||
          options.method === 'PUT' ||
          options.method === 'PATCH')
      ) {
        fetchOptions.body = options.body;
      }

      const response = await fetch(fullUrl, fetchOptions);

      clearTimeout(timeoutId);

      const responseData = await response.json();

      return {
        success: response.ok,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        error: response.ok ? null : responseData?.error || response.statusText,
        timestamp: new Date().toISOString(),
        headers: response.headers
          ? (() => {
              const headerObj: Record<string, string> = {};
              response.headers.forEach((value, key) => {
                headerObj[key] = value;
              });
              return headerObj;
            })()
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
    const requestOptions: NetworkRequestOptions = {
      method: 'GET',
      headers: options?.headers || null,
      body: null,
      signal: options?.signal || null,
      timeout: options?.timeout || null,
    };
    return this.request<T>(url, requestOptions);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    const requestOptions: NetworkRequestOptions = {
      method: 'POST',
      headers: options?.headers || null,
      body: body ? JSON.stringify(body) : null,
      signal: options?.signal || null,
      timeout: options?.timeout || null,
    };

    return this.request<T>(url, requestOptions);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>> {
    const requestOptions: NetworkRequestOptions = {
      method: 'PUT',
      headers: options?.headers || null,
      body: body ? JSON.stringify(body) : null,
      signal: options?.signal || null,
      timeout: options?.timeout || null,
    };

    return this.request<T>(url, requestOptions);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>> {
    const requestOptions: NetworkRequestOptions = {
      method: 'DELETE',
      headers: options?.headers || null,
      body: null,
      signal: options?.signal || null,
      timeout: options?.timeout || null,
    };
    return this.request<T>(url, requestOptions);
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Create authentication headers for signed requests
   */
  private createAuthHeaders(
    signature: string,
    message: string
  ): Record<string, string> {
    return {
      'x-signature': signature,
      'x-message': encodeURIComponent(message),
    };
  }

  // =============================================================================
  // MAIL API ENDPOINTS
  // =============================================================================

  /**
   * Validate username format (public endpoint)
   * GET /api/users/:username/validate
   */
  async validateUsername(username: string): Promise<AddressValidationResponse> {
    const response = await this.get<AddressValidationResponse>(
      `/api/users/${encodeURIComponent(username)}/validate`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate username: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as AddressValidationResponse;
  }

  /**
   * Get email accounts for a wallet address (requires signature verification)
   * GET /api/wallets/:walletAddress/accounts
   */
  async getEmailAccounts(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<EmailAccountsResponse> {
    const response = await this.get<EmailAccountsResponse>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/accounts`,
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get email accounts: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as EmailAccountsResponse;
  }

  /**
   * @deprecated Use getEmailAccounts instead. This method will be removed in future versions.
   * Get email addresses for a wallet address (requires signature verification)
   * GET /api/wallets/:walletAddress/accounts
   */
  async getEmailAddresses(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<EmailAccountsResponse> {
    return this.getEmailAccounts(walletAddress, signature, message);
  }

  /**
   * Get delegation information for a wallet (requires signature verification)
   * GET /api/delegations/from/:walletAddress
   */
  async getDelegated(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<DelegatedToResponse> {
    const response = await this.get<DelegatedToResponse>(
      `/api/delegations/from/${encodeURIComponent(walletAddress)}`,
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegation info: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as DelegatedToResponse;
  }

  /**
   * Get all addresses that have delegated TO a specific wallet address (requires signature verification)
   * GET /api/delegations/to/:walletAddress
   */
  async getDelegatedTo(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<DelegatedFromResponse> {
    const response = await this.get<DelegatedFromResponse>(
      `/api/delegations/to/${encodeURIComponent(walletAddress)}`,
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegated addresses: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as DelegatedFromResponse;
  }

  /**
   * Get deterministic message for signing
   * GET /api/wallets/:walletAddress/message/:chainId/:domain/:url
   */
  async getMessage(
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ): Promise<SignInMessageResponse> {
    const response = await this.get<SignInMessageResponse>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/message/${chainId}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get message: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as SignInMessageResponse;
  }

  /**
   * Create/update nonce for username
   * POST /api/users/:username/nonce
   */
  async createNonce(
    username: string,
    signature: string,
    message: string
  ): Promise<NonceResponse> {
    const response = await this.post<NonceResponse>(
      `/api/users/${encodeURIComponent(username)}/nonce`,
      {
        walletAddress: username,
        signature,
        message,
      },
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
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
   * Retrieve nonce for username
   * GET /api/users/:username/nonce
   */
  async getNonce(
    username: string,
    signature: string,
    message: string
  ): Promise<NonceResponse> {
    const response = await this.get<NonceResponse>(
      `/api/users/${encodeURIComponent(username)}/nonce`,
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get nonce: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as NonceResponse;
  }

  // Signature verification has been removed from the new types
  // This functionality may need to be handled differently

  /**
   * Check nameservice entitlement for a wallet address (requires signature verification)
   * GET /api/wallets/:walletAddress/entitlements/
   */
  async checkNameServiceEntitlement(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<EntitlementResponse> {
    const response = await this.get<EntitlementResponse>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/entitlements/`,
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check entitlement: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as EntitlementResponse;
  }

  // =============================================================================
  // POINTS API ENDPOINTS (Actual available endpoints)
  // =============================================================================

  /**
   * Get user points balance (requires signature verification)
   * GET /api/wallets/:walletAddress/points
   */
  async getPointsBalance(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<PointsResponse> {
    const response = await this.get<PointsResponse>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/points`,
      {
        headers: this.createAuthHeaders(signature, message),
        signal: null,
        timeout: null,
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
   * Get points leaderboard (public)
   * GET /api/points/leaderboard/:count
   */
  async getPointsLeaderboard(count: number = 10): Promise<LeaderboardResponse> {
    const response = await this.get<LeaderboardResponse>(
      `/api/points/leaderboard/${count}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get points leaderboard: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as LeaderboardResponse;
  }

  /**
   * Get site-wide statistics (public)
   * GET /api/points/site-stats
   */
  async getPointsSiteStats(): Promise<SiteStatsResponse> {
    const response = await this.get<SiteStatsResponse>(
      '/api/points/site-stats'
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get site stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data as SiteStatsResponse;
  }

  // Solana-specific endpoints have been removed as they are no longer needed
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
    // Mail endpoints
    USERS_VALIDATE: (username: string) =>
      `/api/users/${encodeURIComponent(username)}/validate`,
    WALLETS_ACCOUNTS: (walletAddress: string) =>
      `/api/wallets/${encodeURIComponent(walletAddress)}/accounts`,
    DELEGATIONS_FROM: (walletAddress: string) =>
      `/api/delegations/from/${encodeURIComponent(walletAddress)}`,
    DELEGATIONS_TO: (walletAddress: string) =>
      `/api/delegations/to/${encodeURIComponent(walletAddress)}`,
    MESSAGE: (
      walletAddress: string,
      chainId: number,
      domain: string,
      url: string
    ) =>
      `/api/wallets/${encodeURIComponent(walletAddress)}/message/${chainId}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`,
    NONCE_CREATE: (username: string) =>
      `/api/users/${encodeURIComponent(username)}/nonce`,
    NONCE_GET: (username: string) =>
      `/api/users/${encodeURIComponent(username)}/nonce`,
    SIGNATURE_VERIFY: (username: string) =>
      `/api/users/${encodeURIComponent(username)}/verify`,
    ENTITLEMENTS_NAMESERVICE: (walletAddress: string) =>
      `/api/wallets/${encodeURIComponent(walletAddress)}/entitlements/`,

    // Points endpoints (actual available endpoints)
    POINTS_BALANCE: (walletAddress: string) =>
      `/api/wallets/${encodeURIComponent(walletAddress)}/points`,
    POINTS_LEADERBOARD: (count: number) => `/api/points/leaderboard/${count}`,
    POINTS_SITE_STATS: '/api/points/site-stats',
  },
});

export { createIndexerClient, createIndexerApiConfig, IndexerClient };

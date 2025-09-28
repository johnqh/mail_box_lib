import {
  NetworkClient,
  NetworkRequestOptions,
  NetworkResponse,
} from '../../di';
import type { AppConfig } from '../../types/environment';
import type {
  AddressValidationResponse,
  LeaderboardResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

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
      body: body ? JSON.stringify(body) : undefined,
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
      body: body ? JSON.stringify(body) : undefined,
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
    const requestOptions: RequestInit = {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.dev && { 'x-dev': 'true' }),
        ...options?.headers,
      },
      signal: options?.signal || null,
    };

    if (options?.body) {
      if (typeof options.body === 'string') {
        requestOptions.body = options.body;
      } else {
        requestOptions.body = JSON.stringify(options.body);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fullUrl, {
        ...requestOptions,
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => null);

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: {} as Record<string, string>,
        success: response.ok,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
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
   * Get deterministic message for signing (public endpoint)
   * GET /api/wallets/:walletAddress/message?chainId=...&domain=...&url=...
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
      `/api/wallets/${encodeURIComponent(walletAddress)}/message?${queryParams.toString()}`
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
   * Get site-wide statistics (public endpoint)
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

  // Note: All other endpoints require either:
  // 1. Signature verification (RequestValidator.verify) - clients can't generate proper signatures
  // 2. IP restriction (IPHelper.validate) - only accessible from WildDuck server
  // These have been removed as they're not usable by client applications
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
      `/api/users/${encodeURIComponent(username)}/validate`,
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
      return `/api/wallets/${encodeURIComponent(walletAddress)}/message?${queryParams.toString()}`;
    },
    POINTS_LEADERBOARD: (count: number) => `/api/points/leaderboard/${count}`,
    POINTS_SITE_STATS: '/api/points/site-stats',
  },
});

export { createIndexerClient, createIndexerApiConfig, IndexerClient };

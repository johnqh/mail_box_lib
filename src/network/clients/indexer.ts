import {
  AppConfig,
  NetworkClient,
  NetworkRequestOptions,
  NetworkResponse,
} from '../../di';
// Note: TypeScript types are available in ../../types/api but not currently used in implementation

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

/**
 * Indexer API client for interacting with mail_box_indexer v2.2.0
 * Supports all the latest endpoints including email generation, points system, and admin functions.
 */
class IndexerClient implements NetworkClient {
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
   * Validate address format (public endpoint)
   * GET /api/addresses/:address/validate
   */
  async validateAddress(address: string) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(address)}/validate`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate address: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get email addresses for a wallet address (requires signature verification)
   * GET /api/addresses/:walletAddress
   */
  async getEmailAddresses(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}`,
      {
        headers: {
          'x-signature': signature,
          'x-message': message,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get email addresses: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get delegation information for a wallet (requires signature verification)
   * GET /api/addresses/:walletAddress/delegated
   */
  async getDelegated(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}/delegated`,
      {
        headers: {
          'x-signature': signature,
          'x-message': message,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegation info: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get all addresses that have delegated TO a specific wallet address (requires signature verification)
   * GET /api/addresses/:walletAddress/delegated/to
   */
  async getDelegatedTo(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}/delegated/to`,
      {
        headers: {
          'x-signature': signature,
          'x-message': message,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get delegated addresses: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get deterministic message for signing
   * GET /api/addresses/:walletAddress/message/:chainId/:domain/:url
   */
  async getMessage(
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}/message/${chainId}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`
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
   * POST /api/addresses/:walletAddress/nonce
   */
  async createNonce(walletAddress: string, signature: string, message: string) {
    const response = await this.post(
      `/api/addresses/${encodeURIComponent(walletAddress)}/nonce`,
      {
        walletAddress,
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
   * GET /api/addresses/:walletAddress/nonce
   */
  async getNonce(walletAddress: string, signature: string, message: string) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}/nonce`,
      {
        headers: {
          'x-signature': signature,
          'x-message': message,
        },
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
   * POST /api/addresses/:address/verify
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.post(
      `/api/addresses/${encodeURIComponent(walletAddress)}/verify`,
      {
        walletAddress,
        signature,
        message,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Signature verification failed: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Check nameservice entitlement for a wallet address (requires signature verification)
   * GET /api/addresses/:walletAddress/entitlements/
   */
  async checkNameServiceEntitlement(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}/entitlements/`,
      {
        headers: {
          'x-signature': signature,
          'x-message': message,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check entitlement: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  // =============================================================================
  // POINTS API ENDPOINTS (Actual available endpoints)
  // =============================================================================

  /**
   * Get user points balance (requires signature verification)
   * GET /api/addresses/:walletAddress/points
   */
  async getPointsBalance(
    walletAddress: string,
    signature: string,
    message: string
  ) {
    const response = await this.get(
      `/api/addresses/${encodeURIComponent(walletAddress)}/points`,
      {
        headers: {
          'x-signature': signature,
          'x-message': message,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get points balance: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get points leaderboard (public)
   * GET /api/points/leaderboard/:count
   */
  async getPointsLeaderboard(count: number = 10) {
    const response = await this.get(`/api/points/leaderboard/${count}`);

    if (!response.ok) {
      throw new Error(
        `Failed to get points leaderboard: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get site-wide statistics (public)
   * GET /api/points/site-stats
   */
  async getPointsSiteStats() {
    const response = await this.get('/api/points/site-stats');

    if (!response.ok) {
      throw new Error(
        `Failed to get site stats: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  // =============================================================================
  // SOLANA API ENDPOINTS
  // =============================================================================

  /**
   * Get Solana indexer status (public)
   * GET /api/solana/status
   */
  async getSolanaStatus() {
    const response = await this.get('/api/solana/status');

    if (!response.ok) {
      throw new Error(
        `Failed to get Solana status: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Setup Solana webhooks (internal)
   * POST /api/solana/setup-webhooks
   */
  async setupSolanaWebhooks() {
    const response = await this.post('/api/solana/setup-webhooks', {});

    if (!response.ok) {
      throw new Error(
        `Failed to setup Solana webhooks: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Process test Solana transaction (development only)
   * POST /api/solana/test-transaction
   */
  async processSolanaTestTransaction(chainId: number, transaction: any) {
    const response = await this.post('/api/solana/test-transaction', {
      chainId,
      transaction,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to process test transaction: ${(response.data as any)?.error || 'Unknown error'}`
      );
    }

    return response.data;
  }
}

/**
 * Factory function to create an IndexerClient instance
 */
const createIndexerClient = (config: AppConfig): IndexerClient => {
  return new IndexerClient(config);
};

/**
 * Default indexer client configuration
 */
const createIndexerApiConfig = (config: AppConfig) => ({
  BASE_URL: config.indexerBackendUrl || 'https://indexer.0xmail.box',
  VERSION: '2.2.0',
  ENDPOINTS: {
    // Mail endpoints
    ADDRESSES_VALIDATE: (address: string) =>
      `/api/addresses/${encodeURIComponent(address)}/validate`,
    ADDRESSES: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}`,
    ADDRESSES_DELEGATED: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/delegated`,
    ADDRESSES_DELEGATED_TO: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/delegated/to`,
    MESSAGE: (
      walletAddress: string,
      chainId: number,
      domain: string,
      url: string
    ) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/message/${chainId}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`,
    NONCE_CREATE: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/nonce`,
    NONCE_GET: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/nonce`,
    SIGNATURE_VERIFY: (address: string) =>
      `/api/addresses/${encodeURIComponent(address)}/verify`,
    ENTITLEMENTS_NAMESERVICE: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/entitlements/`,

    // Points endpoints (actual available endpoints)
    POINTS_BALANCE: (walletAddress: string) =>
      `/api/addresses/${encodeURIComponent(walletAddress)}/points`,
    POINTS_LEADERBOARD: (count: number) => `/api/points/leaderboard/${count}`,
    POINTS_SITE_STATS: '/api/points/site-stats',

    // Solana API endpoints
    SOLANA_STATUS: '/api/solana/status',
    SOLANA_WEBHOOK: '/api/solana/webhook',
    SOLANA_SETUP_WEBHOOKS: '/api/solana/setup-webhooks',
    SOLANA_TEST_TRANSACTION: '/api/solana/test-transaction',
  },
});

export { createIndexerClient, createIndexerApiConfig, IndexerClient };

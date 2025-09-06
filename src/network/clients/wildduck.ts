import { AppConfig, NetworkClient, NetworkResponse } from '../../types';
import { getWildDuckStorageKeys } from '../../utils/auth/wildDuckAuth';
import { createURLSearchParams } from '../../utils/url-params';

// Platform-specific globals
declare const fetch: typeof globalThis.fetch;
declare const sessionStorage: Storage;

// Determine API base URL based on Cloudflare worker configuration
const getApiBaseUrl = (config: AppConfig): string => {
  if (config.useCloudflareWorker && config.cloudflareWorkerUrl) {
    return config.cloudflareWorkerUrl;
  }

  // Use configured WildDuck backend URL (from environment variable) or fallback to 0xmail.box
  const backendUrl = config.wildDuckBackendUrl;
  if (backendUrl && backendUrl !== 'http://localhost:8080') {
    return backendUrl;
  }

  return 'https://0xmail.box';
};

// WildDuck API configuration factory
const createApiConfig = (config: AppConfig) => ({
  BASE_URL: getApiBaseUrl(config),
  BACKEND_URL: config.wildDuckBackendUrl, // Direct backend URL for non-API calls
  API_TOKEN: config.wildDuckApiToken, // Platform-agnostic environment variable access
  USE_CLOUDFLARE: config.useCloudflareWorker,
  ENDPOINTS: {
    // WildDuck API endpoints
    // Authentication
    AUTHENTICATE: '/authenticate',

    // Users
    USERS: '/users',
    USER: (userId: string) => `/users/${userId}`,

    // Mailboxes
    MAILBOXES: (userId: string) => `/users/${userId}/mailboxes`,
    MAILBOX: (userId: string, mailboxId: string) =>
      `/users/${userId}/mailboxes/${mailboxId}`,

    // Messages
    MESSAGES: (userId: string, mailboxId: string) =>
      `/users/${userId}/mailboxes/${mailboxId}/messages`,
    MESSAGE: (userId: string, mailboxId: string, messageId: string) =>
      `/users/${userId}/mailboxes/${mailboxId}/messages/${messageId}`,
    MESSAGE_BY_ID: (userId: string, messageId: string) =>
      `/users/${userId}/messages/${messageId}`,

    // Addresses
    ADDRESSES: (userId: string) => `/users/${userId}/addresses`,
    ADDRESS: (userId: string, addressId: string) =>
      `/users/${userId}/addresses/${addressId}`,
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Legacy export for backward compatibility
const API_CONFIG = createApiConfig({
  wildDuckBackendUrl: 'https://0xmail.box',
  wildDuckApiToken: '',
  useCloudflareWorker: false,
  cloudflareWorkerUrl: '',
} as AppConfig);

// WildDuck API client
class WildDuckAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private apiToken: string;
  private networkClient: NetworkClient;
  private useCloudflare: boolean;
  private config: ReturnType<typeof createApiConfig>;

  constructor(networkClient: NetworkClient, config: AppConfig) {
    this.config = createApiConfig(config);
    this.baseUrl = this.config.BASE_URL;
    this.apiToken = this.config.API_TOKEN;
    this.useCloudflare = this.config.USE_CLOUDFLARE;

    // Set headers based on whether we're using Cloudflare worker or direct connection
    this.headers = {
      ...this.config.DEFAULT_HEADERS,
    };

    if (this.useCloudflare) {
      // When using Cloudflare worker, send token in a different header
      // The worker will extract it and forward as X-Access-Token to WildDuck
      this.headers['Authorization'] = `Bearer ${this.apiToken}`;
      // Add a custom header to identify requests from the app
      this.headers['X-App-Source'] = '0xmail-box';
    } else {
      // Direct connection to WildDuck API
      this.headers['X-Access-Token'] = this.apiToken;
    }

    this.networkClient = networkClient;
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: Record<string, unknown> | string | FormData | Blob;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Warn if no API authentication headers found
    if (!this.headers['X-Access-Token'] && !this.headers['Authorization']) {
      console.warn('⚠️ No API authentication headers found!');
    }

    try {
      const response = await this.networkClient.request<T>(url, {
        method: options.method || 'GET',
        headers: {
          ...this.headers,
          ...options.headers,
        },
        body: (options.body &&
        typeof options.body === 'object' &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof Blob)
          ? JSON.stringify(options.body)
          : options.body) as string | FormData | Blob | undefined,
      });

      return response.data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // Pre-authenticate user to check if username exists
  async preAuth(
    username: string,
    scope?: string
  ): Promise<{
    success: boolean;
    id?: string;
    username?: string;
    address?: string;
    scope?: string;
  }> {
    const response = await this.request<{
      success: boolean;
      id?: string;
      username?: string;
      address?: string;
      scope?: string;
    }>('/preauth', {
      method: 'POST',
      body: {
        username,
        scope: scope || 'master',
        sess: 'api-session',
        ip: '127.0.0.1',
      },
    });

    return response;
  }

  // Authenticate user with WildDuck using blockchain signature
  async authenticate(
    username: string,
    signature: string,
    nonce: string,
    scope?: string
  ): Promise<{
    success: boolean;
    token?: string;
    id?: string;
    username?: string;
    address?: string;
    scope?: string;
  }> {
    const response = await this.request<{
      success: boolean;
      token?: string;
      id?: string;
      username?: string;
      address?: string;
      scope?: string;
    }>(API_CONFIG.ENDPOINTS.AUTHENTICATE, {
      method: 'POST',
      body: {
        username,
        signature, // Signature that was created by signing the nonce
        nonce, // The nonce that was signed
        // WildDuck handles ENS/SNS resolution internally
        scope: scope || 'master', // master scope for full access
        token: true, // Request a token to get access token in response
        protocol: 'API', // Application identifier for security logs
        sess: 'api-session', // Session identifier
        ip: '127.0.0.1', // IP address for logging
      },
    });

    // Store the user ID in session storage if authentication is successful
    if (response.success && response.id) {
      try {
        const keys = getWildDuckStorageKeys(username);
        sessionStorage.setItem(keys.userId, response.id);
      } catch (e) {
        console.warn('Failed to store user ID in session storage:', e);
      }
    } else {
      console.error(
        '❌ WildDuck authentication failed or returned no user ID:',
        response
      );
      if (response.success && !response.id) {
        console.error(
          "📝 Authentication succeeded but no user ID returned - this suggests user doesn't exist in WildDuck database"
        );
      }
    }

    return response;
  }

  // Legacy password-based authentication (fallback for testing)
  // Note: WildDuck primarily uses blockchain authentication, password auth may be limited
  async authenticateWithPassword(
    username: string,
    password: string,
    scope?: string
  ): Promise<{
    success: boolean;
    token?: string;
    id?: string;
    username?: string;
    address?: string;
    scope?: string;
  }> {
    const response = await this.request<{
      success: boolean;
      token?: string;
      id?: string;
      username?: string;
      address?: string;
      scope?: string;
    }>(API_CONFIG.ENDPOINTS.AUTHENTICATE, {
      method: 'POST',
      body: {
        username,
        password, // This might not work with current WildDuck - blockchain auth is preferred
        scope: scope || 'master', // master scope for full access
        token: true, // Request a token
        protocol: 'API',
        sess: 'api-session',
        ip: '127.0.0.1',
      },
    });

    // Store the user ID in session storage if authentication is successful
    if (response.success && response.id) {
      try {
        const keys = getWildDuckStorageKeys(username);
        sessionStorage.setItem(keys.userId, response.id);
      } catch (e) {
        console.warn('Failed to store user ID in session storage:', e);
      }
    }

    return response;
  }

  // Get user info
  async getUser(userId: string): Promise<{
    success: boolean;
    id: string;
    username: string;
    address?: string;
  }> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);

    return this.request<{
      success: boolean;
      id: string;
      username: string;
      address?: string;
    }>(API_CONFIG.ENDPOINTS.USER(validatedUserId));
  }

  // Get mailboxes for a user
  async getMailboxes(
    userId: string,
    options: {
      specialUse?: boolean;
      showHidden?: boolean;
      counters?: boolean;
      sizes?: boolean;
    } = {}
  ): Promise<WildDuckMailboxResponse> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);

    const queryParams = createURLSearchParams();

    if (options.specialUse) queryParams.append('specialUse', 'true');
    if (options.showHidden) queryParams.append('showHidden', 'true');
    if (options.counters) queryParams.append('counters', 'true');
    if (options.sizes) queryParams.append('sizes', 'true');

    const query = queryParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.MAILBOXES(validatedUserId)}${query ? `?${query}` : ''}`;

    return this.request<WildDuckMailboxResponse>(endpoint);
  }

  // Get messages from a mailbox
  async getMessages(
    userId: string,
    mailboxId: string,
    options: {
      limit?: number;
      page?: number;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<WildDuckMessagesResponse> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);

    // Validate mailbox ID format (should also be ObjectId)
    if (!isValidObjectId(mailboxId)) {
      throw new Error(
        `Invalid mailbox ID format: "${mailboxId}". Expected 24-character hexadecimal string (MongoDB ObjectId)`
      );
    }

    const queryParams = createURLSearchParams();

    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.order) queryParams.append('order', options.order);

    const query = queryParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.MESSAGES(validatedUserId, mailboxId)}${query ? `?${query}` : ''}`;

    return this.request<WildDuckMessagesResponse>(endpoint);
  }

  // Get a specific message by ID
  async getMessage(
    userId: string,
    messageId: string
  ): Promise<WildDuckMessageResponse> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);

    // Validate message ID format (should also be ObjectId)
    if (!isValidObjectId(messageId)) {
      throw new Error(
        `Invalid message ID format: "${messageId}". Expected 24-character hexadecimal string (MongoDB ObjectId)`
      );
    }

    const endpoint = API_CONFIG.ENDPOINTS.MESSAGE_BY_ID(
      validatedUserId,
      messageId
    );

    return this.request<WildDuckMessageResponse>(endpoint);
  }

  // Get user addresses (email addresses)
  async getAddresses(userId: string): Promise<{
    success: boolean;
    results: Array<{ id: string; address: string; main: boolean }>;
  }> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);

    const endpoint = API_CONFIG.ENDPOINTS.ADDRESSES(validatedUserId);

    return this.request<{
      success: boolean;
      results: Array<{ id: string; address: string; main: boolean }>;
    }>(endpoint);
  }

  // Create a new mailbox
  async createMailbox(
    userId: string,
    path: string,
    options?: {
      hidden?: boolean;
      retention?: number;
    }
  ): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(
      API_CONFIG.ENDPOINTS.MAILBOXES(userId),
      {
        method: 'POST',
        body: { path, ...options },
      }
    );
  }
}

// WildDuck API response types based on the source code analysis
interface WildDuckMailbox {
  id: string;
  name: string;
  path: string;
  specialUse?: string;
  modifyIndex: number;
  subscribed: boolean;
  hidden: boolean;
  total?: number;
  unseen?: number;
  size?: number;
}

interface WildDuckMailboxResponse {
  success: boolean;
  results: WildDuckMailbox[];
}

interface WildDuckMessage {
  id: string;
  mailbox: string;
  thread: string;
  from?: {
    name?: string;
    address: string;
  };
  to: Array<{
    name?: string;
    address: string;
  }>;
  subject: string;
  date: string;
  intro: string;
  attachments: boolean;
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
  size: number;
  ha: boolean; // has attachments
}

interface WildDuckMessagesResponse {
  success: boolean;
  total: number;
  page: number;
  previousCursor?: string;
  nextCursor?: string;
  results: WildDuckMessage[];
}

interface WildDuckMessageResponse {
  success: boolean;
  id: string;
  mailbox: string;
  user: string;
  from?: {
    name?: string;
    address: string;
  };
  to: Array<{
    name?: string;
    address: string;
  }>;
  subject: string;
  date: string;
  html?: string;
  text?: string;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
  }>;
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
}

// Factory function to create WildDuck API client with dependencies
const createWildDuckAPI = (
  networkClient: NetworkClient,
  config: AppConfig
): WildDuckAPI => {
  return new WildDuckAPI(networkClient, config);
};

// Export the class for direct instantiation if needed (renamed to avoid conflict)
export { WildDuckAPI as WildDuckAPIClass };

// Create a static API instance for backward compatibility
// This allows the main project to use WildDuckAPI.method() instead of instantiating
class StaticWildDuckAPI {
  private static instance: WildDuckAPI | null = null;

  private static getInstance(): WildDuckAPI {
    if (!StaticWildDuckAPI.instance) {
      // Create a basic network client for the static instance
      const networkClient: NetworkClient = {
        async request<T>(
          url: string,
          options: any = {}
        ): Promise<NetworkResponse<T>> {
          const response = await fetch(url, {
            method: options.method || 'GET',
            headers: options.headers,
            body: options.body,
          });

          const data = await response.json();

          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data,
            headers,
          };
        },

        async get<T>(
          url: string,
          options: any = {}
        ): Promise<NetworkResponse<T>> {
          return this.request<T>(url, { ...options, method: 'GET' });
        },

        async post<T>(
          url: string,
          body: any,
          options: any = {}
        ): Promise<NetworkResponse<T>> {
          return this.request<T>(url, { ...options, method: 'POST', body });
        },

        async put<T>(
          url: string,
          body: any,
          options: any = {}
        ): Promise<NetworkResponse<T>> {
          return this.request<T>(url, { ...options, method: 'PUT', body });
        },

        async delete<T>(
          url: string,
          options: any = {}
        ): Promise<NetworkResponse<T>> {
          return this.request<T>(url, { ...options, method: 'DELETE' });
        },
      };

      // Use default config - can be overridden later
      const defaultConfig = {
        wildDuckApiToken: '',
        wildDuckBackendUrl: 'https://0xmail.box',
        indexerBackendUrl: 'https://indexer.0xmail.box',
        revenueCatApiKey: '',
        walletConnectProjectId: '',
        privyAppId: '',
        firebase: {
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          measurementId: '',
          vapidKey: '',
        },
        useCloudflareWorker: false,
        cloudflareWorkerUrl: '',
        useMockFallback: true,
      } as AppConfig;

      StaticWildDuckAPI.instance = new WildDuckAPI(
        networkClient,
        defaultConfig
      );
    }

    return StaticWildDuckAPI.instance;
  }

  // Expose baseUrl and headers as properties for compatibility
  static get baseUrl(): string {
    return StaticWildDuckAPI.getInstance()['baseUrl'];
  }

  static get headers(): Record<string, string> {
    return StaticWildDuckAPI.getInstance()['headers'];
  }

  // Proxy all methods to the instance
  static async authenticate(
    username: string,
    signature: string,
    nonce: string,
    scope?: string
  ) {
    return StaticWildDuckAPI.getInstance().authenticate(
      username,
      signature,
      nonce,
      scope
    );
  }

  static async preAuth(username: string, scope?: string) {
    return StaticWildDuckAPI.getInstance().preAuth(username, scope);
  }

  static async getUser(userId: string) {
    return StaticWildDuckAPI.getInstance().getUser(userId);
  }

  static async getAddresses(userId: string) {
    return StaticWildDuckAPI.getInstance().getAddresses(userId);
  }

  static async getMailboxes(userId: string, options?: any) {
    return StaticWildDuckAPI.getInstance().getMailboxes(userId, options);
  }

  static async createMailbox(userId: string, path: string, options?: any) {
    return StaticWildDuckAPI.getInstance().createMailbox(userId, path, options);
  }

  static async getMessages(userId: string, mailboxId: string, options?: any) {
    return StaticWildDuckAPI.getInstance().getMessages(
      userId,
      mailboxId,
      options
    );
  }

  static async getMessage(userId: string, messageId: string) {
    return StaticWildDuckAPI.getInstance().getMessage(userId, messageId);
  }
}

// Override the WildDuckAPI export to point to the static version for backward compatibility
export { StaticWildDuckAPI as WildDuckAPI };

// Helper function to validate MongoDB ObjectId format
const isValidObjectId = (id: string): boolean => {
  return /^[a-f0-9]{24}$/i.test(id);
};

// Helper function to get WildDuck user ID for an email address
// This retrieves the actual MongoDB ObjectId from session storage after authentication
const emailToUserId = (emailAddress: string): string => {
  // Extract the wallet address part from email if it's in email format
  let username = emailAddress.toLowerCase();
  if (username.includes('@')) {
    username = username.split('@')[0]; // Extract just the address part
  }

  try {
    const keys = getWildDuckStorageKeys(username);

    // Check storage keys in priority order
    const storageKeys = [
      { key: keys.userId, type: 'userId' },
      { key: keys.authCache, type: 'cache' },
      { key: keys.legacy, type: 'legacy' },
    ];

    for (const { key, type } of storageKeys) {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        // Check if it's a cached auth object
        if (type === 'cache') {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.userId && isValidObjectId(parsed.userId)) {
              return parsed.userId;
            }
          } catch {
            // Not JSON, skip
          }
        } else if (isValidObjectId(stored)) {
          // Valid MongoDB ObjectId format
          return stored;
        } else {
          console.warn(
            '⚠️ Found stored value but not a valid ObjectId:',
            stored
          );
        }
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve user ID from session storage:', e);
  }

  // Fallback: No stored user ID found
  console.error(`❌ No stored user ID found for ${username}`);
  console.error(
    "📝 This usually means authentication failed or the user doesn't exist in WildDuck"
  );
  console.error(
    '📝 Check the authentication response and ensure the user was created in WildDuck'
  );
  console.error(
    '📝 Expected: 24-character hexadecimal string (MongoDB ObjectId)'
  );

  // Instead of returning a fake user ID, throw an error to surface the real issue
  throw new Error(
    `No WildDuck user ID found for ${username}. Authentication may have failed or user doesn't exist in database.`
  );
};

// Helper function to ensure a string is a valid user ID for WildDuck API calls
const validateUserId = (userId: string): string => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!isValidObjectId(userId)) {
    throw new Error(
      `Invalid user ID format: "${userId}". Expected 24-character hexadecimal string (MongoDB ObjectId)`
    );
  }

  return userId;
};

export {
  type WildDuckMailbox,
  type WildDuckMailboxResponse,
  type WildDuckMessage,
  type WildDuckMessageResponse,
  type WildDuckMessagesResponse,
  createWildDuckAPI,
  emailToUserId,
  validateUserId,
  isValidObjectId,
};

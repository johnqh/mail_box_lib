import { NetworkClient } from '../../di';
import { getWildDuckStorageKeys } from '../../utils/auth/wildDuckAuth';
import { createURLSearchParams } from '../../utils/url-params';

// Platform-specific globals
declare const sessionStorage: Storage;

// WildDuck configuration interface
export interface WildDuckConfig {
  backendUrl: string; // Required: WildDuck backend URL
  apiToken: string; // Required: API access token
  cloudflareWorkerUrl?: string; // Optional: Cloudflare worker proxy URL
}

// Determine API base URL based on Cloudflare worker configuration
const getApiBaseUrl = (config: WildDuckConfig): string => {
  if (config.cloudflareWorkerUrl) {
    return config.cloudflareWorkerUrl;
  }

  return config.backendUrl;
};

// WildDuck API configuration factory
const createApiConfig = (config: WildDuckConfig) => ({
  BASE_URL: getApiBaseUrl(config),
  BACKEND_URL: config.backendUrl, // Direct backend URL for non-API calls
  API_TOKEN: config.apiToken, // API access token
  USE_CLOUDFLARE: !!config.cloudflareWorkerUrl,
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

// Removed: Legacy API_CONFIG - consumers must provide their own WildDuckConfig

// WildDuck API client
class WildDuckAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private apiToken: string;
  private networkClient: NetworkClient;
  private useCloudflare: boolean;
  private config: ReturnType<typeof createApiConfig>;

  constructor(networkClient: NetworkClient, config: WildDuckConfig) {
    this.config = createApiConfig(config);
    this.baseUrl = this.config.BASE_URL;
    this.apiToken = this.config.API_TOKEN;
    this.useCloudflare = this.config.USE_CLOUDFLARE;
    this.networkClient = networkClient;

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
    }>('/authenticate', {
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
    }>('/authenticate', {
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
    }>(`/users/${validatedUserId}`);
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
    const endpoint = `/users/${validatedUserId}/mailboxes${query ? `?${query}` : ''}`;

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
    const endpoint = `/users/${validatedUserId}/mailboxes/${mailboxId}/messages${query ? `?${query}` : ''}`;

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

    const endpoint = `/users/${validatedUserId}/messages/${messageId}`;

    return this.request<WildDuckMessageResponse>(endpoint);
  }

  // Get user addresses (email addresses)
  async getAddresses(userId: string): Promise<{
    success: boolean;
    results: Array<{ id: string; address: string; main: boolean }>;
  }> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);

    const endpoint = `/users/${validatedUserId}/addresses`;

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
      `/users/${userId}/mailboxes`,
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
  config: WildDuckConfig
): WildDuckAPI => {
  return new WildDuckAPI(networkClient, config);
};

// Export the main WildDuckAPI class
export { WildDuckAPI };

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

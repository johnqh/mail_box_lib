import { NetworkClient, webNetworkClient, webAppConfig, createURLSearchParams } from '@0xmail/lib';
import { getWildDuckStorageKeys } from '../utils/wildDuckAuth';

// Determine API base URL based on Cloudflare worker configuration
const getApiBaseUrl = (): string => {
  if (webAppConfig.useCloudflareWorker && webAppConfig.cloudflareWorkerUrl) {
    console.log('🌐 Using Cloudflare Worker proxy for WildDuck API');
    return webAppConfig.cloudflareWorkerUrl;
  }
  
  // Use configured WildDuck backend URL (from environment variable) or fallback to 0xmail.box
  const backendUrl = webAppConfig.wildDuckBackendUrl;
  if (backendUrl && backendUrl !== 'http://localhost:8080') {
    console.log('🔗 Using configured WildDuck backend URL:', backendUrl);
    return backendUrl;
  }
  
  console.log('🔗 Using default WildDuck API connection');
  return 'https://0xmail.box';
};

// WildDuck API configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  BACKEND_URL: webAppConfig.wildDuckBackendUrl, // Direct backend URL for non-API calls
  API_TOKEN: webAppConfig.wildDuckApiToken, // Platform-agnostic environment variable access
  USE_CLOUDFLARE: webAppConfig.useCloudflareWorker,
  ENDPOINTS: {
    // WildDuck API endpoints
    // Authentication
    AUTHENTICATE: '/authenticate',
    
    // Users
    USERS: '/users',
    USER: (userId: string) => `/users/${userId}`,
    
    // Mailboxes
    MAILBOXES: (userId: string) => `/users/${userId}/mailboxes`,
    MAILBOX: (userId: string, mailboxId: string) => `/users/${userId}/mailboxes/${mailboxId}`,
    
    // Messages
    MESSAGES: (userId: string, mailboxId: string) => `/users/${userId}/mailboxes/${mailboxId}/messages`,
    MESSAGE: (userId: string, mailboxId: string, messageId: string) => `/users/${userId}/mailboxes/${mailboxId}/messages/${messageId}`,
    MESSAGE_BY_ID: (userId: string, messageId: string) => `/users/${userId}/messages/${messageId}`,
    
    // Addresses
    ADDRESSES: (userId: string) => `/users/${userId}/addresses`,
    ADDRESS: (userId: string, addressId: string) => `/users/${userId}/addresses/${addressId}`,
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const;

// WildDuck API client
class WildDuckAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private apiToken: string;
  private networkClient: NetworkClient;
  private useCloudflare: boolean;

  constructor(networkClient: NetworkClient = webNetworkClient) {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.apiToken = API_CONFIG.API_TOKEN;
    this.useCloudflare = API_CONFIG.USE_CLOUDFLARE;
    
    // Set headers based on whether we're using Cloudflare worker or direct connection
    this.headers = { 
      ...API_CONFIG.DEFAULT_HEADERS
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

  private async request<T>(endpoint: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown> | string | FormData | Blob;
    headers?: Record<string, string>;
  } = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
    
    if (this.useCloudflare) {
      console.log(`🌐 Using Cloudflare Worker proxy`);
    }
    
    // Log if API token is present
    if (this.headers['X-Access-Token']) {
      console.log('🔑 API Token present (length:', this.headers['X-Access-Token'].length, ')');
    } else if (this.headers['Authorization']) {
      console.log('🔑 Authorization header present');
    } else {
      console.warn('⚠️ No API authentication headers found!');
    }
    
    try {
      const response = await this.networkClient.request<T>(url, {
        method: options.method || 'GET',
        headers: {
          ...this.headers,
          ...options.headers
        },
        body: (options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof Blob)
          ? JSON.stringify(options.body)
          : options.body) as string | FormData | Blob | undefined
      });

      console.log('✅ API Response received:', response.data);
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
  ): Promise<{ success: boolean; id?: string; username?: string; address?: string; scope?: string }> {
    const response = await this.request<{ success: boolean; id?: string; username?: string; address?: string; scope?: string }>(
      '/preauth',
      {
        method: 'POST',
        body: {
          username,
          scope: scope || 'master',
          sess: 'api-session',
          ip: '127.0.0.1'
        }
      }
    );
    
    console.log('🔍 WildDuck pre-auth response:', response);
    return response;
  }

  // Authenticate user with WildDuck using blockchain signature
  async authenticate(
    username: string, 
    signature: string, 
    nonce: string,
    scope?: string
  ): Promise<{ success: boolean; token?: string; id?: string; username?: string; address?: string; scope?: string }> {
    const response = await this.request<{ success: boolean; token?: string; id?: string; username?: string; address?: string; scope?: string }>(
      API_CONFIG.ENDPOINTS.AUTHENTICATE,
      {
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
          ip: '127.0.0.1' // IP address for logging
        }
      }
    );
    
    // Log the authentication response to see what WildDuck returns
    console.log('🔐 WildDuck authentication response:', response);
    
    // Store the user ID in session storage if authentication is successful
    if (response.success && response.id) {
      try {
        const keys = getWildDuckStorageKeys(username);
        sessionStorage.setItem(keys.userId, response.id);
        console.log('✅ Stored WildDuck user ID:', response.id, 'for username:', username);
      } catch (e) {
        console.warn('Failed to store user ID in session storage:', e);
      }
    } else {
      console.error('❌ WildDuck authentication failed or returned no user ID:', response);
      if (response.success && !response.id) {
        console.error('📝 Authentication succeeded but no user ID returned - this suggests user doesn\'t exist in WildDuck database');
      }
    }
    
    return response;
  }

  // Legacy password-based authentication (fallback for testing)
  // Note: WildDuck primarily uses blockchain authentication, password auth may be limited
  async authenticateWithPassword(username: string, password: string, scope?: string): Promise<{ success: boolean; token?: string; id?: string; username?: string; address?: string; scope?: string }> {
    const response = await this.request<{ success: boolean; token?: string; id?: string; username?: string; address?: string; scope?: string }>(
      API_CONFIG.ENDPOINTS.AUTHENTICATE,
      {
        method: 'POST',
        body: { 
          username, 
          password, // This might not work with current WildDuck - blockchain auth is preferred
          scope: scope || 'master', // master scope for full access
          token: true, // Request a token
          protocol: 'API',
          sess: 'api-session',
          ip: '127.0.0.1'
        }
      }
    );
    
    // Log the authentication response to see what WildDuck returns
    console.log('🔐 WildDuck password auth response:', response);
    
    // Store the user ID in session storage if authentication is successful
    if (response.success && response.id) {
      try {
        const keys = getWildDuckStorageKeys(username);
        sessionStorage.setItem(keys.userId, response.id);
        console.log('✅ Stored WildDuck user ID:', response.id, 'for username:', username);
      } catch (e) {
        console.warn('Failed to store user ID in session storage:', e);
      }
    }
    
    return response;
  }

  // Get user info
  async getUser(userId: string): Promise<{ success: boolean; id: string; username: string; address?: string }> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);
    
    console.log('👤 Fetching user info for user ID:', validatedUserId);
    
    return this.request<{ success: boolean; id: string; username: string; address?: string }>(
      API_CONFIG.ENDPOINTS.USER(validatedUserId)
    );
  }

  // Get mailboxes for a user
  async getMailboxes(userId: string, options: {
    specialUse?: boolean;
    showHidden?: boolean;
    counters?: boolean;
    sizes?: boolean;
  } = {}): Promise<WildDuckMailboxResponse> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);
    
    const queryParams = createURLSearchParams();
    
    if (options.specialUse) queryParams.append('specialUse', 'true');
    if (options.showHidden) queryParams.append('showHidden', 'true');
    if (options.counters) queryParams.append('counters', 'true');
    if (options.sizes) queryParams.append('sizes', 'true');

    const query = queryParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.MAILBOXES(validatedUserId)}${query ? `?${query}` : ''}`;
    
    console.log('📧 Fetching mailboxes for user ID:', validatedUserId);
    
    return this.request<WildDuckMailboxResponse>(endpoint);
  }

  // Get messages from a mailbox
  async getMessages(userId: string, mailboxId: string, options: {
    limit?: number;
    page?: number;
    order?: 'asc' | 'desc';
  } = {}): Promise<WildDuckMessagesResponse> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);
    
    // Validate mailbox ID format (should also be ObjectId)
    if (!isValidObjectId(mailboxId)) {
      throw new Error(`Invalid mailbox ID format: "${mailboxId}". Expected 24-character hexadecimal string (MongoDB ObjectId)`);
    }
    
    const queryParams = createURLSearchParams();
    
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.order) queryParams.append('order', options.order);

    const query = queryParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.MESSAGES(validatedUserId, mailboxId)}${query ? `?${query}` : ''}`;
    
    console.log('📨 Fetching messages for user ID:', validatedUserId, 'mailbox ID:', mailboxId);
    
    return this.request<WildDuckMessagesResponse>(endpoint);
  }

  // Get a specific message by ID
  async getMessage(userId: string, messageId: string): Promise<WildDuckMessageResponse> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);
    
    // Validate message ID format (should also be ObjectId)
    if (!isValidObjectId(messageId)) {
      throw new Error(`Invalid message ID format: "${messageId}". Expected 24-character hexadecimal string (MongoDB ObjectId)`);
    }
    
    const endpoint = API_CONFIG.ENDPOINTS.MESSAGE_BY_ID(validatedUserId, messageId);
    
    console.log('📩 Fetching message for user ID:', validatedUserId, 'message ID:', messageId);
    
    return this.request<WildDuckMessageResponse>(endpoint);
  }

  // Get user addresses (email addresses)
  async getAddresses(userId: string): Promise<{ success: boolean; results: Array<{ id: string; address: string; main: boolean }> }> {
    // Validate user ID format
    const validatedUserId = validateUserId(userId);
    
    const endpoint = API_CONFIG.ENDPOINTS.ADDRESSES(validatedUserId);
    
    console.log('📧 Fetching addresses for user ID:', validatedUserId);
    
    return this.request<{ success: boolean; results: Array<{ id: string; address: string; main: boolean }> }>(endpoint);
  }

  // Create a new mailbox
  async createMailbox(userId: string, path: string, options?: {
    hidden?: boolean;
    retention?: number;
  }): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(
      API_CONFIG.ENDPOINTS.MAILBOXES(userId),
      {
        method: 'POST',
        body: { path, ...options }
      }
    );
  }
}

// WildDuck API response types based on the source code analysis
export interface WildDuckMailbox {
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

export interface WildDuckMailboxResponse {
  success: boolean;
  results: WildDuckMailbox[];
}

export interface WildDuckMessage {
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

export interface WildDuckMessagesResponse {
  success: boolean;
  total: number;
  page: number;
  previousCursor?: string;
  nextCursor?: string;
  results: WildDuckMessage[];
}

export interface WildDuckMessageResponse {
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

// Create and export the API client instance
export const wildDuckAPI = new WildDuckAPI();

// Helper function to validate MongoDB ObjectId format
export const isValidObjectId = (id: string): boolean => {
  return /^[a-f0-9]{24}$/i.test(id);
};

// Helper function to get WildDuck user ID for an email address
// This retrieves the actual MongoDB ObjectId from session storage after authentication
export const emailToUserId = (emailAddress: string): string => {
  // Extract the wallet address part from email if it's in email format
  let username = emailAddress.toLowerCase();
  if (username.includes('@')) {
    username = username.split('@')[0]; // Extract just the address part
  }
  
  console.log('🔍 Looking for user ID for email:', emailAddress, '→ username:', username);
  
  try {
    const keys = getWildDuckStorageKeys(username);
    
    // Check storage keys in priority order
    const storageKeys = [
      { key: keys.userId, type: 'userId' },
      { key: keys.authCache, type: 'cache' },
      { key: keys.legacy, type: 'legacy' }
    ];
    
    for (const { key, type } of storageKeys) {
      const stored = sessionStorage.getItem(key);
      console.log(`🔍 Checking ${type} key "${key}":`, stored ? `found (${stored.substring(0, 10)}...)` : 'not found');
      if (stored) {
        // Check if it's a cached auth object
        if (type === 'cache') {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.userId && isValidObjectId(parsed.userId)) {
              console.log('📋 Retrieved cached WildDuck user ID:', parsed.userId, 'for:', username);
              return parsed.userId;
            }
          } catch {
            // Not JSON, skip
          }
        } else if (isValidObjectId(stored)) {
          // Valid MongoDB ObjectId format
          console.log('📋 Retrieved stored WildDuck user ID:', stored, 'for:', username);
          return stored;
        } else {
          console.warn('⚠️ Found stored value but not a valid ObjectId:', stored);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve user ID from session storage:', e);
  }
  
  // Fallback: No stored user ID found
  console.error(`❌ No stored user ID found for ${username}`);
  console.error('📝 This usually means authentication failed or the user doesn\'t exist in WildDuck');
  console.error('📝 Check the authentication response and ensure the user was created in WildDuck');
  console.error('📝 Expected: 24-character hexadecimal string (MongoDB ObjectId)');
  
  // Instead of returning a fake user ID, throw an error to surface the real issue
  throw new Error(`No WildDuck user ID found for ${username}. Authentication may have failed or user doesn't exist in database.`);
};

// Helper function to ensure a string is a valid user ID for WildDuck API calls
export const validateUserId = (userId: string): string => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!isValidObjectId(userId)) {
    throw new Error(`Invalid user ID format: "${userId}". Expected 24-character hexadecimal string (MongoDB ObjectId)`);
  }
  
  return userId;
};
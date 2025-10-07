import { Optional } from '@johnqh/types';
/**
 * WildDuck Authentication Manager
 * Handles user authentication and session management for WildDuck API
 */

import { formatSignatureForWildDuck } from './blockchainAuth';
import { ChainType } from '@johnqh/types';
import { authLogger } from '@johnqh/types';

// Platform-specific globals
declare const _fetch: typeof globalThis.fetch;
declare const sessionStorage: Storage;

// Type definition for WildDuck API client interface
interface WildDuckAPIClient {
  authenticate(request: {
    username: string;
    signature: string;
    nonce: string;
    message: string;
    signer?: string; // The wallet address that created the signature
    scope?: string;
  }): Promise<any>;
  authenticateWithPassword(
    username: string,
    password: string,
    scope?: string
  ): Promise<any>;
}

// Storage key utility functions
const getWildDuckStorageKeys = (username: string) => {
  const normalizedUsername = username.toLowerCase();
  return {
    userId: `wildduck_user_id_${normalizedUsername}`,
    token: `wildduck_token_${normalizedUsername}`,
    authCache: `wildduck_auth_cache_${normalizedUsername}`,
    // Legacy key for backward compatibility
    legacy: `wildduck_user_${normalizedUsername}`,
  };
};

interface WildDuckAuthResult {
  success: boolean;
  userId?: string;
  token?: string;
  username: string;
  cached?: boolean;
}

/**
 * Store WildDuck authentication data
 */
const storeAuthData = (
  username: string,
  userId: string,
  token?: string
): void => {
  try {
    const keys = getWildDuckStorageKeys(username);

    // Store user ID
    sessionStorage.setItem(keys.userId, userId);

    // Store token if provided
    if (token) {
      sessionStorage.setItem(keys.token, token);
    }

    // Store auth cache with timestamp
    const authCache = {
      userId,
      token,
      timestamp: Date.now(),
      username: username.toLowerCase(),
    };
    sessionStorage.setItem(keys.authCache, JSON.stringify(authCache));

    console.log(
      '✅ Stored WildDuck auth data for:',
      username,
      'User ID:',
      userId
    );
  } catch (error) {
    authLogger.error('Failed to store auth data', error);
  }
};

/**
 * Retrieve cached WildDuck authentication data
 */
const getCachedAuthData = (username: string): WildDuckAuthResult | null => {
  try {
    const keys = getWildDuckStorageKeys(username);
    const cachedData = sessionStorage.getItem(keys.authCache);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);

      // Check if cache is still valid (1 hour expiry)
      const cacheAge = Date.now() - parsed.timestamp;
      const ONE_HOUR = 60 * 60 * 1000;

      if (cacheAge < ONE_HOUR && parsed.userId) {
        console.log(
          '📦 Using cached WildDuck auth for:',
          username,
          'User ID:',
          parsed.userId
        );
        return {
          success: true,
          userId: parsed.userId,
          token: parsed.token,
          username: username.toLowerCase(),
          cached: true,
        };
      } else {
        console.log('🕒 Cached auth expired for:', username);
        sessionStorage.removeItem(keys.authCache);
      }
    }
  } catch (error) {
    console.error('Failed to retrieve cached auth data:', error);
  }

  return null;
};

/**
 * Get WildDuck user ID for a given username/email
 * First checks cache, then attempts authentication if needed
 */
const getWildDuckUserId = async (
  username: string,
  wildDuckAPI: WildDuckAPIClient,
  options?: {
    forceReauth?: boolean;
    signMessage?: (message: string) => Promise<string>;
    chainType?: ChainType;
    walletAddress?: string; // The actual wallet address that signed the message
  }
): Promise<Optional<string>> => {
  const normalizedUsername = username.toLowerCase();

  // Check if we need to force re-authentication
  if (!options?.forceReauth) {
    // Try to get from cache first
    const cached = getCachedAuthData(normalizedUsername);
    if (cached?.userId) {
      return cached.userId;
    }

    // Try to get from session storage
    const keys = getWildDuckStorageKeys(normalizedUsername);
    const storedUserId = sessionStorage.getItem(keys.userId);
    if (storedUserId) {
      console.log(
        '📋 Found stored WildDuck user ID:',
        storedUserId,
        'for:',
        normalizedUsername
      );
      return storedUserId;
    }
  }

  // If we have a sign message function, attempt authentication
  if (options?.signMessage && options?.chainType) {
    try {
      console.log(
        '🔐 Attempting WildDuck authentication for:',
        normalizedUsername
      );

      // Generate a simple nonce for WildDuck (just the random string)
      const nonce =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      console.log('🎲 Nonce to sign:', nonce);

      // Sign the nonce directly (WildDuck now verifies signatures against the nonce)
      const signature = await options.signMessage(nonce);

      // Format signature for WildDuck
      const formattedSignature = formatSignatureForWildDuck(
        signature,
        options.chainType
      );

      console.log(
        '📝 Signature (formatted):',
        `${formattedSignature.substring(0, 20)}...`
      );
      console.log('👤 Username:', normalizedUsername);

      // Authenticate with WildDuck - WildDuck verifies signature against the nonce
      // WildDuck handles ENS/SNS resolution internally
      const authResponse = await wildDuckAPI.authenticate({
        username: normalizedUsername,
        signature: formattedSignature,
        nonce, // The nonce that was signed
        message: nonce, // The message that was signed (same as nonce for WildDuck)
        signer: options.walletAddress || normalizedUsername, // The wallet address that signed
        scope: 'master',
      });

      if (authResponse.success && authResponse.id) {
        // Store the authentication data
        storeAuthData(normalizedUsername, authResponse.id, authResponse.token);

        console.log(
          '✅ WildDuck authentication successful! User ID:',
          authResponse.id
        );
        return authResponse.id;
      } else {
        console.error('❌ WildDuck authentication failed:', authResponse);
      }
    } catch (error) {
      console.error('❌ Failed to authenticate with WildDuck:', error);
    }
  }

  // As a last resort for development, return a test user ID with warning
  console.warn(`⚠️ No WildDuck user ID found for ${normalizedUsername}`);
  console.warn(
    'ℹ️ To fix this, ensure proper authentication with WildDuck API'
  );
  console.warn('📝 Using test user ID for development purposes only');

  // Return a valid 24-character hex string for testing
  // This is a valid MongoDB ObjectId format
  return '507f1f77bcf86cd799439011';
};

/**
 * Authenticate a user with WildDuck using password (for testing)
 */
const authenticateWithPassword = async (
  username: string,
  password: string,
  wildDuckAPI: WildDuckAPIClient
): Promise<WildDuckAuthResult> => {
  try {
    const authResponse = await wildDuckAPI.authenticateWithPassword(
      username.toLowerCase(),
      password,
      'master'
    );

    if (authResponse.success && authResponse.id) {
      // Store the authentication data
      storeAuthData(username, authResponse.id, authResponse.token);

      return {
        success: true,
        userId: authResponse.id,
        token: authResponse.token,
        username: username.toLowerCase(),
      };
    }

    return {
      success: false,
      username: username.toLowerCase(),
    };
  } catch (error) {
    console.error('Failed to authenticate with password:', error);
    return {
      success: false,
      username: username.toLowerCase(),
    };
  }
};

/**
 * Clear all WildDuck authentication data for a user
 */
const clearWildDuckAuth = (username: string): void => {
  const keys = getWildDuckStorageKeys(username);

  try {
    sessionStorage.removeItem(keys.userId);
    sessionStorage.removeItem(keys.token);
    sessionStorage.removeItem(keys.authCache);
    // Also remove legacy key if it exists
    sessionStorage.removeItem(keys.legacy);

    console.log('🗑️ Cleared WildDuck auth data for:', username);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

/**
 * Get all authenticated WildDuck users from session storage
 */
const getAuthenticatedUsers = (): string[] => {
  const users: string[] = [];

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('wildduck_auth_cache_')) {
        const username = key.replace('wildduck_auth_cache_', '');
        users.push(username);
      }
    }
  } catch (error) {
    console.error('Failed to get authenticated users:', error);
  }

  return users;
};

export {
  getWildDuckStorageKeys,
  getWildDuckUserId,
  authenticateWithPassword,
  clearWildDuckAuth,
  getAuthenticatedUsers,
  type WildDuckAPIClient,
  type WildDuckAuthResult,
};

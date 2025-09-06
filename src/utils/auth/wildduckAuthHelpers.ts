/**
 * Utility helper class for WildDuck Authentication operations
 * These functions are for data modification operations (POST/DELETE)
 */

import { AppConfig } from '../../types';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

interface PreAuthParams {
  username: string;
  scope?: string;
}

interface AuthenticateParams {
  username: string;
  signature: string;
  nonce?: string;
  message?: string;
  scope?: string;
  protocol?: string;
  sess?: string;
  ip?: string;
}

const getWildDuckBaseUrl = (appConfig: AppConfig): string => {
  return appConfig.wildDuckBackendUrl;
};

/**
 * WildDuck Authentication Helper Class
 * Contains methods for authentication operations that modify data
 */
class WildDuckAuthHelper {
  /**
   * Pre-authentication check
   */
  static async preAuth(
    appConfig: AppConfig,
    params: PreAuthParams
  ): Promise<{
    success: boolean;
    id: string;
    username: string;
    scope: string[];
    require2fa: string[];
    requirePasswordChange: boolean;
    message?: string;
    nonce?: string;
  }> {
    const response = await fetch(`${getWildDuckBaseUrl(appConfig)}/preauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Authenticate with blockchain signature
   */
  static async authenticate(
    appConfig: AppConfig,
    params: AuthenticateParams
  ): Promise<{
    success: boolean;
    id: string;
    username: string;
    scope: string[];
    token: string;
    require2fa: string[];
    requirePasswordChange: boolean;
  }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/authenticate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Invalidate authentication token (logout)
   */
  static async logout(
    appConfig: AppConfig,
    token?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/authenticate`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }
}

export { WildDuckAuthHelper, type PreAuthParams, type AuthenticateParams };

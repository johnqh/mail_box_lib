/**
 * Utility helper class for WildDuck Address operations
 * These functions are for data modification operations (POST/PUT/DELETE)
 */

import { AppConfig } from '../../types';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

export interface CreateAddressParams {
  address: string;
  name?: string;
  main?: boolean;
  metaData?: any;
  tags?: string[];
}

export interface UpdateAddressParams {
  address?: string;
  name?: string;
  main?: boolean;
  metaData?: any;
  tags?: string[];
}

export interface CreateForwardedAddressParams {
  address: string;
  name?: string;
  targets: string[];
  forwards?: number;
  allowWildcard?: boolean;
  autoreply?: {
    status?: boolean;
    name?: string;
    subject?: string;
    text?: string;
    html?: string;
    start?: string;
    end?: string;
  };
  tags?: string[];
}

export interface UpdateForwardedAddressParams {
  name?: string;
  targets?: string[];
  forwards?: number;
  allowWildcard?: boolean;
  autoreply?: {
    status?: boolean;
    name?: string;
    subject?: string;
    text?: string;
    html?: string;
    start?: string;
    end?: string;
  };
  tags?: string[];
}

const getWildDuckBaseUrl = (appConfig: AppConfig): string => {
  return appConfig.wildDuckBackendUrl;
};

/**
 * WildDuck Address Helper Class
 * Contains methods for address operations that modify data
 */
export class WildDuckAddressHelper {
  /**
   * Create new address for user
   */
  static async createUserAddress(
    appConfig: AppConfig,
    userId: string,
    params: CreateAddressParams
  ): Promise<{ success: boolean; id: string }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/users/${encodeURIComponent(userId)}/addresses`,
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
   * Update user address information
   */
  static async updateUserAddress(
    appConfig: AppConfig,
    userId: string,
    addressId: string,
    params: UpdateAddressParams
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(addressId)}`,
      {
        method: 'PUT',
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
   * Delete user address
   */
  static async deleteUserAddress(
    appConfig: AppConfig,
    userId: string,
    address: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(address)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Create new forwarded address
   */
  static async createForwardedAddress(
    appConfig: AppConfig,
    params: CreateForwardedAddressParams
  ): Promise<{ success: boolean; id: string }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/addresses/forwarded`,
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
   * Update forwarded address information
   */
  static async updateForwardedAddress(
    appConfig: AppConfig,
    addressId: string,
    params: UpdateForwardedAddressParams
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/addresses/forwarded/${encodeURIComponent(addressId)}`,
      {
        method: 'PUT',
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
   * Delete forwarded address
   */
  static async deleteForwardedAddress(
    appConfig: AppConfig,
    address: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/addresses/forwarded/${encodeURIComponent(address)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Rename domain in addresses
   */
  static async renameDomain(
    appConfig: AppConfig,
    oldDomain: string,
    newDomain: string
  ): Promise<{ success: boolean; modified: number }> {
    const response = await fetch(
      `${getWildDuckBaseUrl(appConfig)}/addresses/renameDomain`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldDomain, newDomain }),
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

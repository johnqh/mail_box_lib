/**
 * Utility helper class for WildDuck User management operations
 * These functions are for data modification operations (POST/PUT/DELETE)
 */

import { webAppConfig } from './env.web';

export interface CreateUserParams {
  username: string;
  password?: string;
  address?: string;
  name?: string;
  quota?: number;
  language?: string;
  retention?: number;
  tags?: string[];
}

export interface UpdateUserParams {
  name?: string;
  quota?: number;
  language?: string;
  retention?: number;
  disabled?: boolean;
  suspended?: boolean;
  tags?: string[];
}

const getWildDuckBaseUrl = (): string => {
  return webAppConfig.wildDuckBackendUrl;
};

/**
 * WildDuck User Helper Class
 * Contains methods for user management operations that modify data
 */
export class WildDuckUserHelper {
  /**
   * Create a new user
   */
  static async createUser(params: CreateUserParams): Promise<{ success: boolean; id: string }> {
    const response = await fetch(`${getWildDuckBaseUrl()}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, params: UpdateUserParams): Promise<{ success: boolean }> {
    const response = await fetch(`${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Reset user password
   */
  static async resetPassword(userId: string, password: string): Promise<{ success: boolean }> {
    const response = await fetch(`${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Recalculate user quota
   */
  static async resetQuota(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/quota/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Cancel user deletion task (restore user)
   */
  static async restoreUser(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }
}
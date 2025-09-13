import { useCallback, useState } from 'react';
import axios from 'axios';
import { WildDuckConfig } from '../../../network/clients/wildduck';

interface WildduckUser {
  success: boolean;
  id: string;
  username: string;
  address?: string;
  name?: string;
  language?: string;
  quota?: {
    allowed: number;
    used: number;
  };
  hasPasswordSet?: boolean;
  activated?: boolean;
  disabled?: boolean;
  suspended?: boolean;
}

interface UseWildduckUsersReturn {
  isLoading: boolean;
  error: string | null;
  getUser: (userId: string) => Promise<WildduckUser>;
  getUsers: (
    query?: string,
    limit?: number
  ) => Promise<{ users: WildduckUser[]; total: number }>;
  clearError: () => void;
}

/**
 * Hook for WildDuck user management operations
 */
const useWildduckUsers = (config: WildDuckConfig): UseWildduckUsersReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUser = useCallback(async (userId: string): Promise<WildduckUser> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use configured URL
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Set authentication headers based on configuration
      if (config.cloudflareWorkerUrl) {
        headers['Authorization'] = `Bearer ${config.apiToken}`;
        headers['X-App-Source'] = '0xmail-box';
      } else {
        headers['X-Access-Token'] = config.apiToken;
      }

      const response = await axios.get(`${apiUrl}/users/${userId}`, { headers });
      return response.data as WildduckUser;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get user';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const getUsers = useCallback(
    async (
      query?: string,
      limit: number = 20
    ): Promise<{ users: WildduckUser[]; total: number }> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        params.set('limit', limit.toString());

        // Use configured URL
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        // Set authentication headers based on configuration
        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.get(
          `${apiUrl}/users?${params}`,
          { headers }
        );

        const usersData = response.data as { results?: WildduckUser[], total?: number };
        return {
          users: usersData.results || [],
          total: usersData.total || 0,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get users';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [config]
  );

  return {
    isLoading,
    error,
    getUser,
    getUsers,
    clearError,
  };
};

export {
  useWildduckUsers,
  type WildduckUser,
  type UseWildduckUsersReturn
};
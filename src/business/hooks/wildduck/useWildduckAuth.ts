import { useCallback, useState } from 'react';
import axios from 'axios';
import { WildDuckAPI } from '../../../network/clients/wildduck';
import { useStorageService } from '../core/useServices';

interface AuthResponse {
  success: boolean;
  token?: string;
  id?: string;
  username?: string;
  address?: string;
  scope?: string;
}

interface PreAuthResponse {
  success: boolean;
  id?: string;
  username?: string;
  address?: string;
  scope?: string;
}

interface UseWildduckAuthReturn {
  isLoading: boolean;
  error: string | null;
  getAuthStatus: () => Promise<{ authenticated: boolean; user?: any }>;
  clearError: () => void;
}

/**
 * Hook for WildDuck authentication operations
 */
const useWildduckAuth = (): UseWildduckAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageService = useStorageService();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAuthStatus = useCallback(async (): Promise<{
    authenticated: boolean;
    user?: any;
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user has valid token or authentication status
      const token = await storageService.getItem('wildduck_token');
      if (!token) {
        return { authenticated: false };
      }

      // Validate token by making a test request
      try {
        const response = await axios.get(`${WildDuckAPI['baseUrl']}/users/me`, {
          headers: {
            ...WildDuckAPI['headers'],
            Authorization: `Bearer ${token}`,
          },
        });

        return { authenticated: true, user: response.data };
      } catch {
        return { authenticated: false };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check auth status';
      setError(errorMessage);
      return { authenticated: false };
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  return {
    isLoading,
    error,
    getAuthStatus,
    clearError,
  };
};

export {
  useWildduckAuth,
  type AuthResponse,
  type PreAuthResponse,
  type UseWildduckAuthReturn
};
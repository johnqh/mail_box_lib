import { useCallback, useState } from 'react';
import axios from 'axios';
import { useStorageService } from '../core/useServices';
import { WildDuckConfig } from '../../../network/clients/wildduck';

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
const useWildduckAuth = (config: WildDuckConfig): UseWildduckAuthReturn => {
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

      // Use cloudflare worker URL if available, otherwise use backend URL
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;

      // Validate token by making a test request
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        // Set authentication headers based on configuration
        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = token;
        }

        const response = await axios.get(`${apiUrl}/users/me`, { headers });

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
  }, [config, storageService]);

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
import { useCallback, useState } from 'react';
import axios from 'axios';
import { useStorageService } from '../core/useServices';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import type {
  AuthenticateRequest,
  PreAuthRequest,
} from '@johnqh/types';
import {
  createAuthenticateRequest,
  createPreAuthRequest,
} from '@johnqh/types';
import type {
  AuthenticationResponse,
  PreAuthResponse,
} from '../../../types/api/wildduck-responses';

interface UseWildduckAuthReturn {
  isLoading: boolean;
  error: string | null;
  getAuthStatus: () => Promise<{ authenticated: boolean; user?: any }>;
  preAuth: (params: Omit<PreAuthRequest, 'sess' | 'ip'>) => Promise<PreAuthResponse>;
  authenticate: (params: Omit<AuthenticateRequest, 'sess' | 'ip'>) => Promise<AuthenticationResponse>;
  logout: (token?: string) => Promise<{ success: boolean }>;
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

  const preAuth = useCallback(async (params: Omit<PreAuthRequest, 'sess' | 'ip'>): Promise<PreAuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const requestBody = createPreAuthRequest(params.username, {
        ...(params.scope && { scope: params.scope }),
        sess: 'api-session',
        ip: '127.0.0.1',
      });

      const response = await axios.post(`${apiUrl}/preauth`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data as PreAuthResponse;
    } catch (err: unknown) {
      const errorMessage = (err as any)?.response?.data?.error || 
                          (err instanceof Error ? err.message : 'Pre-authentication failed');
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const authenticate = useCallback(async (params: Omit<AuthenticateRequest, 'sess' | 'ip'>): Promise<AuthenticationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const requestBody = createAuthenticateRequest(
        params.username,
        params.signature,
        params.nonce,
        params.message,
        {
          ...(params.scope && { scope: params.scope }),
          ...(params.protocol && { protocol: params.protocol }),
          ...(params.token !== undefined && { token: params.token }),
          ...(params.appId && { appId: params.appId }),
          sess: 'api-session',
          ip: '127.0.0.1',
        }
      );

      const response = await axios.post(`${apiUrl}/authenticate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = response.data as AuthenticationResponse;

      // Store token if authentication was successful
      if (result.success && result.token) {
        await storageService.setItem('wildduck_token', result.token);
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = (err as any)?.response?.data?.error || 
                          (err instanceof Error ? err.message : 'Authentication failed');
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [config, storageService]);

  const logout = useCallback(async (token?: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const authToken = token || await storageService.getItem('wildduck_token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${authToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = authToken;
        }
      }

      const response = await axios.delete(`${apiUrl}/authenticate`, { headers });

      const result = response.data as { success: boolean };

      // Clear stored token on successful logout
      if (result.success) {
        await storageService.removeItem('wildduck_token');
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = (err as any)?.response?.data?.error || 
                          (err instanceof Error ? err.message : 'Logout failed');
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [config, storageService]);

  return {
    isLoading,
    error,
    getAuthStatus,
    preAuth,
    authenticate,
    logout,
    clearError,
  };
};

export {
  useWildduckAuth,
  type UseWildduckAuthReturn,
};
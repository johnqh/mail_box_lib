import { useState, useCallback } from 'react';
import { WildDuckAPI } from "../../../network/clients/wildduck";
import { useStorageService } from '../useServices';

export interface AuthResponse {
  success: boolean;
  token?: string;
  id?: string;
  username?: string;
  address?: string;
  scope?: string;
}

export interface PreAuthResponse {
  success: boolean;
  id?: string;
  username?: string;
  address?: string;
  scope?: string;
}

export interface UseWildduckAuthReturn {
  isLoading: boolean;
  error: string | null;
  getAuthStatus: () => Promise<{ authenticated: boolean; user?: any }>;
  clearError: () => void;
}

/**
 * Hook for WildDuck authentication operations
 */
export const useWildduckAuth = (): UseWildduckAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageService = useStorageService();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAuthStatus = useCallback(async (): Promise<{ authenticated: boolean; user?: any }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user has valid token or authentication status
      const token = await storageService.getItem('wildduck_token');
      if (!token) {
        return { authenticated: false };
      }

      // Validate token by making a test request
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users/me`, {
        headers: {
          ...WildDuckAPI['headers'],
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        return { authenticated: true, user };
      } else {
        return { authenticated: false };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check auth status';
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
    clearError
  };
};
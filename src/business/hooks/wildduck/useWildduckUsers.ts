import { useState, useCallback } from 'react';
import { WildDuckAPI } from "../../../network/clients/wildduck";

export interface WildduckUser {
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

export interface UseWildduckUsersReturn {
  isLoading: boolean;
  error: string | null;
  getUser: (userId: string) => Promise<WildduckUser>;
  getUsers: (query?: string, limit?: number) => Promise<{ users: WildduckUser[]; total: number }>;
  clearError: () => void;
}

/**
 * Hook for WildDuck user management operations
 */
export const useWildduckUsers = (): UseWildduckUsersReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUser = useCallback(async (userId: string): Promise<WildduckUser> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await WildDuckAPI.getUser(userId);
      return response as WildduckUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUsers = useCallback(async (query?: string, limit: number = 20): Promise<{ users: WildduckUser[]; total: number }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      params.set('limit', limit.toString());
      
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users?${params}`, {
        method: 'GET',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { users: result.results || [], total: result.total || 0 };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get users';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getUser,
    getUsers,
    clearError
  };
};
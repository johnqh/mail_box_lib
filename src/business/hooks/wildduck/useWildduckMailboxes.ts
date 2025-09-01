import { useState, useCallback } from 'react';
import { WildDuckAPI, WildDuckMailbox, WildDuckMailboxResponse } from "../../../network/clients/wildduck";

export interface CreateMailboxParams {
  path: string;
  hidden?: boolean;
  retention?: number;
}

export interface UpdateMailboxParams {
  path?: string;
  retention?: number;
  subscribed?: boolean;
  hidden?: boolean;
}

export interface UseWildduckMailboxesReturn {
  isLoading: boolean;
  error: string | null;
  mailboxes: WildDuckMailbox[];
  getMailboxes: (userId: string, options?: {
    specialUse?: boolean;
    showHidden?: boolean;
    counters?: boolean;
    sizes?: boolean;
  }) => Promise<WildDuckMailbox[]>;
  createMailbox: (userId: string, params: CreateMailboxParams) => Promise<{ success: boolean; id: string }>;
  updateMailbox: (userId: string, mailboxId: string, params: UpdateMailboxParams) => Promise<{ success: boolean }>;
  deleteMailbox: (userId: string, mailboxId: string) => Promise<{ success: boolean }>;
  clearError: () => void;
  refresh: (userId: string) => Promise<void>;
}

/**
 * Hook for WildDuck mailbox operations
 */
export const useWildduckMailboxes = (): UseWildduckMailboxesReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mailboxes, setMailboxes] = useState<WildDuckMailbox[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getMailboxes = useCallback(async (userId: string, options = {}): Promise<WildDuckMailbox[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: WildDuckMailboxResponse = await WildDuckAPI.getMailboxes(userId, options);
      const mailboxList = response.results || [];
      setMailboxes(mailboxList);
      return mailboxList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get mailboxes';
      setError(errorMessage);
      setMailboxes([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMailbox = useCallback(async (userId: string, params: CreateMailboxParams): Promise<{ success: boolean; id: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await WildDuckAPI.createMailbox(userId, params.path, {
        hidden: params.hidden,
        retention: params.retention
      });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mailbox';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMailbox = useCallback(async (userId: string, mailboxId: string, params: UpdateMailboxParams): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users/${userId}/mailboxes/${mailboxId}`, {
        method: 'PUT',
        headers: WildDuckAPI['headers'],
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mailbox';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteMailbox = useCallback(async (userId: string, mailboxId: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users/${userId}/mailboxes/${mailboxId}`, {
        method: 'DELETE',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mailbox';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async (userId: string): Promise<void> => {
    await getMailboxes(userId, { counters: true });
  }, [getMailboxes]);

  return {
    isLoading,
    error,
    mailboxes,
    getMailboxes,
    createMailbox,
    updateMailbox,
    deleteMailbox,
    clearError,
    refresh
  };
};
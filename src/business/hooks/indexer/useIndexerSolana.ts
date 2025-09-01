import { useState, useCallback } from 'react';
import { useAppConfig } from '../useServices';

export interface IndexerSolanaIndexer {
  chainId: number;
  initialized: boolean;
  networkName: string;
}

export interface IndexerSolanaStatus {
  solanaIndexers: IndexerSolanaIndexer[];
  totalIndexers: number;
  configured: boolean;
}

export interface IndexerSolanaWebhookResponse {
  success: boolean;
  processed: number;
  total: number;
}

export interface IndexerSolanaSetupResult {
  chainId: string;
  status: 'success' | 'error';
  error?: string;
}

export interface IndexerSolanaSetupResponse {
  success: boolean;
  results: IndexerSolanaSetupResult[];
}

export interface UseIndexerSolanaReturn {
  isLoading: boolean;
  error: string | null;
  getSolanaStatus: () => Promise<IndexerSolanaStatus>;
  setupWebhooks: () => Promise<IndexerSolanaSetupResponse>;
  processTestTransaction: (chainId: number, transaction: any) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

/**
 * React hook for Indexer Solana API operations
 */
export const useIndexerSolana = (): UseIndexerSolanaReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appConfig = useAppConfig();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getSolanaStatus = useCallback(async (): Promise<IndexerSolanaStatus> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/api/solana/status`, {
        method: 'GET',
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Solana status';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const setupWebhooks = useCallback(async (): Promise<IndexerSolanaSetupResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/api/solana/setup-webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup webhooks';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const processTestTransaction = useCallback(async (
    chainId: number, 
    transaction: any
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/api/solana/test-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId,
          transaction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process test transaction';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  return {
    isLoading,
    error,
    getSolanaStatus,
    setupWebhooks,
    processTestTransaction,
    clearError,
  };
};
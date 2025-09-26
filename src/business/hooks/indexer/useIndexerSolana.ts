import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { IndexerClient } from '../../../network/clients/indexer';
import type {
  SolanaSetupResponse,
  SolanaStatusResponse,
  SolanaTestTransactionResponse,
} from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseIndexerSolanaReturn {
  isLoading: boolean;
  error: Optional<string>;
  getSolanaStatus: () => Promise<SolanaStatusResponse>;
  setupWebhooks: () => Promise<SolanaSetupResponse>;
  processTestTransaction: (
    chainId: number,
    transaction: any
  ) => Promise<SolanaTestTransactionResponse>;
  clearError: () => void;
}

/**
 * React hook for Indexer Solana API operations
 */
const useIndexerSolana = (endpointUrl: string, dev: boolean = false, devMode: boolean = false): UseIndexerSolanaReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);
  const indexerClient = new IndexerClient(endpointUrl, dev);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getSolanaStatus =
    useCallback(async (): Promise<SolanaStatusResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await indexerClient.getSolanaStatus();
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get Solana status';
        setError(errorMessage);
        
        // Return mock data in devMode when API fails
        if (devMode) {
          console.warn('[DevMode] getSolanaStatus failed, returning mock data:', errorMessage);
          return IndexerMockData.getSolanaStatus();
        }
        
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [indexerClient, devMode]);

  const setupWebhooks =
    useCallback(async (): Promise<SolanaSetupResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await indexerClient.setupSolanaWebhooks();
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to setup webhooks';
        setError(errorMessage);
        
        // Return mock data in devMode when API fails
        if (devMode) {
          console.warn('[DevMode] setupWebhooks failed, returning mock data:', errorMessage);
          return IndexerMockData.getSolanaSetup();
        }
        
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [indexerClient, devMode]);

  const processTestTransaction = useCallback(
    async (
      chainId: number,
      transaction: any
    ): Promise<SolanaTestTransactionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await indexerClient.processSolanaTestTransaction(
          chainId,
          transaction
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to process test transaction';
        setError(errorMessage);
        
        // Return mock data in devMode when API fails
        if (devMode) {
          console.warn('[DevMode] processTestTransaction failed, returning mock data:', errorMessage);
          return IndexerMockData.getSolanaTestTransaction();
        }
        
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient, devMode]
  );

  return {
    isLoading,
    error,
    getSolanaStatus,
    setupWebhooks,
    processTestTransaction,
    clearError,
  };
};

export {
  useIndexerSolana,
  type UseIndexerSolanaReturn
};
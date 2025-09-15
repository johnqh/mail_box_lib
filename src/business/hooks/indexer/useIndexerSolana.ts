import { useCallback, useState } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import type {
  SolanaStatusResponse,
  SolanaWebhooksResponse,
  TestTransactionResponse,
} from '../../../types/api/indexer-responses';

interface UseIndexerSolanaReturn {
  isLoading: boolean;
  error: string | null;
  getSolanaStatus: () => Promise<SolanaStatusResponse>;
  setupWebhooks: () => Promise<SolanaWebhooksResponse>;
  processTestTransaction: (
    chainId: number,
    transaction: any
  ) => Promise<TestTransactionResponse>;
  clearError: () => void;
}

/**
 * React hook for Indexer Solana API operations
 */
const useIndexerSolana = (endpointUrl: string, dev: boolean = false): UseIndexerSolanaReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [indexerClient]);

  const setupWebhooks =
    useCallback(async (): Promise<SolanaWebhooksResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await indexerClient.setupSolanaWebhooks();
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to setup webhooks';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [indexerClient]);

  const processTestTransaction = useCallback(
    async (
      chainId: number,
      transaction: any
    ): Promise<TestTransactionResponse> => {
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
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
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
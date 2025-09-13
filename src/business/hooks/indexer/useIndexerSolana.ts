import { useCallback, useState } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';

interface IndexerSolanaIndexer {
  chainId: number;
  initialized: boolean;
  networkName: string;
}

interface IndexerSolanaStatus {
  solanaIndexers: IndexerSolanaIndexer[];
  totalIndexers: number;
  configured: boolean;
}

interface IndexerSolanaWebhookResponse {
  success: boolean;
  processed: number;
  total: number;
}

interface IndexerSolanaSetupResult {
  chainId: string;
  status: 'success' | 'error';
  error?: string;
}

interface IndexerSolanaSetupResponse {
  success: boolean;
  results: IndexerSolanaSetupResult[];
}

interface UseIndexerSolanaReturn {
  isLoading: boolean;
  error: string | null;
  getSolanaStatus: () => Promise<IndexerSolanaStatus>;
  setupWebhooks: () => Promise<IndexerSolanaSetupResponse>;
  processTestTransaction: (
    chainId: number,
    transaction: any
  ) => Promise<{ success: boolean; message: string }>;
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
    useCallback(async (): Promise<IndexerSolanaStatus> => {
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
    useCallback(async (): Promise<IndexerSolanaSetupResponse> => {
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
    ): Promise<{ success: boolean; message: string }> => {
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
  type IndexerSolanaIndexer,
  type IndexerSolanaStatus,
  type IndexerSolanaWebhookResponse,
  type IndexerSolanaSetupResult,
  type IndexerSolanaSetupResponse,
  type UseIndexerSolanaReturn
};
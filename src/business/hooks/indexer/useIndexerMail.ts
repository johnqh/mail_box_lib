import { useCallback } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';
import type {
  AddressValidationResponse,
  Optional,
  SignInMessageResponse,
} from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseIndexerMailReturn {
  isLoading: boolean;
  error: Optional<string>;
  validateUsername: (username: string) => Promise<Optional<AddressValidationResponse>>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations (public endpoints only)
 * Note: Signature-protected endpoints have been removed as clients cannot generate proper signatures
 */
const useIndexerMail = (endpointUrl: string, dev: boolean = false, devMode: boolean = false): UseIndexerMailReturn => {
  const indexerClient = new IndexerClient(endpointUrl, dev);
  const { isLoading, error, clearError, execute } = useApiCall({
    context: 'IndexerMail',
  });

  const validateUsername = useCallback(
    execute(async (username: string) => {
      try {
        return await indexerClient.validateUsername(username);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] validateUsername failed, returning mock data:', err);
          return IndexerMockData.getValidation(username);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getSigningMessage = useCallback(
    execute(async (walletAddress: string, chainId: number, domain: string, url: string) => {
      try {
        return await indexerClient.getMessage(chainId, walletAddress, domain, url);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getSigningMessage failed, returning mock data:', err);
          return IndexerMockData.getSigningMessage(walletAddress, chainId, domain);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  return {
    isLoading,
    error,
    validateUsername,
    getSigningMessage,
    clearError,
  };
};

export {
  useIndexerMail,
  type UseIndexerMailReturn
};
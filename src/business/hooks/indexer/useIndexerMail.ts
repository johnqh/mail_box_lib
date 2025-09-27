import { useCallback } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';
import type {
  AddressValidationResponse,
  DelegatedFromResponse,
  DelegatedToResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  NonceResponse,
  Optional,
  SignInMessageResponse,
} from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated';
  source?: string;
}


interface UseIndexerMailReturn {
  isLoading: boolean;
  error: Optional<string>;
  validateUsername: (username: string) => Promise<Optional<AddressValidationResponse>>;
  getEmailAccounts: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  getEmailAddresses: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  getDelegatedAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedToResponse>>;
  getDelegatorsToAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedFromResponse>>;
  // Signature verification functionality has been removed from the new types
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;
  getNonce: (
    username: string,
    signature: string,
    message?: string
  ) => Promise<Optional<NonceResponse>>;
  createNonce: (
    username: string,
    signature: string,
    message?: string
  ) => Promise<Optional<NonceResponse>>;
  getNameServiceEntitlement: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<EntitlementResponse>>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
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

  const getEmailAccounts = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getEmailAccounts(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getEmailAccounts failed, returning mock data:', err);
          return IndexerMockData.getEmailAccounts();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  // Backward compatibility - deprecated
  const getEmailAddresses = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getEmailAddresses(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getEmailAddresses failed, returning mock data:', err);
          return IndexerMockData.getEmailAddresses();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getDelegatedAddress = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getDelegated(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getDelegatedAddress failed, returning mock data:', err);
          return IndexerMockData.getDelegation();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getDelegatorsToAddress = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getDelegatedTo(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getDelegatorsToAddress failed, returning mock data:', err);
          return IndexerMockData.getDelegators();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  // Signature verification functionality has been removed from the new types
  // This may need to be handled differently now

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

  const getNonce = useCallback(
    execute(async (username: string, signature: string, message?: string) => {
      try {
        return await indexerClient.getNonce(username, signature, message || '');
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getNonce failed, returning mock data:', err);
          return IndexerMockData.getNonce();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const createNonce = useCallback(
    execute(async (username: string, signature: string, message?: string) => {
      try {
        return await indexerClient.createNonce(username, signature, message || '');
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] createNonce failed, returning mock data:', err);
          return {
            success: true,
            data: {
              nonce: Math.floor(Math.random() * 1000000).toString(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            },
            timestamp: new Date().toISOString()
          } as unknown as NonceResponse;
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getNameServiceEntitlement = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.checkNameServiceEntitlement(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getNameServiceEntitlement failed, returning mock data:', err);
          return IndexerMockData.getEntitlement();
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
    getEmailAccounts,
    getEmailAddresses,
    getDelegatedAddress,
    getDelegatorsToAddress,
    // verifySignature removed - not available in new types
    getSigningMessage,
    getNonce,
    createNonce,
    getNameServiceEntitlement,
    clearError,
  };
};

export {
  useIndexerMail,
  type IndexerEmailAddress,
  type UseIndexerMailReturn
};
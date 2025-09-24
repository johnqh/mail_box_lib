import { useCallback } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';
import type {
  DelegationResponse,
  DelegatorsResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  NonceResponse,
  Optional,
  SignatureVerificationResponse,
  SimpleMessageResponse,
  ValidationResponse,
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
  validateUsername: (username: string) => Promise<Optional<ValidationResponse>>;
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
  ) => Promise<Optional<DelegationResponse>>;
  getDelegatorsToAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatorsResponse>>;
  verifySignature: (
    username: string,
    signature: string,
    message: string
  ) => Promise<Optional<SignatureVerificationResponse>>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SimpleMessageResponse>>;
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

  const verifySignature = useCallback(
    execute(async (username: string, signature: string, message: string) => {
      try {
        return await indexerClient.verifySignature(username, signature, message || '');
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] verifySignature failed, returning mock data:', err);
          return IndexerMockData.getSignatureVerification(username, signature, message);
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
    verifySignature,
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
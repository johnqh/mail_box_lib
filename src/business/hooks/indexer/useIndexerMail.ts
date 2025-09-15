import { useCallback } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';
import type {
  AddressValidationResponse,
  DelegatedToResponse,
  DelegationResponse,
  EmailAddressesResponse,
  EntitlementResponse,
  MessageGenerationResponse,
  NonceResponse,
  SignatureVerificationResponse,
} from '../../../types/api/indexer-responses';

interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated';
  source?: string;
}


interface UseIndexerMailReturn {
  isLoading: boolean;
  error: string | null;
  validateAddress: (address: string) => Promise<AddressValidationResponse | undefined>;
  getEmailAddresses: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<EmailAddressesResponse | undefined>;
  getDelegatedAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<DelegationResponse | undefined>;
  getDelegatorsToAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<DelegatedToResponse | undefined>;
  verifySignature: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<SignatureVerificationResponse | undefined>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<MessageGenerationResponse | undefined>;
  getNonce: (
    walletAddress: string,
    signature: string,
    message?: string
  ) => Promise<NonceResponse | undefined>;
  createNonce: (
    walletAddress: string,
    signature: string,
    message?: string
  ) => Promise<NonceResponse | undefined>;
  getNameServiceEntitlement: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<EntitlementResponse | undefined>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
 */
const useIndexerMail = (endpointUrl: string, dev: boolean = false): UseIndexerMailReturn => {
  const indexerClient = new IndexerClient(endpointUrl, dev);
  const { isLoading, error, clearError, execute } = useApiCall({
    context: 'IndexerMail',
  });

  const validateAddress = useCallback(
    execute((address: string) => indexerClient.validateAddress(address)),
    [execute, indexerClient]
  );

  const getEmailAddresses = useCallback(
    execute((walletAddress: string, signature: string, message: string) =>
      indexerClient.getEmailAddresses(walletAddress, signature, message)
    ),
    [execute, indexerClient]
  );

  const getDelegatedAddress = useCallback(
    execute((walletAddress: string, signature: string, message: string) =>
      indexerClient.getDelegated(walletAddress, signature, message)
    ),
    [execute, indexerClient]
  );

  const getDelegatorsToAddress = useCallback(
    execute((walletAddress: string, signature: string, message: string) =>
      indexerClient.getDelegatedTo(walletAddress, signature, message)
    ),
    [execute, indexerClient]
  );

  const verifySignature = useCallback(
    execute((walletAddress: string, signature: string, message: string) =>
      indexerClient.verifySignature(walletAddress, signature, message || '')
    ),
    [execute, indexerClient]
  );

  const getSigningMessage = useCallback(
    execute((walletAddress: string, chainId: number, domain: string, url: string) =>
      indexerClient.getMessage(chainId, walletAddress, domain, url)
    ),
    [execute, indexerClient]
  );

  const getNonce = useCallback(
    execute((walletAddress: string, signature: string, message?: string) =>
      indexerClient.getNonce(walletAddress, signature, message || '')
    ),
    [execute, indexerClient]
  );

  const createNonce = useCallback(
    execute((walletAddress: string, signature: string, message?: string) =>
      indexerClient.createNonce(walletAddress, signature, message || '')
    ),
    [execute, indexerClient]
  );

  const getNameServiceEntitlement = useCallback(
    execute((walletAddress: string, signature: string, message: string) =>
      indexerClient.checkNameServiceEntitlement(walletAddress, signature, message)
    ),
    [execute, indexerClient]
  );

  return {
    isLoading,
    error,
    validateAddress,
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
import { useCallback } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';

interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated';
  source?: string;
}

interface IndexerEmailResponse {
  walletAddress: string;
  addressType: string;
  addresses: Array<{
    walletAddress: string;
    names: string[];
  }>;
  verified: boolean;
  timestamp: string;
}

interface IndexerDelegationInfo {
  walletAddress: string;
  addressType: string;
  hasDelegation: boolean;
  delegatedTo: string | null;
  chainId: number | null;
  isActive: boolean;
  verified: boolean;
  timestamp: string;
}

interface IndexerDelegatorInfo {
  walletAddress: string;
  addressType: string;
  delegators: Array<{
    delegatorAddress: string;
    isActive: boolean;
    chainId: number;
  }>;
  totalDelegators: number;
  verified: boolean;
  timestamp: string;
}

interface IndexerSignatureVerification {
  walletAddress: string;
  addressType: string;
  isValid: boolean;
  message: string;
  timestamp: string;
}

interface IndexerSigningMessage {
  walletAddress: string;
  addressType: string;
  chainId: number;
  domain: string;
  uri: string;
  messages: {
    deterministic?: string;
    simple?: string;
    solana?: string;
    info?: any;
  };
  recommended: string;
  instructions: any;
  verification: any;
  regeneration: any;
  timestamp: string;
}

interface IndexerNonceInfo {
  walletAddress: string;
  addressType: string;
  nonce: string;
  createdAt?: string;
  updatedAt?: string;
  message: string;
  timestamp: string;
}

interface IndexerEntitlement {
  walletAddress: string;
  addressType: string;
  entitlement: {
    type: string;
    hasEntitlement: boolean;
    isActive: boolean;
    productIdentifier?: string;
    expiresDate?: string;
    store?: string;
  };
  message: string;
  error?: string;
  timestamp: string;
}

interface ValidateAddressResponse {
  isValid: boolean;
  addressType: string;
  normalizedAddress: string;
  formats?: {
    standard: string;
    checksummed?: string;
    compressed?: string;
  };
  message?: string;
  error?: string;
  timestamp: string;
}

interface UseIndexerMailReturn {
  isLoading: boolean;
  error: string | null;
  validateAddress: (address: string) => Promise<ValidateAddressResponse | undefined>;
  getEmailAddresses: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerEmailResponse | undefined>;
  getDelegatedAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerDelegationInfo | undefined>;
  getDelegatorsToAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerDelegatorInfo | undefined>;
  verifySignature: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerSignatureVerification | undefined>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<IndexerSigningMessage | undefined>;
  getNonce: (
    walletAddress: string,
    signature: string,
    message?: string
  ) => Promise<IndexerNonceInfo | undefined>;
  createNonce: (
    walletAddress: string,
    signature: string,
    message?: string
  ) => Promise<IndexerNonceInfo | undefined>;
  getNameServiceEntitlement: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerEntitlement | undefined>;
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
  type IndexerEmailResponse,
  type IndexerDelegationInfo,
  type IndexerDelegatorInfo,
  type IndexerSignatureVerification,
  type IndexerSigningMessage,
  type IndexerNonceInfo,
  type IndexerEntitlement,
  type ValidateAddressResponse,
  type UseIndexerMailReturn
};
import { useCallback } from 'react';
import { useAppConfig } from '../useServices';
import { convertToAppConfig } from './utils';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';

export interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated';
  source?: string;
}

export interface IndexerEmailResponse {
  walletAddress: string;
  addressType: string;
  addresses: Array<{
    walletAddress: string;
    names: string[];
  }>;
  verified: boolean;
  timestamp: string;
}

export interface IndexerDelegationInfo {
  walletAddress: string;
  addressType: string;
  hasDelegation: boolean;
  delegatedTo: string | null;
  chainId: number | null;
  isActive: boolean;
  verified: boolean;
  timestamp: string;
}

export interface IndexerDelegatorInfo {
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

export interface IndexerSignatureVerification {
  walletAddress: string;
  addressType: string;
  isValid: boolean;
  message: string;
  timestamp: string;
}

export interface IndexerSigningMessage {
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

export interface IndexerNonceInfo {
  walletAddress: string;
  addressType: string;
  nonce: string;
  createdAt?: string;
  updatedAt?: string;
  message: string;
  timestamp: string;
}

export interface IndexerEntitlement {
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

export interface ValidateAddressResponse {
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

export interface UseIndexerMailReturn {
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
    chainId: number,
    walletAddress: string,
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
export const useIndexerMail = (): UseIndexerMailReturn => {
  const config = useAppConfig();
  const appConfig = convertToAppConfig(config);
  const indexerClient = new IndexerClient(appConfig);
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
    execute((chainId: number, walletAddress: string, domain: string, url: string) =>
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

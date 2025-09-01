import { useCallback, useState } from 'react';
import { useAppConfig } from '../useServices';
import { IndexerClient } from '../../../network/clients/indexer';

export interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated';
  source?: string;
}

export interface IndexerEmailResponse {
  walletAddress: string;
  addressType: string;
  emailAddresses: string[];
  detailedAddresses: IndexerEmailAddress[];
  totalCount: number;
  hasNameService: boolean;
  verified: boolean;
  timestamp: string;
}

export interface IndexerDelegationInfo {
  delegatedTo: string | null;
  isActive: boolean;
  chainId?: number;
  blockNumber?: string;
  transactionHash?: string;
  timestamp?: string;
  verified: boolean;
}

export interface IndexerDelegatorInfo {
  delegatedFrom: Array<{
    address: string;
    chainId: number;
    blockNumber: string;
    transactionHash: string;
    timestamp: string;
  }>;
  totalDelegators: number;
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

export interface UseIndexerMailReturn {
  isLoading: boolean;
  error: string | null;
  getEmailAddresses: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerEmailResponse>;
  getDelegatedAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerDelegationInfo>;
  getDelegatorsToAddress: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerDelegatorInfo>;
  verifySignature: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<IndexerSignatureVerification>;
  getSigningMessage: (
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ) => Promise<IndexerSigningMessage>;
  getNonce: (
    walletAddress: string,
    signature: string,
    message?: string
  ) => Promise<IndexerNonceInfo>;
  createNonce: (
    walletAddress: string,
    signature: string,
    message?: string
  ) => Promise<IndexerNonceInfo>;
  getNameServiceEntitlement: (
    walletAddress: string
  ) => Promise<IndexerEntitlement>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
 */
export const useIndexerMail = (): UseIndexerMailReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appConfig = useAppConfig();
  const indexerClient = new IndexerClient(appConfig);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getEmailAddresses = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<IndexerEmailResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getEmailAddresses(
          walletAddress,
          signature,
          message
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get email addresses';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getDelegatedAddress = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<IndexerDelegationInfo> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getDelegated(
          walletAddress,
          signature,
          message
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get delegated address';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getDelegatorsToAddress = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<IndexerDelegatorInfo> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getDelegatedTo(
          walletAddress,
          signature,
          message
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get delegators to address';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const verifySignature = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<IndexerSignatureVerification> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.verifySignature(
          walletAddress,
          signature,
          message || ''
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to verify signature';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getSigningMessage = useCallback(
    async (
      chainId: number,
      walletAddress: string,
      domain: string,
      url: string
    ): Promise<IndexerSigningMessage> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getMessage(
          chainId,
          walletAddress,
          domain,
          url
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get signing message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getNonce = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message?: string
    ): Promise<IndexerNonceInfo> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.getNonce(
          walletAddress,
          signature,
          message || ''
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get nonce';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const createNonce = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message?: string
    ): Promise<IndexerNonceInfo> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await indexerClient.createNonce(
          walletAddress,
          signature,
          message || ''
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create nonce';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient]
  );

  const getNameServiceEntitlement = useCallback(
    async (walletAddress: string): Promise<IndexerEntitlement> => {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await indexerClient.checkNameServiceEntitlement(walletAddress);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get nameservice entitlement';
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

import { useState, useCallback } from 'react';
import { useAppConfig } from '../useServices';

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
  getEmailAddresses: (walletAddress: string, signature: string, message?: string) => Promise<IndexerEmailResponse>;
  getDelegatedAddress: (walletAddress: string, signature: string, message?: string) => Promise<IndexerDelegationInfo>;
  getDelegatorsToAddress: (walletAddress: string) => Promise<IndexerDelegatorInfo>;
  verifySignature: (walletAddress: string, signature: string, message?: string) => Promise<IndexerSignatureVerification>;
  getSigningMessage: (chainId: number, walletAddress: string, domain: string, url: string) => Promise<IndexerSigningMessage>;
  getNonce: (walletAddress: string, signature: string, message?: string) => Promise<IndexerNonceInfo>;
  createNonce: (walletAddress: string, signature: string, message?: string) => Promise<IndexerNonceInfo>;
  getNameServiceEntitlement: (walletAddress: string) => Promise<IndexerEntitlement>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
 */
export const useIndexerMail = (): UseIndexerMailReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appConfig = useAppConfig();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getEmailAddresses = useCallback(async (
    walletAddress: string, 
    signature: string, 
    message?: string
  ): Promise<IndexerEmailResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get email addresses';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const getDelegatedAddress = useCallback(async (
    walletAddress: string, 
    signature: string, 
    message?: string
  ): Promise<IndexerDelegationInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/delegated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get delegated address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const getDelegatorsToAddress = useCallback(async (walletAddress: string): Promise<IndexerDelegatorInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/delegatedTo/${encodeURIComponent(walletAddress)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get delegators to address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const verifySignature = useCallback(async (
    walletAddress: string, 
    signature: string, 
    message?: string
  ): Promise<IndexerSignatureVerification> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify signature';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const getSigningMessage = useCallback(async (
    chainId: number, 
    walletAddress: string, 
    domain: string, 
    url: string
  ): Promise<IndexerSigningMessage> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/message/${chainId}/${encodeURIComponent(walletAddress)}/${encodeURIComponent(domain)}/${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get signing message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const getNonce = useCallback(async (
    walletAddress: string, 
    signature: string, 
    message?: string
  ): Promise<IndexerNonceInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/nonce/${encodeURIComponent(walletAddress)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get nonce';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const createNonce = useCallback(async (
    walletAddress: string, 
    signature: string, 
    message?: string
  ): Promise<IndexerNonceInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/nonce/${encodeURIComponent(walletAddress)}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create nonce';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const getNameServiceEntitlement = useCallback(async (walletAddress: string): Promise<IndexerEntitlement> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${appConfig.indexerBackendUrl}/${encodeURIComponent(walletAddress)}/entitlement/nameservice`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get nameservice entitlement';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

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
/**
 * React hook for UnifiedMailBoxClient operations
 * Provides a platform-agnostic interface for interacting with MailBox contracts
 */

import { useCallback, useState } from 'react';
import {
  type ChainConfig,
  type DelegationResult as ContractDelegationResult,
  type DomainResult,
  type MessageResult,
  OnchainMailerClient,
  type UnifiedTransaction,
  type UnifiedWallet,
} from '@johnqh/mail_box_contracts';
import { ChainType } from '@johnqh/types';

interface UseMailerClientOptions {
  wallet?: UnifiedWallet;
  config?: ChainConfig;
}

interface UseMailerClientReturn {
  // Client instance
  client: OnchainMailerClient | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Operations
  sendMessage: (
    subject: string,
    body: string,
    priority?: boolean
  ) => Promise<MessageResult>;
  registerDomain: (
    domain: string,
    isExtension?: boolean
  ) => Promise<DomainResult>;
  delegateTo: (delegate: string) => Promise<ContractDelegationResult>;
  claimRevenue: () => Promise<UnifiedTransaction>;

  // Utility
  getChainType: () => ChainType | null;
  getWalletAddress: () => string | null;
  clearError: () => void;

  // Client management
  initializeClient: (wallet: UnifiedWallet, config: ChainConfig) => void;
}

/**
 * Hook for interacting with MailBox contracts across EVM and Solana chains
 */
export const useMailerClient = (
  options: UseMailerClientOptions = {}
): UseMailerClientReturn => {
  const [client, setClient] = useState<OnchainMailerClient | null>(() => {
    if (options.wallet && options.config) {
      try {
        return new OnchainMailerClient(options.wallet, options.config);
      } catch (error) {
        console.warn('Failed to initialize OnchainMailerClient:', error);
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initializeClient = useCallback(
    (wallet: UnifiedWallet, config: ChainConfig) => {
      try {
        const newClient = new OnchainMailerClient(wallet, config);
        setClient(newClient);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to initialize client';
        setError(errorMessage);
        setClient(null);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (
      subject: string,
      body: string,
      priority: boolean = false
    ): Promise<MessageResult> => {
      if (!client) {
        throw new Error('Client not initialized. Call initializeClient first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.sendMessage(subject, body, priority);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const registerDomain = useCallback(
    async (
      domain: string,
      isExtension: boolean = false
    ): Promise<DomainResult> => {
      if (!client) {
        throw new Error('Client not initialized. Call initializeClient first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.registerDomain(domain, isExtension);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to register domain';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const delegateTo = useCallback(
    async (delegate: string): Promise<ContractDelegationResult> => {
      if (!client) {
        throw new Error('Client not initialized. Call initializeClient first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.delegateTo(delegate);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delegate';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const claimRevenue = useCallback(async (): Promise<UnifiedTransaction> => {
    if (!client) {
      throw new Error('Client not initialized. Call initializeClient first.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.claimRevenue();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to claim revenue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const getChainType = useCallback((): ChainType | null => {
    return client ? client.getChainType() : null;
  }, [client]);

  const getWalletAddress = useCallback((): string | null => {
    return client ? client.getWalletAddress() : null;
  }, [client]);

  return {
    client,
    isLoading,
    error,
    sendMessage,
    registerDomain,
    delegateTo,
    claimRevenue,
    getChainType,
    getWalletAddress,
    clearError,
    initializeClient,
  };
};

export type { UseMailerClientReturn, UseMailerClientOptions };

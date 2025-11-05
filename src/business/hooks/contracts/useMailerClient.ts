/**
 * React hook for OnchainMailerClient operations
 * Provides a stateless interface for interacting with MailBox contracts
 *
 * Note: This hook uses the stateless OnchainMailerClient API.
 * All operations require connectedWallet and chainInfo to be passed.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  type DelegationResult as ContractDelegationResult,
  type DomainResult,
  type MessageResult,
  OnchainMailerClient,
  type UnifiedTransaction,
  type Wallet,
} from '@sudobility/contracts';
import { Optional } from '@sudobility/types';
import type { ChainInfo } from '@sudobility/configs';

interface UseMailerClientReturn {
  // Client instance (stateless)
  client: OnchainMailerClient;

  // State
  isLoading: boolean;
  error: Optional<string>;

  // Operations - all require wallet and chainInfo
  sendMessage: (
    connectedWallet: Wallet,
    chainInfo: ChainInfo,
    subject: string,
    body: string,
    options?: { priority?: boolean }
  ) => Promise<MessageResult>;

  registerDomain: (domain: string) => Promise<DomainResult>;

  delegateTo: (
    connectedWallet: Wallet,
    chainInfo: ChainInfo,
    delegate: string
  ) => Promise<ContractDelegationResult>;

  claimRevenue: (
    connectedWallet: Wallet,
    chainInfo: ChainInfo
  ) => Promise<UnifiedTransaction>;

  // Utility
  clearError: () => void;
}

/**
 * Hook for interacting with MailBox contracts across EVM and Solana chains
 * Uses stateless OnchainMailerClient - wallet and chainInfo passed per operation
 */
export const useMailerClient = (): UseMailerClientReturn => {
  // Create stateless client instance (no wallet/config in constructor)
  const client = useMemo(() => new OnchainMailerClient(), []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (
      connectedWallet: Wallet,
      chainInfo: ChainInfo,
      subject: string,
      body: string,
      options?: { priority?: boolean }
    ): Promise<MessageResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.sendMessage(
          connectedWallet,
          chainInfo,
          subject,
          body,
          options
        );
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
    async (domain: string): Promise<DomainResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.registerDomain(domain);
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
    async (
      connectedWallet: Wallet,
      chainInfo: ChainInfo,
      delegate: string
    ): Promise<ContractDelegationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.delegateTo(
          connectedWallet,
          chainInfo,
          delegate
        );
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

  const claimRevenue = useCallback(
    async (
      connectedWallet: Wallet,
      chainInfo: ChainInfo
    ): Promise<UnifiedTransaction> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.claimRevenue(connectedWallet, chainInfo);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to claim revenue';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  return {
    client,
    isLoading,
    error,
    sendMessage,
    registerDomain,
    delegateTo,
    claimRevenue,
    clearError,
  };
};

export type { UseMailerClientReturn, Wallet };

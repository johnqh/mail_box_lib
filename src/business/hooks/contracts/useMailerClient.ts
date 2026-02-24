/**
 * @fileoverview React hook for OnchainMailerClient operations.
 *
 * Provides a stateless interface for interacting with MailBox smart contracts
 * across EVM and Solana chains. All operations require `connectedWallet` and
 * `chainInfo` to be passed per call, enabling multi-chain support without
 * hook re-initialization.
 *
 * Managed state: `isLoading` and `error` track the most recent operation.
 *
 * @example
 * ```typescript
 * const { sendMessage, claimRevenue, isLoading, error, clearError } = useMailerClient();
 *
 * const result = await sendMessage(wallet, chainInfo, 'Subject', 'Body', { priority: true });
 * ```
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

/** Return type for useMailerClient hook */
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
 * Hook for interacting with MailBox contracts across EVM and Solana chains.
 *
 * Creates a stateless `OnchainMailerClient` instance and wraps each operation
 * with loading/error state management. The client is memoized for the hook's lifetime.
 *
 * Operations:
 * - `sendMessage` - Send an email (priority or regular) to a recipient
 * - `registerDomain` - Register a domain for the mailer
 * - `delegateTo` - Delegate email operations to another wallet
 * - `claimRevenue` - Claim accumulated revenue from received emails
 *
 * @returns UseMailerClientReturn with client instance, operations, and state
 *
 * @example
 * ```typescript
 * function SendButton({ wallet, chain }: Props) {
 *   const { sendMessage, isLoading, error } = useMailerClient();
 *
 *   const handleSend = async () => {
 *     const result = await sendMessage(wallet, chain, 'Hello', 'World');
 *     console.log('Sent:', result.transactionHash);
 *   };
 *
 *   return <button onClick={handleSend} disabled={isLoading}>Send</button>;
 * }
 * ```
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

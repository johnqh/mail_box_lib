/**
 * useMailerDelegations Hook
 *
 * Manages email delegation functionality using both indexer client and onchain operations.
 * Provides functions to view, create, and manage delegation relationships between wallets.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type DelegationResult,
  OnchainMailerClient,
  type UnifiedTransaction,
  type Wallet,
} from '@sudobility/contracts';
import {
  IndexerUserAuth,
  useIndexerGetDelegatedFrom,
  useIndexerGetDelegatedTo,
} from '@sudobility/indexer_client';
import { type IndexerDelegateData, Optional } from '@sudobility/types';
import type { ChainInfo } from '@sudobility/configs';

/**
 * Hook configuration options
 *
 * Note: Uses stateless OnchainMailerClient API
 */
export interface UseMailerDelegationsOptions {
  /** Indexer API endpoint URL */
  endpointUrl: string;
  /** Development mode flag */
  devMode?: boolean;
  /** Wallet address for this user */
  walletAddress: Optional<string>;
  /** Indexer authentication credentials */
  auth: Optional<IndexerUserAuth>;
  /** Connected wallet instance for smart contract operations */
  connectedWallet?: Wallet;
  /** Chain info for smart contract operations */
  chainInfo?: ChainInfo;
  /** Whether to automatically fetch delegation data */
  autoFetch?: boolean;
}

/**
 * Return type for useMailerDelegations hook
 */
export interface UseMailerDelegationsReturn {
  /** Wallet that this address has delegated to (single delegate) */
  delegatedToMe: Optional<IndexerDelegateData>;
  /** List of wallets that have delegated to this address */
  delegatedFromMe: IndexerDelegateData[];
  /** Whether delegation data is being fetched */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
  /** Delegate to a target wallet address */
  delegate: (targetAddress: string) => Promise<DelegationResult>;
  /** Revoke delegation (delegate to 0x0 address) */
  revoke: () => Promise<DelegationResult>;
  /** Reject a delegation from a target wallet address */
  reject: (delegatorAddress: string) => Promise<UnifiedTransaction>;
  /** Refresh delegation data from indexer */
  refresh: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Hook to manage wallet delegations for email operations
 *
 * Combines indexer client queries with onchain mailer client operations to provide
 * a complete delegation management interface.
 *
 * @param options - Configuration options
 * @returns Object containing delegation data and control functions
 *
 * @example
 * ```tsx
 * import { RpcHelpers } from '@sudobility/configs';
 * import { Chain } from '@sudobility/types';
 *
 * function DelegationManager() {
 *   const { walletAddress, auth } = useWalletStatus();
 *   const connectedWallet = useWallet(); // Your wallet instance
 *   const chainInfo = RpcHelpers.getChainInfo(Chain.ETH_MAINNET);
 *
 *   const {
 *     delegatedToMe,
 *     delegatedFromMe,
 *     delegate,
 *     revoke,
 *     reject,
 *     isLoading,
 *     error
 *   } = useMailerDelegations({
 *     endpointUrl: 'https://indexer.example.com',
 *     walletAddress,
 *     auth,
 *     connectedWallet,
 *     chainInfo,
 *     autoFetch: true
 *   });
 *
 *   const handleDelegate = async (targetAddress: string) => {
 *     try {
 *       const result = await delegate(targetAddress);
 *       console.log('Delegated:', result.transactionHash);
 *     } catch (err) {
 *       console.error('Delegation failed:', err);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {delegatedToMe && (
 *         <p>Delegated to: {delegatedToMe.walletAddress}</p>
 *       )}
 *       <h3>Delegations from others ({delegatedFromMe.length}):</h3>
 *       {delegatedFromMe.map(d => (
 *         <div key={d.walletAddress}>
 *           <span>{d.walletAddress}</span>
 *           <button onClick={() => reject(d.walletAddress)}>Reject</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailerDelegations(
  options: UseMailerDelegationsOptions
): UseMailerDelegationsReturn {
  const {
    endpointUrl,
    devMode = false,
    walletAddress,
    auth,
    connectedWallet,
    chainInfo,
  } = options;

  const [error, setError] = useState<Optional<string>>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create stateless OnchainMailerClient instance
  const mailerClient = useMemo(() => new OnchainMailerClient(), []);

  // Fetch delegation data from indexer
  const delegatedToQuery = useIndexerGetDelegatedTo(
    endpointUrl,
    devMode,
    walletAddress || '',
    auth || { message: '', signature: '', signer: '' }
  );

  const delegatedFromQuery = useIndexerGetDelegatedFrom(
    endpointUrl,
    devMode,
    walletAddress || '',
    auth || { message: '', signature: '', signer: '' }
  );

  // Extract delegation data
  const delegatedToMe = useMemo<Optional<IndexerDelegateData>>(() => {
    if (delegatedToQuery.data?.success && delegatedToQuery.data.data) {
      return delegatedToQuery.data.data;
    }
    return null;
  }, [delegatedToQuery.data]);

  const delegatedFromMe = useMemo<IndexerDelegateData[]>(() => {
    if (delegatedFromQuery.data?.success && delegatedFromQuery.data.data) {
      return delegatedFromQuery.data.data.from || [];
    }
    return [];
  }, [delegatedFromQuery.data]);

  // Combine loading states
  const isLoading = useMemo(
    () =>
      delegatedToQuery.isLoading ||
      delegatedFromQuery.isLoading ||
      isProcessing,
    [delegatedToQuery.isLoading, delegatedFromQuery.isLoading, isProcessing]
  );

  // Handle query errors
  useEffect(() => {
    if (delegatedToQuery.isError) {
      setError(
        delegatedToQuery.error instanceof Error
          ? delegatedToQuery.error.message
          : 'Failed to fetch delegated-to data'
      );
    } else if (delegatedFromQuery.isError) {
      setError(
        delegatedFromQuery.error instanceof Error
          ? delegatedFromQuery.error.message
          : 'Failed to fetch delegated-from data'
      );
    }
  }, [
    delegatedToQuery.isError,
    delegatedToQuery.error,
    delegatedFromQuery.isError,
    delegatedFromQuery.error,
  ]);

  /**
   * Manually refresh delegation data from indexer
   */
  const refresh = useCallback(async () => {
    setError(null);
    await Promise.all([
      delegatedToQuery.refetch(),
      delegatedFromQuery.refetch(),
    ]);
  }, [delegatedToQuery, delegatedFromQuery]);

  /**
   * Delegate to a target wallet address using smart contract
   */
  const delegate = useCallback(
    async (targetAddress: string): Promise<DelegationResult> => {
      if (!connectedWallet || !chainInfo) {
        throw new Error(
          'Wallet and chain info are required for delegation operations'
        );
      }

      if (!targetAddress || targetAddress.trim() === '') {
        throw new Error('Target address is required');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await mailerClient.delegateTo(
          connectedWallet,
          chainInfo,
          targetAddress
        );

        // Refresh indexer data after successful delegation
        await refresh();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delegate';
        setError(errorMessage);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [mailerClient, connectedWallet, chainInfo, refresh]
  );

  /**
   * Revoke delegation by delegating to 0x0 address
   */
  const revoke = useCallback(async (): Promise<DelegationResult> => {
    if (!connectedWallet || !chainInfo) {
      throw new Error(
        'Wallet and chain info are required for delegation operations'
      );
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await mailerClient.delegateTo(
        connectedWallet,
        chainInfo,
        ZERO_ADDRESS
      );

      // Refresh indexer data after successful revocation
      await refresh();

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to revoke delegation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [mailerClient, connectedWallet, chainInfo, refresh]);

  /**
   * Reject a delegation from a target wallet address
   */
  const reject = useCallback(
    async (delegatorAddress: string): Promise<UnifiedTransaction> => {
      if (!connectedWallet || !chainInfo) {
        throw new Error(
          'Wallet and chain info are required for delegation operations'
        );
      }

      if (!delegatorAddress || delegatorAddress.trim() === '') {
        throw new Error('Delegator address is required');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await mailerClient.rejectDelegation(
          connectedWallet,
          chainInfo,
          delegatorAddress
        );

        // Refresh indexer data after successful rejection
        await refresh();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to reject delegation';
        setError(errorMessage);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [mailerClient, connectedWallet, chainInfo, refresh]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    delegatedToMe,
    delegatedFromMe,
    isLoading,
    error,
    delegate,
    revoke,
    reject,
    refresh,
    clearError,
  };
}

export default useMailerDelegations;

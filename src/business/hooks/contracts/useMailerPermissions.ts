/**
 * useMailerPermissions Hook
 *
 * Custom hook for fetching wallet permissions from the indexer
 * and managing permissions via smart contract
 * Returns a list of permissioned contract addresses for a given wallet
 */

import { useCallback, useMemo, useState } from 'react';
import { Chain, Optional } from '@sudobility/types';
import { useIndexerGetWalletPermissions } from '@sudobility/indexer_client';
import {
  OnchainMailerClient,
  type UnifiedTransaction,
  type Wallet,
} from '@sudobility/contracts';
import { type ChainInfo, RpcHelpers } from '@sudobility/configs';

/**
 * Wallet permissions response data structure
 */
export interface WalletPermissionsData {
  walletAddress: string;
  chainId: number;
  permissions: string[];
  timestamp: string;
}

/**
 * Wallet permissions response
 */
export interface WalletPermissionsResponse {
  success: boolean;
  data: WalletPermissionsData;
  error: Optional<string>;
  timestamp: string;
}

/**
 * Return type for useMailerPermissions hook
 */
export interface UseMailerPermissionsReturn {
  /** Array of permissioned contract addresses */
  permissions: string[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
  /** Function to manually fetch/refresh permissions */
  refresh: () => Promise<void>;
  /** Function to add permission for a contract address */
  addPermission: (contractAddress: string) => Promise<UnifiedTransaction>;
  /** Function to remove permission for a contract address */
  removePermission: (contractAddress: string) => Promise<UnifiedTransaction>;
  /** Function to clear error state */
  clearError: () => void;
}

/**
 * Hook to fetch and manage wallet permissions from the indexer
 *
 * @param connectedWallet - Connected wallet instance
 * @param chain - Chain for smart contract operations
 * @param indexerEndpoint - Indexer API endpoint URL
 * @param indexerDevMode - Whether to use development mode for indexer (default: false)
 * @returns Object containing permissions array and control functions
 *
 * @example
 * ```tsx
 * import { Chain } from '@sudobility/types';
 *
 * function PermissionManager() {
 *   const connectedWallet = useWallet(); // Your wallet instance
 *
 *   const {
 *     permissions,
 *     isLoading,
 *     addPermission,
 *     removePermission,
 *     refresh,
 *     error
 *   } = useMailerPermissions(
 *     connectedWallet,
 *     Chain.ETH_MAINNET,
 *     'https://indexer.example.com'
 *   );
 *
 *   const handleAddPermission = async (contractAddress: string) => {
 *     try {
 *       const result = await addPermission(contractAddress);
 *       console.log('Permission added:', result.hash);
 *     } catch (err) {
 *       console.error('Failed to add permission:', err);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <h3>Permissioned Contracts ({permissions.length}):</h3>
 *       {permissions.map(address => (
 *         <div key={address}>
 *           <span>{address}</span>
 *           <button onClick={() => handleRemovePermission(address)}>Remove</button>
 *         </div>
 *       ))}
 *       {error && <div>Error: {error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailerPermissions(
  connectedWallet: Optional<Wallet>,
  chain: Chain,
  indexerEndpoint: string,
  indexerDevMode: boolean = false
): UseMailerPermissionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Create stateless OnchainMailerClient instance
  const mailerClient = useMemo(() => new OnchainMailerClient(), []);

  // Get chainInfo using convenient helper
  const chainInfo = useMemo<Optional<ChainInfo>>(() => {
    return RpcHelpers.getChainInfo(chain);
  }, [chain]);

  // Get wallet address from connected wallet
  const walletAddress = useMemo(() => {
    if (!connectedWallet) return null;
    return (
      (connectedWallet as any).address ||
      (connectedWallet as any).walletClient?.address ||
      (connectedWallet as any).publicKey?.toBase58()
    );
  }, [connectedWallet]);

  // Debug logging
  console.log('[useMailerPermissions] Parameters:', {
    walletAddress,
    chain,
    chainId: chainInfo?.chainId,
    isTestNet: chainInfo?.isTestNet,
    indexerEndpoint,
    indexerDevMode,
    enabled: !!walletAddress && !!chainInfo,
  });

  // Fetch wallet permissions from indexer using React Query
  const permissionsQuery = useIndexerGetWalletPermissions(
    indexerEndpoint,
    indexerDevMode,
    walletAddress || '',
    chainInfo?.chainId || 0,
    chainInfo?.isTestNet || false,
    {
      enabled: !!walletAddress && !!chainInfo, // Only fetch when wallet and chain are available
    }
  );

  console.log('[useMailerPermissions] Query state:', {
    isLoading: permissionsQuery.isLoading,
    isError: permissionsQuery.isError,
    isFetching: permissionsQuery.isFetching,
    hasData: !!permissionsQuery.data,
    error: permissionsQuery.error,
  });

  // Extract permissions from query data
  const permissions = useMemo<string[]>(() => {
    if (permissionsQuery.data?.success && permissionsQuery.data.data) {
      return permissionsQuery.data.data.permissions || [];
    }
    return [];
  }, [permissionsQuery.data]);

  // Handle query errors
  const queryError = useMemo<Optional<string>>(() => {
    if (permissionsQuery.isError) {
      return permissionsQuery.error instanceof Error
        ? permissionsQuery.error.message
        : 'Failed to fetch wallet permissions';
    }
    if (permissionsQuery.data && !permissionsQuery.data.success) {
      return (
        permissionsQuery.data.error || 'Failed to fetch wallet permissions'
      );
    }
    return null;
  }, [permissionsQuery.isError, permissionsQuery.error, permissionsQuery.data]);

  /**
   * Manually refresh permissions from indexer
   */
  const refresh = useCallback(async () => {
    setError(null);
    await permissionsQuery.refetch();
  }, [permissionsQuery]);

  /**
   * Add permission for a contract address using smart contract
   */
  const addPermission = useCallback(
    async (contractAddress: string): Promise<UnifiedTransaction> => {
      if (!connectedWallet || !chainInfo) {
        throw new Error(
          'Wallet and chain info are required for permission operations'
        );
      }

      if (!contractAddress || contractAddress.trim() === '') {
        throw new Error('Contract address is required');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await mailerClient.setPermission(
          connectedWallet,
          chainInfo,
          contractAddress
        );

        // Refresh permissions after successful addition
        await refresh();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add permission';
        setError(errorMessage);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [mailerClient, connectedWallet, chainInfo, refresh]
  );

  /**
   * Remove permission for a contract address using smart contract
   */
  const removePermission = useCallback(
    async (contractAddress: string): Promise<UnifiedTransaction> => {
      if (!connectedWallet || !chainInfo) {
        throw new Error(
          'Wallet and chain info are required for permission operations'
        );
      }

      if (!contractAddress || contractAddress.trim() === '') {
        throw new Error('Contract address is required');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await mailerClient.removePermission(
          connectedWallet,
          chainInfo,
          contractAddress
        );

        // Refresh permissions after successful removal
        await refresh();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove permission';
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

  // Combine loading states and errors
  const isLoading = permissionsQuery.isLoading || isProcessing;
  const combinedError = error || queryError;

  return {
    permissions,
    isLoading,
    error: combinedError,
    refresh,
    addPermission,
    removePermission,
    clearError,
  };
}

export default useMailerPermissions;

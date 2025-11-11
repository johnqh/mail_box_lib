/**
 * useMailerPermissions Hook
 *
 * Custom hook for fetching wallet permissions from the indexer
 * and managing permissions via smart contract
 * Returns a list of permissioned contract addresses for a given wallet
 */

import { useCallback, useMemo, useState } from 'react';
import { Chain, NetworkClient, Optional } from '@sudobility/types';
import { useIndexerGetWalletPermissions } from '@sudobility/indexer_client';
import {
  type EVMWallet,
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
 * @param networkClient - Network client for API calls
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
 *   const networkClient = useNetworkClient();
 *
 *   const {
 *     permissions,
 *     isLoading,
 *     addPermission,
 *     removePermission,
 *     refresh,
 *     error
 *   } = useMailerPermissions(
 *     networkClient,
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
  networkClient: NetworkClient,
  connectedWallet: Optional<Wallet>,
  chain: Optional<Chain>,
  indexerEndpoint: string,
  indexerDevMode: boolean = false
): UseMailerPermissionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Create stateless OnchainMailerClient instance
  const mailerClient = useMemo(() => new OnchainMailerClient(), []);

  // Get chainInfo using convenient helper
  const chainInfo = useMemo<Optional<ChainInfo>>(() => {
    if (!chain) return null;
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

  // Fetch wallet permissions from indexer using React Query
  const permissionsQuery = useIndexerGetWalletPermissions(
    networkClient,
    indexerEndpoint,
    indexerDevMode,
    walletAddress || '',
    chainInfo?.chainId || 0,
    chainInfo?.isTestNet || false,
    {
      enabled: !!walletAddress && !!chainInfo, // Only fetch when wallet and chain are available
    }
  );

  // Extract permissions from query data
  const permissions = useMemo<string[]>(() => {
    if (permissionsQuery.data?.success) {
      // Handle both API response formats:
      // 1. Nested: { success: true, data: { permissions: [...] } }
      // 2. Flat: { success: true, contracts: [...] }
      const responseData = permissionsQuery.data as any;

      // Try nested format first (data.permissions)
      if (responseData.data?.permissions) {
        return responseData.data.permissions;
      }

      // Try flat format (contracts at top level)
      if (responseData.contracts) {
        return responseData.contracts;
      }

      // Fallback to empty array
      return [];
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

  // Auto-fetch permissions when wallet and chain info become available
  // Note: We don't need an explicit useEffect here because React Query's `enabled` flag
  // will automatically fetch when the conditions (walletAddress && chainInfo) are met.
  // The `enabled` option in useIndexerGetWalletPermissions handles this automatically.

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

        // Wait for transaction to be mined and confirmed
        const evmWallet = connectedWallet as EVMWallet;
        if (result.hash && evmWallet.publicClient) {
          await evmWallet.publicClient.waitForTransactionReceipt({
            hash: result.hash as `0x${string}`,
          });

          // Wait additional time for indexer to process the event
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

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

        // Wait for transaction to be mined and confirmed
        const evmWallet = connectedWallet as EVMWallet;
        if (result.hash && evmWallet.publicClient) {
          await evmWallet.publicClient.waitForTransactionReceipt({
            hash: result.hash as `0x${string}`,
          });

          // Wait additional time for indexer to process the event
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

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

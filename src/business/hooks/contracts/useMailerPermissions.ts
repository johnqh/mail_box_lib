/**
 * useMailerPermissions Hook
 *
 * Custom hook for fetching wallet permissions from the indexer
 * and managing permissions via smart contract
 * Returns a list of permissioned contract addresses for a given wallet
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chain, Optional } from '@sudobility/types';
import { IndexerClient } from '@sudobility/indexer_client';
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
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  /**
   * Fetch wallet permissions from the indexer
   */
  const fetchPermissions = useCallback(async () => {
    if (!walletAddress || !chainInfo) {
      setPermissions([]);
      setError('Wallet address or chain info not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const client = new IndexerClient(indexerEndpoint, indexerDevMode);
      const response = await client.getWalletPermissions(
        walletAddress,
        chainInfo.chainId,
        chainInfo.isTestNet
      );

      // The response is typed as 'any' in IndexerClient
      // We need to validate the structure
      if (response && typeof response === 'object') {
        const typedResponse = response as WalletPermissionsResponse;

        if (typedResponse.success && typedResponse.data) {
          setPermissions(typedResponse.data.permissions || []);
        } else {
          throw new Error(
            typedResponse.error || 'Failed to fetch wallet permissions'
          );
        }
      } else {
        throw new Error('Invalid response from indexer');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
      setPermissions([]);
      console.error('Error fetching wallet permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, chainInfo, indexerEndpoint, indexerDevMode]);

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
        await fetchPermissions();

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
    [mailerClient, connectedWallet, chainInfo, fetchPermissions]
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
        await fetchPermissions();

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
    [mailerClient, connectedWallet, chainInfo, fetchPermissions]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Always auto-fetch on mount if wallet is available
  useEffect(() => {
    if (walletAddress && chainInfo) {
      fetchPermissions();
    }
  }, [walletAddress, chainInfo, fetchPermissions]);

  return {
    permissions,
    isLoading: isLoading || isProcessing,
    error,
    refresh: fetchPermissions,
    addPermission,
    removePermission,
    clearError,
  };
}

export default useMailerPermissions;

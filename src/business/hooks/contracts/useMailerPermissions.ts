/**
 * useMailerPermissions Hook
 *
 * Custom hook for fetching wallet permissions from the indexer
 * and managing permissions via smart contract
 * Returns a list of permissioned contract addresses for a given wallet
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Optional } from '@sudobility/types';
import { IndexerClient } from '@sudobility/indexer_client';
import {
  OnchainMailerClient,
  type UnifiedTransaction,
  type Wallet,
} from '@sudobility/contracts';
import type { ChainInfo } from '@sudobility/configs';

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
 * Hook configuration options
 *
 * Note: Uses stateless OnchainMailerClient API
 */
export interface UseMailerPermissionsOptions {
  /** Wallet address to fetch permissions for */
  walletAddress: Optional<string>;
  /** Chain ID for the network */
  chainId: number;
  /** Whether to use testnet (optional) */
  testNet?: boolean;
  /** Whether to automatically fetch on mount */
  autoFetch?: boolean;
  /** Connected wallet instance for smart contract operations (optional) */
  connectedWallet?: Wallet;
  /** Chain info for smart contract operations (optional) */
  chainInfo?: ChainInfo;
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
 * @param endpointUrl - Indexer API endpoint URL
 * @param devMode - Whether to use development mode
 * @param options - Configuration options
 * @returns Object containing permissions array and control functions
 *
 * @example Basic Usage (Read-only)
 * ```tsx
 * function MyComponent() {
 *   const { permissions, isLoading, refresh } = useMailerPermissions(
 *     'https://indexer.example.com',
 *     false,
 *     {
 *       walletAddress: '0x123...',
 *       chainId: 1,
 *       autoFetch: true
 *     }
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h3>Permissioned Contracts:</h3>
 *       <ul>
 *         {permissions.map(address => (
 *           <li key={address}>{address}</li>
 *         ))}
 *       </ul>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With Permission Management
 * ```tsx
 * import { RpcHelpers } from '@sudobility/configs';
 * import { Chain } from '@sudobility/types';
 *
 * function PermissionManager() {
 *   const connectedWallet = useWallet(); // Your wallet instance
 *   const chainInfo = RpcHelpers.getChainInfo(Chain.ETH_MAINNET);
 *
 *   const {
 *     permissions,
 *     isLoading,
 *     addPermission,
 *     removePermission,
 *     refresh,
 *     error
 *   } = useMailerPermissions(
 *     'https://indexer.example.com',
 *     false,
 *     {
 *       walletAddress: '0x123...',
 *       chainId: 1,
 *       connectedWallet,
 *       chainInfo,
 *       autoFetch: true
 *     }
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
 *   const handleRemovePermission = async (contractAddress: string) => {
 *     try {
 *       const result = await removePermission(contractAddress);
 *       console.log('Permission removed:', result.hash);
 *     } catch (err) {
 *       console.error('Failed to remove permission:', err);
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
  endpointUrl: string,
  devMode: boolean = false,
  options: UseMailerPermissionsOptions
): UseMailerPermissionsReturn {
  const {
    walletAddress,
    chainId,
    testNet = false,
    autoFetch = false,
    connectedWallet,
    chainInfo,
  } = options;

  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Create stateless OnchainMailerClient instance
  const mailerClient = useMemo(() => new OnchainMailerClient(), []);

  /**
   * Fetch wallet permissions from the indexer
   */
  const fetchPermissions = useCallback(async () => {
    if (!walletAddress) {
      setPermissions([]);
      setError('Wallet address is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const client = new IndexerClient(endpointUrl, devMode);
      const response = await client.getWalletPermissions(
        walletAddress,
        chainId,
        testNet
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
  }, [walletAddress, chainId, testNet, endpointUrl, devMode]);

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

  // Auto-fetch on mount if enabled and walletAddress is available
  useEffect(() => {
    if (autoFetch && walletAddress) {
      fetchPermissions();
    }
  }, [autoFetch, walletAddress, fetchPermissions]);

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

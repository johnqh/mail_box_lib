/**
 * useWalletAccounts Hook
 * Observes wallet status and fetches accounts when wallet is verified
 * Uses global state for React Native compatibility
 */

import { useCallback, useEffect, useMemo } from 'react';
import { Optional, WalletData } from '@sudobility/types';
import { useWalletStatus } from './useWalletStatus';
import {
  IndexerUserAuth,
  useIndexerGetWalletAccounts,
} from '@sudobility/indexer_client';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';

/**
 * WildDuck account with username and entitlement status
 * Extends WalletData to include chainType and walletAddress for compatibility
 */
export interface WildDuckAccount extends WalletData {
  username: string;
  entitled: boolean;
}

/**
 * Global wallet accounts state - shared across all components
 */
export const useGlobalWalletAccounts = createGlobalState<WildDuckAccount[]>(
  'walletAccounts',
  []
);

/**
 * Return type for useWalletAccounts hook
 */
export interface UseWalletAccountsReturn {
  /** Array of WildDuck accounts */
  accounts: WildDuckAccount[];
  /** Indexer authentication object (passthrough from useWalletStatus) */
  indexerAuth: Optional<IndexerUserAuth>;
  /** Function to refresh wallet accounts */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage wallet accounts based on wallet status
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing accounts array and indexerAuth
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { accounts, indexerAuth } = useWalletAccounts('https://indexer.example.com', false);
 *
 *   return (
 *     <ul>
 *       {accounts.map(account => (
 *         <li key={account.username}>
 *           {account.username} {account.entitled ? '✓' : '✗'}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useWalletAccounts(
  endpointUrl: string,
  devMode: boolean = false
): UseWalletAccountsReturn {
  const { status, indexerAuth } = useWalletStatus();
  const [accounts] = useGlobalWalletAccounts();

  // DEBUG: Log on EVERY render
  const timestamp = new Date().toISOString().split('T')[1];
  console.log(`🟢 [useWalletAccounts] Hook rendered at ${timestamp}:`, {
    status:
      status === undefined ? 'UNDEFINED' : status === null ? 'NULL' : 'OBJECT',
    statusWallet: status?.walletAddress || 'NONE',
    accountsLength: accounts.length,
  });

  // useIndexerGetWalletAccounts now requires walletAddress and auth upfront
  const walletAddress = status?.walletAddress || '';
  const auth = indexerAuth || { message: '', signature: '', signer: '' };
  const queryResult = useIndexerGetWalletAccounts(
    endpointUrl,
    devMode,
    walletAddress,
    auth
  );

  useEffect(() => {
    console.log('🟢 [useWalletAccounts] Effect triggered:', {
      statusWallet: status?.walletAddress,
      isVerified: !!(
        status?.walletAddress &&
        status?.message &&
        status?.signature
      ),
      currentAccountsLength: accounts.length,
      currentAccountsWallet: accounts[0]?.walletAddress,
    });

    // Check if wallet is verified (has message and signature)
    const isVerified =
      status?.walletAddress && status?.message && status?.signature;

    if (!isVerified) {
      // Set accounts to empty array when not verified
      console.log('🟢 [useWalletAccounts] Not verified, clearing accounts');
      setGlobalState('walletAccounts', []);
      return;
    }

    // TypeScript doesn't know these are non-null due to isVerified check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentWalletAddress = status.walletAddress!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const chainType = status.chainType!;

    // Check if accounts list has accounts from a different wallet
    // If so, clear first before populating with new wallet
    const hasAccountsFromDifferentWallet =
      accounts.length > 0 &&
      accounts[0]?.walletAddress !== currentWalletAddress;

    if (hasAccountsFromDifferentWallet) {
      // Clear accounts from old wallet first
      console.log('🟢 [useWalletAccounts] Clearing old wallet accounts:', {
        oldWallet: accounts[0]?.walletAddress,
        newWallet: currentWalletAddress,
      });
      setGlobalState('walletAccounts', []);
      // Return and let the effect re-run with empty accounts
      return;
    }

    // Immediately set accounts to show the wallet address
    // This provides instant feedback while we fetch the full list
    // This will be replaced when the query returns
    console.log('🟢 [useWalletAccounts] Setting initial account:', {
      walletAddress: currentWalletAddress,
    });
    setGlobalState('walletAccounts', [
      {
        walletAddress: currentWalletAddress,
        chainType,
        username: currentWalletAddress,
        entitled: true,
      },
    ]);

    // Process query result when data is available
    if (queryResult.data && queryResult.data.success && queryResult.data.data) {
      console.log(
        '🟢 [useWalletAccounts] Query returned data, processing accounts'
      );
      const flattenedAccounts: WildDuckAccount[] = [];

      for (const walletAccount of queryResult.data.data.accounts) {
        // Add wallet account (always entitled)
        // walletAddress -> username, entitled -> true
        flattenedAccounts.push({
          walletAddress: walletAccount.walletAddress,
          chainType: walletAccount.chainType,
          username: walletAccount.walletAddress,
          entitled: true,
        });

        // Add name accounts with their entitlement status from parent wallet
        // parent wallet's walletAddress -> walletAddress
        // parent wallet's chainType -> chainType
        // name -> username
        // entitled -> entitled
        if (walletAccount.names) {
          for (const nameAccount of walletAccount.names) {
            flattenedAccounts.push({
              walletAddress: walletAccount.walletAddress,
              chainType: walletAccount.chainType,
              username: nameAccount.name,
              entitled: nameAccount.entitled,
            });
          }
        }
      }

      setGlobalState('walletAccounts', flattenedAccounts);
    } else if (queryResult.isError) {
      // Log error and set accounts to empty
      console.error('Error fetching wallet accounts:', queryResult.error);
      setGlobalState('walletAccounts', []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    indexerAuth,
    queryResult.data,
    queryResult.isError,
    queryResult.error,
    accounts.length,
  ]);

  // Refresh function to manually refetch wallet accounts
  const refresh = useCallback(async () => {
    if (queryResult.refetch) {
      await queryResult.refetch();
    }
  }, [queryResult]);

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when accounts or indexerAuth actually change
  return useMemo<UseWalletAccountsReturn>(
    () => ({ accounts, indexerAuth, refresh }),
    [accounts, indexerAuth, refresh]
  );
}

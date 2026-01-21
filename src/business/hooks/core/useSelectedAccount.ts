/**
 * useSelectedAccount Hook
 * Manages the currently selected account from available wallet accounts
 * Automatically updates when wallet accounts change
 */

import { NetworkClient, Optional } from '@sudobility/types';
import { useCallback, useEffect, useMemo } from 'react';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useWalletAccounts, WildDuckAccount } from './useWalletAccounts';

/**
 * Global selected account state - shared across all components
 */
export const useGlobalSelectedAccount = createGlobalState<
  Optional<WildDuckAccount>
>('selectedAccount', undefined);

/**
 * Return type for useSelectedAccount hook
 */
export interface UseSelectedAccountReturn {
  /** The currently selected account (undefined if none available) */
  selectedAccount: Optional<WildDuckAccount>;
  /** Function to manually select an account by username */
  selectAccount: (username: string) => void;
  /** All available wallet accounts */
  accounts: WildDuckAccount[];
  /** Function to refresh wallet accounts */
  refreshAccounts: () => Promise<void>;
}

/**
 * Hook to manage the currently selected account
 *
 * Observes wallet accounts and automatically:
 * - Sets account to null when no accounts are available
 * - Keeps current account if it's still in the list
 * - Selects first account if current account is not in the list
 *
 * Note: Authentication is now handled separately by useAccountWildduckAuth
 *
 * @param networkClient - Network client for API calls
 * @param indexerBackendUrl - Indexer API backend URL
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedAccount, accounts, and selection functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const networkClient = useNetworkClient();
 *   const { selectedAccount, accounts, selectAccount } = useSelectedAccount(
 *     networkClient,
 *     'https://indexer.example.com',
 *     false
 *   );
 *
 *   if (!selectedAccount) {
 *     return <div>No account selected</div>;
 *   }
 *
 *   return (
 *     <div>
 *       Selected: {selectedAccount.username}
 *       {selectedAccount.entitled ? '✓' : '✗'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelectedAccount(
  networkClient: NetworkClient,
  indexerBackendUrl: string,
  devMode: boolean
): UseSelectedAccountReturn {
  const { accounts: rawAccounts, refresh: refreshAccounts } = useWalletAccounts(
    networkClient,
    indexerBackendUrl,
    devMode
  );
  const [selectedAccount] = useGlobalSelectedAccount();

  // Stabilize accounts array reference based on content
  // This prevents infinite loops from array reference changes
  const accountsKey = rawAccounts
    .map(a => `${a.username}:${a.walletAddress}`)
    .join('|');
  const accounts = useMemo(
    () => rawAccounts,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawAccounts.length, accountsKey]
  );

  // Manage selected account selection
  // This hook ONLY reacts to changes in the accounts list
  useEffect(() => {
    // If no accounts, clear selection to undefined
    if (accounts.length === 0) {
      if (selectedAccount !== undefined) {
        setGlobalState('selectedAccount', undefined);
      }
      return;
    }

    // Check if current account is still in the list (case-insensitive username comparison)
    const currentAccountStillExists = selectedAccount
      ? accounts.some(
          acc =>
            acc.walletAddress.toLowerCase() ===
              selectedAccount.walletAddress.toLowerCase() &&
            acc.username.toLowerCase() ===
              selectedAccount.username.toLowerCase()
        )
      : false;

    // If current account is still valid, keep it
    if (currentAccountStillExists) {
      return;
    }

    // Otherwise, select the first account
    setGlobalState('selectedAccount', accounts[0]);
  }, [accounts, selectedAccount]);

  /**
   * Manually select an account by username (case-insensitive)
   * Finds the account in the accounts list and sets it as selected
   */
  const selectAccount = useCallback(
    (username: string) => {
      const normalizedUsername = username.toLowerCase();
      const account = accounts.find(
        acc => acc.username.toLowerCase() === normalizedUsername
      );
      if (account) {
        setGlobalState('selectedAccount', account);
      }
    },
    [accounts]
  );

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when selectedAccount actually changes
  return useMemo<UseSelectedAccountReturn>(
    () => ({
      selectedAccount,
      selectAccount,
      accounts,
      refreshAccounts,
    }),
    [selectedAccount, selectAccount, accounts, refreshAccounts]
  );
}

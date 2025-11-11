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

  // DEBUG: Log render
  console.log('🔍 [useSelectedAccount] RENDER', {
    accountsLength: accounts.length,
    accountsUsernames: accounts.map(a => a.username),
    selectedAccountUsername: selectedAccount?.username,
  });

  // Manage selected account selection
  // This hook ONLY reacts to changes in the accounts list
  useEffect(() => {
    console.log('🔍 [useSelectedAccount] EFFECT triggered', {
      accountsLength: accounts.length,
      accountsUsernames: accounts.map(a => a.username),
      accountsWallets: accounts.map(a => a.walletAddress),
      selectedAccountUsername: selectedAccount?.username,
      selectedAccountWallet: selectedAccount?.walletAddress,
    });

    // If no accounts, clear selection to undefined
    if (accounts.length === 0) {
      if (selectedAccount !== undefined) {
        console.log(
          '🔍 [useSelectedAccount] ⚠️ CLEARING selectedAccount (no accounts)'
        );
        setGlobalState('selectedAccount', undefined);
      } else {
        console.log(
          '🔍 [useSelectedAccount] No accounts, selectedAccount already undefined'
        );
      }
      return;
    }

    // Check if current account is still in the list
    const currentAccountStillExists = selectedAccount
      ? accounts.some(
          acc =>
            acc.walletAddress === selectedAccount.walletAddress &&
            acc.username === selectedAccount.username
        )
      : false;

    console.log('🔍 [useSelectedAccount] Account existence check', {
      hasSelectedAccount: !!selectedAccount,
      currentAccountStillExists,
      willSetAccount: !currentAccountStillExists,
      firstAccountUsername: accounts[0]?.username,
      firstAccountWallet: accounts[0]?.walletAddress,
    });

    // If current account is still valid, keep it
    if (currentAccountStillExists) {
      console.log('🔍 [useSelectedAccount] ✅ Keeping current account', {
        username: selectedAccount?.username,
      });
      return;
    }

    // Otherwise, select the first account
    if (!selectedAccount) {
      console.log(
        '🔍 [useSelectedAccount] 🆕 Setting first account (none selected)',
        {
          username: accounts[0]?.username,
          wallet: accounts[0]?.walletAddress,
        }
      );
    } else {
      console.log(
        '🔍 [useSelectedAccount] 🔄 Replacing stale account with first',
        {
          oldUsername: selectedAccount.username,
          newUsername: accounts[0]?.username,
        }
      );
    }
    setGlobalState('selectedAccount', accounts[0]);
  }, [accounts, selectedAccount]);

  /**
   * Manually select an account by username
   * Finds the account in the accounts list and sets it as selected
   */
  const selectAccount = useCallback(
    (username: string) => {
      const account = accounts.find(acc => acc.username === username);
      if (account) {
        setGlobalState('selectedAccount', account);
      } else {
        console.warn(
          `⚠️ useSelectedAccount: Cannot select account "${username}" - not found in accounts list`
        );
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

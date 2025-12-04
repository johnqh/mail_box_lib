/**
 * useMailAccount Hook
 * Central business logic hook for the Mail application
 * Manages account selection and authentication orchestration
 */

import { useCallback } from 'react';
import {
  NetworkClient,
  Optional,
  WildduckConfig,
  WildduckUserAuth,
} from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { WildDuckAccount } from './useWalletAccounts';
import { useSelectedAccount } from './useSelectedAccount';
import { useAccountWildduckAuth } from './useAccountWildduckAuth';

/**
 * Return type for useMailAccount hook
 */
export interface UseMailAccountReturn {
  /** Currently selected account */
  selectedAccount: Optional<WildDuckAccount>;
  /** Function to select an account */
  setSelectedAccount: (account: Optional<WildDuckAccount>) => void;
  /** WildDuck authentication for the selected account */
  wildduckUserAuth: Optional<WildduckUserAuth>;
  /** All available wallet accounts */
  accounts: WildDuckAccount[];
  /** Function to refresh wallet accounts */
  refreshAccounts: () => Promise<void>;
}

/**
 * Hook to manage mail application business logic
 *
 * Orchestrates:
 * - Account selection (auto-selects first account if none selected)
 * - WildDuck authentication for the selected account
 *
 * @param indexerBackendUrl - Indexer API endpoint URL
 * @param wildduckConfig - WildDuck configuration
 * @param storage - Storage service for caching
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedAccount, wildduckUserAuth, and account management functions
 *
 * @example
 * ```tsx
 * function MailApp() {
 *   const {
 *     selectedAccount,
 *     setSelectedAccount,
 *     wildduckUserAuth,
 *     accounts,
 *   } = useMailAccount(
 *     'https://indexer.example.com',
 *     { backendUrl: 'https://wildduck.example.com', apiToken: '' },
 *     storage,
 *     false
 *   );
 *
 *   return (
 *     <div>
 *       <AccountSelector
 *         accounts={accounts}
 *         selected={selectedAccount}
 *         onSelect={setSelectedAccount}
 *       />
 *       <MailboxList wildduckUserAuth={wildduckUserAuth} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailAccount(
  networkClient: NetworkClient,
  indexerBackendUrl: string,
  wildduckConfig: WildduckConfig,
  storage: StorageService,
  devMode: boolean = false
): UseMailAccountReturn {
  // Use useSelectedAccount which handles account selection logic
  const { selectedAccount, selectAccount, accounts, refreshAccounts } =
    useSelectedAccount(networkClient, indexerBackendUrl, devMode);

  // Get authentication for the selected account using username
  const wildduckUserAuth = useAccountWildduckAuth({
    networkClient,
    username: selectedAccount?.username,
    config: wildduckConfig,
    storage,
    devMode,
  });

  // Wrapper function to convert account object to username for selectAccount
  const setSelectedAccount = useCallback(
    (account: Optional<WildDuckAccount>) => {
      if (account) {
        selectAccount(account.username);
      }
    },
    [selectAccount]
  );

  return {
    selectedAccount,
    setSelectedAccount,
    wildduckUserAuth,
    accounts,
    refreshAccounts,
  };
}

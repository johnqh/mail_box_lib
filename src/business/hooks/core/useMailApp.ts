/**
 * useMailApp Hook
 * Central business logic hook for the Mail application
 * Orchestrates account management and authentication
 */

import { Optional, WildduckConfig, WildduckUserAuth } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { useSelectedAccount } from './useSelectedAccount';
import type { WildDuckAccount } from './useWalletAccounts';

/**
 * Return type for useMailApp hook
 */
export interface UseMailAppReturn {
  /** Currently selected account */
  selectedAccount: Optional<WildDuckAccount>;
  /** Function to select an account by username */
  selectAccount: (username: string) => void;
  /** WildDuck authentication for the selected account */
  wildduckAuth: Optional<WildduckUserAuth>;
  /** All available wallet accounts */
  accounts: WildDuckAccount[];
  /** Function to refresh wallet accounts */
  refreshAccounts: () => Promise<void>;
}

/**
 * Hook to manage mail application business logic
 *
 * Orchestrates:
 * - Account selection and authentication (via useSelectedAccount)
 * - Provides a unified interface for mail app functionality
 *
 * @param indexerBackendUrl - Indexer API endpoint URL
 * @param wildduckConfig - WildDuck configuration
 * @param storage - Storage service for caching
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedAccount, wildduckAuth, and account management functions
 *
 * @example
 * ```tsx
 * function MailApp() {
 *   const {
 *     selectedAccount,
 *     selectAccount,
 *     wildduckAuth,
 *     accounts,
 *   } = useMailApp(
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
 *         onSelect={(account) => selectAccount(account.username)}
 *       />
 *       <MailboxList wildduckAuth={wildduckAuth} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailApp(
  indexerBackendUrl: string,
  wildduckConfig: WildduckConfig,
  storage: StorageService,
  devMode: boolean = false
): UseMailAppReturn {
  // useSelectedAccount manages everything: accounts list, selection logic, and authentication
  const {
    selectedAccount,
    wildduckAuth,
    selectAccount,
    accounts,
    refreshAccounts,
  } = useSelectedAccount(
    indexerBackendUrl,
    wildduckConfig.apiToken,
    storage,
    devMode
  );

  return {
    selectedAccount,
    selectAccount,
    wildduckAuth,
    accounts,
    refreshAccounts,
  };
}

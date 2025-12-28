/**
 * useMailApp Hook
 * Central business logic hook for the Mail application
 * Manages account selection and authentication orchestration
 */

import { useCallback, useEffect, useRef } from 'react';

// Debug: Track hook instances
let mailAppInstanceCounter = 0;
import { NetworkClient, Optional } from '@sudobility/types';
import { WildduckConfig, WildduckUserAuth } from '@sudobility/mail_box_types';
import type { StorageService } from '@sudobility/di';
import { WildDuckAccount } from './useWalletAccounts';
import { useSelectedAccount } from './useSelectedAccount';
import { useAccountWildduckAuth } from './useAccountWildduckAuth';

/**
 * Return type for useMailApp hook
 */
export interface UseMailAppReturn {
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
 *         onSelect={setSelectedAccount}
 *       />
 *       <MailboxList wildduckUserAuth={wildduckUserAuth} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailApp(
  networkClient: NetworkClient,
  indexerBackendUrl: string,
  wildduckConfig: WildduckConfig,
  storage: StorageService,
  devMode: boolean = false
): UseMailAppReturn {
  // Debug: Track this hook instance
  const instanceIdRef = useRef<number | null>(null);
  if (instanceIdRef.current === null) {
    instanceIdRef.current = ++mailAppInstanceCounter;
    console.log(
      `📧 [useMailApp] NEW INSTANCE #${instanceIdRef.current} created`
    );
  }
  const instanceId = instanceIdRef.current;

  // Use useSelectedAccount which handles account selection logic
  const { selectedAccount, selectAccount, accounts, refreshAccounts } =
    useSelectedAccount(networkClient, indexerBackendUrl, devMode);

  // Track selectedAccount reference changes
  const prevSelectedAccountRef = useRef<typeof selectedAccount>(undefined);
  useEffect(() => {
    const prev = prevSelectedAccountRef.current;
    const curr = selectedAccount;
    if (prev !== curr) {
      console.log(
        `📧 [useMailApp #${instanceId}] selectedAccount REFERENCE CHANGED:`,
        {
          prevUsername: prev?.username,
          currUsername: curr?.username,
          prevWalletAddress: prev?.walletAddress?.substring(0, 10),
          currWalletAddress: curr?.walletAddress?.substring(0, 10),
          areSameObject: prev === curr,
        }
      );
      prevSelectedAccountRef.current = curr;
    }
  });

  // Get authentication for the selected account using username
  const wildduckUserAuth = useAccountWildduckAuth({
    networkClient,
    username: selectedAccount?.username,
    config: wildduckConfig,
    storage,
    devMode,
  });

  // Debug logging - log on every render
  console.log(`📧 [useMailApp #${instanceId}] RENDER:`, {
    selectedAccount: selectedAccount?.username,
    selectedAccountWallet: selectedAccount?.walletAddress?.substring(0, 10),
    accountsCount: accounts.length,
    accountsList: accounts.map(a => a.username),
    hasWildduckAuth: !!wildduckUserAuth,
    wildduckUserId: wildduckUserAuth?.userId,
  });

  // Track what changed
  useEffect(() => {
    console.log(
      `📧 [useMailApp #${instanceId}] useEffect: selectedAccount CHANGED to:`,
      selectedAccount?.username
    );
  }, [selectedAccount, instanceId]);

  useEffect(() => {
    console.log(
      `📧 [useMailApp #${instanceId}] useEffect: accounts CHANGED, count:`,
      accounts.length,
      'list:',
      accounts.map(a => a.username)
    );
  }, [accounts, instanceId]);

  useEffect(() => {
    console.log(
      `📧 [useMailApp #${instanceId}] useEffect: wildduckUserAuth CHANGED, userId:`,
      wildduckUserAuth?.userId
    );
  }, [wildduckUserAuth, instanceId]);

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

/**
 * useSelectedAccount Hook
 * Manages the currently selected account from available wallet accounts
 * Automatically updates when wallet accounts change
 */

import { Optional } from '@johnqh/types';
import {
  useWildduckAuth,
  WildduckConfig,
  WildduckUserAuth,
} from '@johnqh/wildduck_client';
import { useEffect } from 'react';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useGlobalWalletAccounts, WildDuckAccount } from './useWalletAccounts';
import { useWalletStatus } from './useWalletStatus';

/**
 * Global selected account state - shared across all components
 */
export const useGlobalSelectedAccount = createGlobalState<
  Optional<WildDuckAccount>
>('selectedAccount', null);

/**
 * Global WildDuck authentication state - shared across all components
 */
export const useGlobalWildduckAuth = createGlobalState<
  Optional<WildduckUserAuth>
>('wildduckAuth', undefined);

/**
 * Return type for useSelectedAccount hook
 */
export interface UseSelectedAccountReturn {
  /** The currently selected account (null if none available) */
  selectedAccount: Optional<WildDuckAccount>;
  /** WildDuck authentication object (undefined if not authenticated) */
  wildduckAuth: Optional<WildduckUserAuth>;
}

/**
 * Hook to manage the currently selected account
 *
 * Observes wallet accounts and automatically:
 * - Sets account to null when no accounts are available
 * - Keeps current account if it's still in the list
 * - Selects first account if current account is not in the list
 * - Authenticates with WildDuck when account changes
 *
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedAccount and wildduckAuth
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedAccount, wildduckAuth } = useSelectedAccount(
 *     'https://wildduck.example.com',
 *     'your-api-token',
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
 *       {wildduckAuth && <span>Authenticated</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelectedAccount(
  endpointUrl: string,
  apiToken: string,
  devMode: boolean = false
): UseSelectedAccountReturn {
  const [accounts] = useGlobalWalletAccounts();
  const [selectedAccount] = useGlobalSelectedAccount();
  const { indexerAuth } = useWalletStatus();
  const [wildduckAuth, setWildduckAuthGlobal] = useGlobalWildduckAuth();

  const config: WildduckConfig = {
    backendUrl: endpointUrl,
    apiToken,
  };
  const { authenticate } = useWildduckAuth(config, devMode);

  // Manage selected account selection
  useEffect(() => {
    // If no accounts, clear selection
    if (accounts.length === 0) {
      if (selectedAccount !== null) {
        setGlobalState('selectedAccount', null);
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

    // If current account is still valid, keep it
    if (currentAccountStillExists) {
      return;
    }

    // Otherwise, select the first account
    setGlobalState('selectedAccount', accounts[0]);
  }, [accounts, selectedAccount]);

  // Authenticate with WildDuck when selected account changes
  useEffect(() => {
    if (!selectedAccount || !indexerAuth) {
      setWildduckAuthGlobal(undefined);
      return;
    }

    // Call authenticate
    (async () => {
      try {
        console.log(
          'useSelectedAccount: authenticating with indexerAuth:',
          indexerAuth
        );
        const response = await authenticate({
          username: selectedAccount.username,
          message: indexerAuth.message,
          signature: indexerAuth.signature,
          signer: indexerAuth.signer,
        });

        if (response && response.success) {
          const token = response.token;
          const userId = response.id;
          if (token && userId) {
            // Construct WildduckUserAuth from response
            const auth: WildduckUserAuth = {
              userId,
              accessToken: token,
            };
            setWildduckAuthGlobal(auth);
          } else {
            setWildduckAuthGlobal(undefined);
          }
        } else {
          setWildduckAuthGlobal(undefined);
        }
      } catch (error) {
        console.error('WildDuck authentication failed:', error);
        setWildduckAuthGlobal(undefined);
      }
    })();
  }, [selectedAccount, indexerAuth, authenticate, setWildduckAuthGlobal]);

  return { selectedAccount, wildduckAuth };
}

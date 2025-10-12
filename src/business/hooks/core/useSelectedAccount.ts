/**
 * useSelectedAccount Hook
 * Manages the currently selected account from available wallet accounts
 * Automatically updates when wallet accounts change
 */

import { Optional } from '@sudobility/types';
import {
  useWildduckAuth,
  WildduckConfig,
  WildduckUserAuth,
} from '@sudobility/wildduck_client';
import { useEffect, useMemo } from 'react';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useGlobalWalletAccounts, WildDuckAccount } from './useWalletAccounts';
import { useWalletStatus } from './useWalletStatus';

/**
 * Global authentication tracking to prevent duplicate authentication calls
 * across multiple component instances
 */
let authenticationInProgress: Optional<string> = null;
let lastAuthenticatedKey: Optional<string> = null;

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
  // SINGLETON PATTERN: Only one component instance should perform authentication
  useEffect(() => {
    if (!selectedAccount || !indexerAuth) {
      // Clear authentication if prerequisites are missing
      if (wildduckAuth) {
        setWildduckAuthGlobal(undefined);
      }
      authenticationInProgress = null;
      lastAuthenticatedKey = null;
      return;
    }

    // Create a stable key to detect actual changes
    const authKey = `${selectedAccount.username}:${indexerAuth.message}:${indexerAuth.signature}`;

    // Skip if we've already authenticated for this key
    if (lastAuthenticatedKey === authKey) {
      console.log(
        `✅ useSelectedAccount: Already authenticated for ${selectedAccount.username}, skipping`
      );
      return;
    }

    // Skip if another component instance is currently authenticating
    if (authenticationInProgress === authKey) {
      console.log(
        `⏳ useSelectedAccount: Authentication already in progress for ${selectedAccount.username}, skipping`
      );
      return;
    }

    // Mark authentication as in progress
    authenticationInProgress = authKey;

    // Call authenticate only once per unique account/signature combination
    (async () => {
      try {
        console.log(
          `🔐 useSelectedAccount: Starting authentication for ${selectedAccount.username}`
        );
        const response = await authenticate({
          username: selectedAccount.username,
          message: indexerAuth.message,
          signature: indexerAuth.signature,
          signer: indexerAuth.signer,
          token: true,
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
            console.log(
              `✅ useSelectedAccount: WildDuck auth successful for ${selectedAccount.username}`
            );
            setWildduckAuthGlobal(auth);
            lastAuthenticatedKey = authKey;
          } else {
            console.warn(
              '⚠️ useSelectedAccount: Missing token or userId in response:',
              { token, userId }
            );
            setWildduckAuthGlobal(undefined);
            lastAuthenticatedKey = null;
          }
        } else {
          console.warn(
            '⚠️ useSelectedAccount: WildDuck authenticate failed or unsuccessful:',
            response
          );
          setWildduckAuthGlobal(undefined);
          lastAuthenticatedKey = null;
        }
      } catch (error) {
        console.error('WildDuck authentication failed:', error);
        setWildduckAuthGlobal(undefined);
        lastAuthenticatedKey = null;
      } finally {
        // Clear the in-progress flag
        authenticationInProgress = null;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAccount?.username,
    indexerAuth?.message,
    indexerAuth?.signature,
    indexerAuth?.signer,
  ]);

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when selectedAccount or wildduckAuth actually change
  return useMemo<UseSelectedAccountReturn>(
    () => ({ selectedAccount, wildduckAuth }),
    [selectedAccount, wildduckAuth]
  );
}

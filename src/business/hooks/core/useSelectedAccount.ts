/**
 * useSelectedAccount Hook
 * Manages the currently selected account from available wallet accounts
 * Automatically updates when wallet accounts change
 */

import { Optional, WildduckConfig, WildduckUserAuth } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { useWildduckAuth } from '@sudobility/wildduck_client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useWalletAccounts, WildDuckAccount } from './useWalletAccounts';
import { useWalletStatus } from './useWalletStatus';
import { ReferralConsumptionHelper } from '../../../utils/ReferralConsumptionHelper';

/**
 * Global authentication tracking to prevent duplicate authentication calls
 * across multiple component instances
 *
 * We track by username + signer combination to ensure:
 * 1. Each wallet address gets its own authentication
 * 2. Switching accounts with different wallet addresses re-authenticates
 * 3. Same wallet address with same username doesn't re-authenticate
 */
let authenticationInProgress: Optional<string> = undefined;
let lastAuthenticatedKey: Optional<string> = undefined; // Format: "username:signer"

/**
 * Global authentication cache - maps "username:signer" to auth with metadata
 * This allows multiple accounts to each have their own authentication
 */
interface CachedAuth {
  auth: WildduckUserAuth;
  username: string; // Track which account this auth belongs to
}
const authCache = new Map<string, CachedAuth>();

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
  /** WildDuck authentication object (undefined if not authenticated) */
  wildduckAuth: Optional<WildduckUserAuth>;
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
 * - Authenticates with WildDuck when account changes
 *
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param storage - Storage service for persisting auth tokens
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedAccount and wildduckAuth
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const storage = useStorageService();
 *   const { selectedAccount, wildduckAuth } = useSelectedAccount(
 *     'https://wildduck.example.com',
 *     'your-api-token',
 *     storage,
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
  storage: StorageService,
  devMode: boolean
): UseSelectedAccountReturn {
  const { accounts, refresh: refreshAccounts } = useWalletAccounts(
    endpointUrl,
    devMode
  );
  const [selectedAccount] = useGlobalSelectedAccount();
  const { indexerAuth } = useWalletStatus();

  // Local state to trigger re-renders when auth changes
  const [authUpdateCounter, setAuthUpdate] = useState(0);

  // Get current auth from cache based on selected account
  const wildduckAuth = useMemo(() => {
    if (!selectedAccount || !indexerAuth) {
      return undefined;
    }
    const authKey = `${selectedAccount.username.toLowerCase()}:${indexerAuth.signer}`;
    const cached = authCache.get(authKey);
    // Validate that cached auth matches the current selected account
    if (
      cached &&
      cached.username.toLowerCase() === selectedAccount.username.toLowerCase()
    ) {
      return cached.auth;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, indexerAuth, authUpdateCounter]);

  const config: WildduckConfig = {
    backendUrl: endpointUrl,
    apiToken,
  };
  const { authenticate } = useWildduckAuth(config, storage, devMode);

  // Track the authentication key to prevent repeated authentication
  // Only re-authenticate when the key actually changes
  const authKeyRef = useRef<Optional<string>>(undefined);

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
      authenticationInProgress = undefined;
      lastAuthenticatedKey = undefined;
      authKeyRef.current = undefined;
      return;
    }

    // Normalize username to lowercase to handle case differences
    const normalizedUsername = selectedAccount.username.toLowerCase();
    // Create unique key combining username and signer to handle multiple wallets
    const authKey = `${normalizedUsername}:${indexerAuth.signer}`;

    // CRITICAL: Skip if the authKey hasn't actually changed
    // This prevents repeated authentication calls when the effect re-runs
    // due to object reference changes in dependencies
    if (authKeyRef.current === authKey) {
      return;
    }

    // Update the ref to track current authKey
    authKeyRef.current = authKey;

    // Check if we already have auth cached for this account
    const cachedAuth = authCache.get(authKey);

    // Skip if we've already authenticated for this username + signer combination
    // BUT: If there's a pending referral code, allow re-authentication to include it
    const hasPendingReferral = ReferralConsumptionHelper.hasPending();
    if (cachedAuth && lastAuthenticatedKey === authKey && !hasPendingReferral) {
      // IMPORTANT: Early return to prevent repeated authentication calls
      return;
    }

    // If there's a pending referral code for an already-authenticated user
    if (lastAuthenticatedKey === authKey && hasPendingReferral) {
      // Clear the last authenticated key so authentication proceeds
      lastAuthenticatedKey = undefined;
    }

    // Skip if another component instance is currently authenticating this combination
    if (authenticationInProgress === authKey) {
      // IMPORTANT: Early return to prevent duplicate authentication calls
      return;
    }

    // Mark authentication as in progress for this username + signer combination
    authenticationInProgress = authKey;

    // Call authenticate only once per unique account/signature combination
    (async () => {
      try {
        // Get referral code if available (consume removes it from storage)
        const referralCode = ReferralConsumptionHelper.consume();

        const response = await authenticate({
          username: selectedAccount.username,
          message: indexerAuth.message,
          signature: indexerAuth.signature,
          signer: indexerAuth.signer,
          token: true,
          ...(referralCode && { referralCode }), // Include referral code if available
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
            // Store auth in cache for this specific account with username for validation
            authCache.set(authKey, {
              auth,
              username: selectedAccount.username,
            });
            lastAuthenticatedKey = authKey;
            // Trigger re-render to update wildduckAuth
            setAuthUpdate(prev => prev + 1);

            // Clean URL parameter if referral code was consumed
            if (referralCode) {
              try {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.delete('referral');
                const newSearch = urlParams.toString();
                const newUrl = newSearch
                  ? `${window.location.pathname}?${newSearch}`
                  : window.location.pathname;
                window.history.replaceState({}, '', newUrl);
              } catch (error) {
                console.warn('Failed to clean referral URL parameter:', error);
              }
            }
          } else {
            console.error(
              '🔴 [useSelectedAccount] Missing token or userId in response:',
              { token, userId }
            );
            // Clear auth from cache
            authCache.delete(authKey);
            lastAuthenticatedKey = undefined;
            setAuthUpdate(prev => prev + 1);
          }
        } else {
          console.error(
            '🔴 [useSelectedAccount] WildDuck authenticate failed or unsuccessful:',
            response
          );
          // Clear auth from cache
          authCache.delete(authKey);
          lastAuthenticatedKey = undefined;
          setAuthUpdate(prev => prev + 1);
        }
      } catch (error) {
        console.error('🔴 [useSelectedAccount] Authentication error:', error);
        // Clear auth from cache
        authCache.delete(authKey);
        lastAuthenticatedKey = undefined;
        setAuthUpdate(prev => prev + 1);
      } finally {
        // Clear the in-progress flag
        authenticationInProgress = undefined;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAccount?.username,
    indexerAuth?.message,
    indexerAuth?.signature,
    indexerAuth?.signer,
  ]);

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
  // Only recreate when selectedAccount or wildduckAuth actually change
  return useMemo<UseSelectedAccountReturn>(
    () => ({
      selectedAccount,
      wildduckAuth,
      selectAccount,
      accounts,
      refreshAccounts,
    }),
    [selectedAccount, wildduckAuth, selectAccount, accounts, refreshAccounts]
  );
}

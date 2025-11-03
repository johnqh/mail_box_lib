/**
 * useSelectedAccount Hook
 * Manages the currently selected account from available wallet accounts
 * Automatically updates when wallet accounts change
 */

import { Optional, WildduckConfig, WildduckUserAuth } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { useWildduckAuth } from '@sudobility/wildduck_client';
import { useEffect, useMemo } from 'react';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useGlobalWalletAccounts, WildDuckAccount } from './useWalletAccounts';
import { useWalletStatus } from './useWalletStatus';
import { ReferralConsumptionHelper } from '../../../utils/ReferralConsumptionHelper';

/**
 * Global authentication tracking to prevent duplicate authentication calls
 * across multiple component instances
 *
 * We track by username only - not by message/signature - because:
 * 1. Once authenticated for a username, we don't need to re-authenticate
 * 2. Different account objects with same username shouldn't trigger re-auth
 */
let authenticationInProgress: Optional<string> = null;
let lastAuthenticatedUsername: Optional<string> = null;

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
  const { authenticate } = useWildduckAuth(config, storage, devMode);

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
      lastAuthenticatedUsername = null;
      return;
    }

    // Normalize username to lowercase to handle case differences
    const normalizedUsername = selectedAccount.username.toLowerCase();

    // Skip if we've already authenticated for this username
    // BUT: If there's a pending referral code, allow re-authentication to include it
    const hasPendingReferral = ReferralConsumptionHelper.hasPending();
    if (
      lastAuthenticatedUsername === normalizedUsername &&
      !hasPendingReferral
    ) {
      console.log(
        `✅ [useSelectedAccount] Skipping duplicate authentication for: ${normalizedUsername}`
      );
      return;
    }

    // If there's a pending referral code for an already-authenticated user, log it
    if (
      lastAuthenticatedUsername === normalizedUsername &&
      hasPendingReferral
    ) {
      console.log(
        `🎁 [useSelectedAccount] Re-authenticating ${normalizedUsername} to include referral code`
      );
      // Clear the last authenticated username so authentication proceeds
      lastAuthenticatedUsername = null;
    }

    console.log(
      `🔐 [useSelectedAccount] Authenticating with username: ${normalizedUsername}`
    );

    // Skip if another component instance is currently authenticating this username
    if (authenticationInProgress === normalizedUsername) {
      console.log(
        `⏳ [useSelectedAccount] Authentication already in progress for: ${normalizedUsername}`
      );
      return;
    }

    // Mark authentication as in progress for this username
    authenticationInProgress = normalizedUsername;

    // Call authenticate only once per unique account/signature combination
    (async () => {
      try {
        // Get referral code if available (consume removes it from storage)
        const referralCode = ReferralConsumptionHelper.consume();
        console.log(
          `🔍 [useSelectedAccount] Referral code from ReferralConsumptionHelper.consume():`,
          referralCode
        );

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
            setWildduckAuthGlobal(auth);
            lastAuthenticatedUsername = normalizedUsername;

            // Clean URL parameter if referral code was consumed
            if (referralCode) {
              console.log(
                '🧹 [useSelectedAccount] Cleaning referral code from URL after successful authentication'
              );
              try {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.delete('referral');
                const newSearch = urlParams.toString();
                const newUrl = newSearch
                  ? `${window.location.pathname}?${newSearch}`
                  : window.location.pathname;
                window.history.replaceState({}, '', newUrl);
                console.log('✅ [useSelectedAccount] URL cleaned:', newUrl);
              } catch (error) {
                console.warn(
                  '⚠️ [useSelectedAccount] Failed to clean URL:',
                  error
                );
              }
            }
          } else {
            console.warn(
              '⚠️ useSelectedAccount: Missing token or userId in response:',
              { token, userId }
            );
            setWildduckAuthGlobal(undefined);
            lastAuthenticatedUsername = null;
          }
        } else {
          console.warn(
            '⚠️ useSelectedAccount: WildDuck authenticate failed or unsuccessful:',
            response
          );
          setWildduckAuthGlobal(undefined);
          lastAuthenticatedUsername = null;
        }
      } catch (error) {
        console.error('WildDuck authentication failed:', error);
        setWildduckAuthGlobal(undefined);
        lastAuthenticatedUsername = null;
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

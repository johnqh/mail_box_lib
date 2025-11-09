/**
 * useAccountWildduckAuth Hook
 * Manages WildDuck authentication per account
 * Observes selectedAccount and returns appropriate auth
 */

import { Optional, WildduckConfig, WildduckUserAuth } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { useWildduckAuth } from '@sudobility/wildduck_client';
import { useCallback, useEffect, useState } from 'react';
import { useWalletStatus } from './useWalletStatus';
import { ReferralConsumptionHelper } from '../../../utils/ReferralConsumptionHelper';

/**
 * Cached authentication data per account
 */
interface CachedAuth {
  auth: WildduckUserAuth;
  username: string;
}

/**
 * Global authentication cache - maps "username:signer" to auth
 */
const authCache = new Map<string, CachedAuth>();

/**
 * Track authentication in progress to prevent duplicates
 */
let authenticationInProgress: Optional<string> = null;
let lastAuthenticatedKey: Optional<string> = null;

/**
 * Clear all authentication cache
 * Call this when disconnecting wallet to ensure clean state
 */
export function clearAccountWildduckAuthCache(): void {
  authCache.clear();
  authenticationInProgress = null;
  lastAuthenticatedKey = null;
}

/**
 * Hook to manage WildDuck authentication for a specific account
 *
 * @param username Account username to authenticate (can be wallet address or ENS/SNS name)
 * @param config WildDuck configuration
 * @param storage Storage service for caching
 * @param devMode Development mode flag
 * @returns WildDuck authentication for the account (undefined if not authenticated yet)
 *
 * @example
 * ```tsx
 * const wildduckAuth = useAccountWildduckAuth(
 *   '0x123...abc',
 *   config,
 *   storage,
 *   false
 * );
 *
 * if (!wildduckAuth) {
 *   return <div>Authenticating...</div>;
 * }
 *
 * return <MailboxList wildduckAuth={wildduckAuth} />;
 * ```
 */
export function useAccountWildduckAuth(
  username: Optional<string>,
  config: WildduckConfig,
  storage: StorageService,
  devMode: boolean
): Optional<WildduckUserAuth> {
  const { indexerAuth } = useWalletStatus();
  const { authenticate } = useWildduckAuth(config, storage, devMode);

  // Local state to trigger re-renders when auth changes
  const [authUpdateCounter, setAuthUpdate] = useState(0);

  // Get current auth from cache based on username
  const wildduckAuth = useCallback((): Optional<WildduckUserAuth> => {
    if (!username || !indexerAuth) {
      return undefined;
    }
    const authKey = `${username.toLowerCase()}:${indexerAuth.signer}`;
    const cached = authCache.get(authKey);
    // Validate that cached auth matches the current username
    if (cached && cached.username.toLowerCase() === username.toLowerCase()) {
      return cached.auth;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, indexerAuth, authUpdateCounter])();

  // Authenticate when username changes
  useEffect(() => {
    if (!username || !indexerAuth) {
      authenticationInProgress = null;
      lastAuthenticatedKey = null;
      return;
    }

    const normalizedUsername = username.toLowerCase();
    const authKey = `${normalizedUsername}:${indexerAuth.signer}`;

    // Check if we already have auth cached
    const cachedAuth = authCache.get(authKey);

    // Skip if already authenticated
    const hasPendingReferral = ReferralConsumptionHelper.hasPending();
    if (cachedAuth && lastAuthenticatedKey === authKey && !hasPendingReferral) {
      return;
    }

    // Handle referral code re-authentication
    if (lastAuthenticatedKey === authKey && hasPendingReferral) {
      lastAuthenticatedKey = null;
    }

    // Skip if another instance is authenticating
    if (authenticationInProgress === authKey) {
      return;
    }

    // Mark as in progress
    authenticationInProgress = authKey;

    (async () => {
      try {
        const referralCode = ReferralConsumptionHelper.consume();

        const response = await authenticate({
          username,
          message: indexerAuth.message,
          signature: indexerAuth.signature,
          signer: indexerAuth.signer,
          token: true,
          ...(referralCode && { referralCode }),
        });

        if (response && response.success) {
          const token = response.token;
          const userId = response.id;
          if (token && userId) {
            const auth: WildduckUserAuth = {
              userId,
              accessToken: token,
            };
            // Store in cache
            authCache.set(authKey, {
              auth,
              username,
            });
            lastAuthenticatedKey = authKey;
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
            console.warn('⚠️ useAccountWildduckAuth: Missing token or userId');
            authCache.delete(authKey);
            lastAuthenticatedKey = null;
            setAuthUpdate(prev => prev + 1);
          }
        } else {
          console.warn(
            '⚠️ useAccountWildduckAuth: Authentication failed',
            response
          );
          authCache.delete(authKey);
          lastAuthenticatedKey = null;
          setAuthUpdate(prev => prev + 1);
        }
      } catch (error) {
        console.error('❌ useAccountWildduckAuth: Error:', error);
        authCache.delete(authKey);
        lastAuthenticatedKey = null;
        setAuthUpdate(prev => prev + 1);
      } finally {
        authenticationInProgress = null;
      }
    })();
  }, [username, indexerAuth, authenticate]);

  return wildduckAuth;
}

/**
 * useAccountWildduckAuth Hook
 * Manages WildDuck authentication per account
 * Observes selectedAccount and returns appropriate auth
 */

import {
  NetworkClient,
  Optional,
  WildduckConfig,
  WildduckUserAuth,
} from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { useWildduckAuth } from '@sudobility/wildduck_client';
import { useEffect, useState } from 'react';
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

/**
 * Clear all authentication cache
 * Call this when disconnecting wallet to ensure clean state
 */
export function clearAccountWildduckAuthCache(): void {
  authCache.clear();
  authenticationInProgress = null;
}

/**
 * Hook to manage WildDuck authentication for a specific account
 *
 * @param networkClient Network client for API calls
 * @param username Account username to authenticate (can be wallet address or ENS/SNS name)
 * @param config WildDuck configuration
 * @param storage Storage service for caching
 * @param devMode Development mode flag
 * @returns WildDuck authentication for the account (undefined if not authenticated yet)
 *
 * @example
 * ```tsx
 * const networkClient = useNetworkClient();
 * const wildduckUserAuth = useAccountWildduckAuth(
 *   networkClient,
 *   '0x123...abc',
 *   config,
 *   storage,
 *   false
 * );
 *
 * if (!wildduckUserAuth) {
 *   return <div>Authenticating...</div>;
 * }
 *
 * return <MailboxList wildduckUserAuth={wildduckUserAuth} />;
 * ```
 */
export function useAccountWildduckAuth(
  networkClient: NetworkClient,
  username: Optional<string>,
  config: WildduckConfig,
  storage: StorageService,
  devMode: boolean
): Optional<WildduckUserAuth> {
  const { indexerAuth } = useWalletStatus();
  const authHook = useWildduckAuth(networkClient, config, storage, devMode);
  const { authenticate } = authHook;

  // Use React state for the auth - this is cleaner than the cache + counter pattern
  const [wildduckUserAuth, setWildduckAuth] = useState<
    Optional<WildduckUserAuth>
  >(() => {
    // Initialize from cache if available
    if (!username || !indexerAuth) return undefined;
    const authKey = `${username.toLowerCase()}:${indexerAuth.signer}`;
    const cached = authCache.get(authKey);
    return cached?.auth;
  });

  // Authenticate when username changes
  useEffect(() => {
    if (!username || !indexerAuth) {
      setWildduckAuth(undefined);
      authenticationInProgress = null;
      return;
    }

    const normalizedUsername = username.toLowerCase();
    const authKey = `${normalizedUsername}:${indexerAuth.signer}`;

    // Check if we already have auth cached
    const cachedAuth = authCache.get(authKey);

    // Skip if already authenticated
    const hasPendingReferral = ReferralConsumptionHelper.hasPending();
    if (cachedAuth && !hasPendingReferral) {
      // Ensure state matches cache
      if (wildduckUserAuth?.userId !== cachedAuth.auth.userId) {
        setWildduckAuth(cachedAuth.auth);
      }
      return;
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
              username,
              userId,
              accessToken: token,
            };
            // Store in cache
            authCache.set(authKey, {
              auth,
              username,
            });
            setWildduckAuth(auth);

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
              } catch {
                // Silently ignore URL parameter cleanup errors
              }
            }
          } else {
            authCache.delete(authKey);
            setWildduckAuth(undefined);
          }
        } else {
          authCache.delete(authKey);
          setWildduckAuth(undefined);
        }
      } catch (error) {
        console.error('❌ useAccountWildduckAuth: Error:', error);
        authCache.delete(authKey);
        setWildduckAuth(undefined);
      } finally {
        authenticationInProgress = null;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, indexerAuth, authenticate]);

  return wildduckUserAuth;
}

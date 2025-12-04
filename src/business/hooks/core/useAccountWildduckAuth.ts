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
import type { StorageService, URLService } from '@sudobility/di';
import { useWildduckAuth } from '@sudobility/wildduck_client';
import { useEffect, useState } from 'react';
import { useWalletStatus } from './useWalletStatus';
import type { ReferralConsumptionHelper } from '../../../utils/ReferralConsumptionHelper';

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
 * Configuration for useAccountWildduckAuth hook
 */
export interface AccountWildduckAuthConfig {
  /** Network client for API calls */
  networkClient: NetworkClient;
  /** Account username to authenticate (can be wallet address or ENS/SNS name) */
  username: Optional<string>;
  /** WildDuck configuration */
  config: WildduckConfig;
  /** Storage service for caching */
  storage: StorageService;
  /** Development mode flag */
  devMode: boolean;
  /** Referral helper for consuming referral codes (optional) */
  referralHelper?: ReferralConsumptionHelper;
  /** URL service for cleaning up URL parameters (optional) */
  urlService?: URLService;
}

/**
 * Hook to manage WildDuck authentication for a specific account
 *
 * @param options Configuration options for the hook
 * @returns WildDuck authentication for the account (undefined if not authenticated yet)
 *
 * @example
 * ```tsx
 * const networkClient = useNetworkClient();
 * const wildduckUserAuth = useAccountWildduckAuth({
 *   networkClient,
 *   username: '0x123...abc',
 *   config,
 *   storage,
 *   devMode: false,
 *   referralHelper: myReferralHelper,
 *   urlService: myUrlService,
 * });
 *
 * if (!wildduckUserAuth) {
 *   return <div>Authenticating...</div>;
 * }
 *
 * return <MailboxList wildduckUserAuth={wildduckUserAuth} />;
 * ```
 */
export function useAccountWildduckAuth(
  options: AccountWildduckAuthConfig
): Optional<WildduckUserAuth> {
  const {
    networkClient,
    username,
    config,
    storage,
    devMode,
    referralHelper,
    urlService,
  } = options;
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

    // Skip if already authenticated (check referral if helper is provided)
    const hasPendingReferral = referralHelper?.hasPending() ?? false;
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
        // Consume referral code if helper is provided
        const referralCode = referralHelper?.consume();

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

            // Clean URL parameter if referral code was consumed and URL service is provided
            if (referralCode && urlService) {
              try {
                urlService.removeQueryParam('referral');
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
  }, [username, indexerAuth, authenticate, referralHelper, urlService]);

  return wildduckUserAuth;
}
